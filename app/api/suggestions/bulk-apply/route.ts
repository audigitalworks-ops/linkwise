import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { decrypt } from "@/lib/crypto";
import { WordPressClient } from "@/lib/wordpress/client";
import { wrapAnchorInHtml } from "@/lib/wordpress/apply-link";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    const body = await req.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError("INVALID_INPUT", "Must provide an array of suggestion IDs.", 400);
    }

    // Maximum 25 items at once per PRD
    const targetIds = ids.slice(0, 25);
    const admin = createAdminClient();

    // Check user's subscription
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = (sub?.plan as PlanType) || "free";
    const limits = PLAN_LIMITS[plan];

    if (!limits.canUseBulkApply && targetIds.length > 1) {
      return apiError(
        "PLAN_LIMIT",
        "Bulk apply is available on Pro and Agency plans. Upgrade to apply multiple links at once.",
        403
      );
    }

    // Fetch suggestions
    const { data: suggestions, error: fetchErr } = await admin
      .from("suggestions")
      .select(`
        id,
        site_id,
        anchor_text,
        status,
        source_page:source_page_id(id, wp_id, wp_type, title, url),
        target_page:target_page_id(id, wp_id, wp_type, title, url),
        site:site_id(id, user_id, url, wp_username, wp_password_encrypted)
      `)
      .in("id", targetIds)
      .eq("status", "pending");

    if (fetchErr || !suggestions || suggestions.length === 0) {
      return apiError("NOT_FOUND", "No pending suggestions found to apply.", 404);
    }

    const appliedIds: string[] = [];
    const failedIds: string[] = [];

    // Client cache per site
    const clientCache = new Map<string, WordPressClient>();

    for (const sug of suggestions) {
      try {
        const siteData = sug.site as unknown as {
          id: string;
          user_id: string;
          url: string;
          wp_username: string;
          wp_password_encrypted: string;
        };

        if (siteData.user_id !== user.id) {
          failedIds.push(sug.id);
          continue;
        }

        let wpClient = clientCache.get(siteData.id);
        if (!wpClient) {
          const wpPassword = decrypt(siteData.wp_password_encrypted);
          wpClient = new WordPressClient({
            url: siteData.url,
            username: siteData.wp_username,
            appPasswordDecrypted: wpPassword,
          });
          clientCache.set(siteData.id, wpClient);
        }

        const sourcePage = sug.source_page as unknown as {
          id: string;
          wp_id: number;
          wp_type: "post" | "page";
        };
        const targetPage = sug.target_page as unknown as {
          id: string;
          url: string;
        };

        const postData = sourcePage.wp_type === "page"
          ? (await wpClient.getPages(1, 100)).find((p) => p.id === sourcePage.wp_id)
          : (await wpClient.getPosts(1, 100)).find((p) => p.id === sourcePage.wp_id);

        const originalContent = postData?.content?.rendered || "";

        const { updatedHtml, replaced } = wrapAnchorInHtml({
          htmlContent: originalContent,
          anchorText: sug.anchor_text,
          targetUrl: targetPage.url,
        });

        if (!replaced) {
          failedIds.push(sug.id);
          continue;
        }

        await wpClient.updatePost(sourcePage.wp_id, updatedHtml, sourcePage.wp_type);

        await admin.from("activity_log").insert({
          site_id: siteData.id,
          user_id: user.id,
          action: "link_applied",
          page_id: sourcePage.id,
          details: {
            suggestion_id: sug.id,
            original_content: originalContent,
            target_url: targetPage.url,
            anchor_text: sug.anchor_text,
            description: `Applied internal link "${sug.anchor_text}"`,
            target: targetPage.url,
          },
        });

        await admin
          .from("suggestions")
          .update({
            status: "applied",
            applied_at: new Date().toISOString(),
          })
          .eq("id", sug.id);

        appliedIds.push(sug.id);
      } catch {
        failedIds.push(sug.id);
      }
    }

    return apiSuccess({
      appliedCount: appliedIds.length,
      appliedIds,
      failedIds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bulk apply failed.";
    return apiError("INTERNAL", message, 500);
  }
}

