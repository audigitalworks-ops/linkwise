import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { decrypt } from "@/lib/crypto";
import { WordPressClient, validateWordPressUrl } from "@/lib/wordpress/client";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return apiError("INVALID_INPUT", "Link ID is required.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    // Check plan limits
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const userPlan = (sub?.plan as PlanType) || "free";
    const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

    if (!limits.canUseOrphansAndBroken) {
      return apiError(
        "PLAN_LIMIT",
        "Fixing broken links is available on Pro and Agency plans. Upgrade to fix broken links automatically.",
        403
      );
    }

    const body = await req.json();
    const { action, newUrl } = body as { action: "replace" | "remove"; newUrl?: string };

    if (!action || (action === "replace" && !newUrl)) {
      return apiError("INVALID_INPUT", "Action and valid new URL are required.", 400);
    }

    if (action === "replace" && newUrl) {
      try {
        validateWordPressUrl(newUrl);
      } catch {
        return apiError("INVALID_INPUT", "New URL must be a valid public HTTPS URL.", 400);
      }
    }

    const admin = createAdminClient();

    // 1. Fetch link with source page and site
    const { data: link, error: linkErr } = await admin
      .from("page_links")
      .select(`
        id,
        site_id,
        target_url,
        anchor_text,
        source_page:source_page_id(id, wp_id, wp_type, title, url),
        site:site_id(id, user_id, url, wp_username, wp_password_encrypted)
      `)
      .eq("id", id)
      .single();

    if (linkErr || !link || !link.site || !link.source_page) {
      return apiError("NOT_FOUND", "Broken link record not found.", 404);
    }

    const siteData = link.site as unknown as {
      id: string;
      user_id: string;
      url: string;
      wp_username: string;
      wp_password_encrypted: string;
    };

    if (siteData.user_id !== user.id) {
      return apiError("FORBIDDEN", "You do not own this site.", 403);
    }

    const sourcePage = link.source_page as unknown as {
      id: string;
      wp_id: number;
      wp_type: "post" | "page";
      url: string;
    };

    // 2. Connect to WordPress
    const wpPassword = decrypt(siteData.wp_password_encrypted);
    const wpClient = new WordPressClient({
      url: siteData.url,
      username: siteData.wp_username,
      appPasswordDecrypted: wpPassword,
    });

    const postData = sourcePage.wp_type === "page"
      ? (await wpClient.getPages(1, 100)).find((p) => p.id === sourcePage.wp_id)
      : (await wpClient.getPosts(1, 100)).find((p) => p.id === sourcePage.wp_id);

    const originalContent = postData?.content?.rendered || "";

    // 3. Process HTML with cheerio
    const $ = cheerio.load(originalContent, { xml: false }, false);
    let replaced = false;

    $("a").each((_, el) => {
      if (replaced) return;
      const $a = $(el);
      const href = $a.attr("href");

      if (href && (href === link.target_url || href.replace(/\/+$/, "") === link.target_url.replace(/\/+$/, ""))) {
        if (action === "replace" && newUrl) {
          $a.attr("href", newUrl);
          replaced = true;
        } else if (action === "remove") {
          // Replace link tag with its inner text
          $a.replaceWith($a.text());
          replaced = true;
        }
      }
    });

    if (!replaced) {
      return apiError("INVALID_INPUT", "Could not locate target link inside the source WordPress post.", 400);
    }

    const updatedContent = $.html();

    // 4. Update WordPress post
    await wpClient.updatePost(sourcePage.wp_id, updatedContent, sourcePage.wp_type);

    // 5. Update page_links record
    if (action === "replace" && newUrl) {
      await admin
        .from("page_links")
        .update({
          target_url: newUrl,
          http_status: 200,
          is_broken: false,
        })
        .eq("id", id);
    } else {
      await admin
        .from("page_links")
        .delete()
        .eq("id", id);
    }

    // 6. Log activity
    await admin.from("activity_log").insert({
      site_id: siteData.id,
      user_id: user.id,
      action: "broken_fixed",
      page_id: sourcePage.id,
      details: {
        link_id: link.id,
        action,
        old_url: link.target_url,
        new_url: newUrl,
        anchor_text: link.anchor_text,
        description: action === "replace"
          ? `Fixed broken link by redirecting to ${newUrl}`
          : `Removed broken link "${link.target_url}"`,
      },
    });

    return apiSuccess({ status: "fixed" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fix broken link.";
    return apiError("INTERNAL", message, 500);
  }
}

