import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { decrypt } from "@/lib/crypto";
import { WordPressClient } from "@/lib/wordpress/client";
import { wrapAnchorInHtml } from "@/lib/wordpress/apply-link";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";
import { parseWordPressHtml } from "@/lib/wordpress/parse-links";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return apiError("INVALID_INPUT", "Suggestion ID is required.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in to apply a link.", 401);
    }

    const admin = createAdminClient();

    // 1. Fetch suggestion with related pages and site
    const { data: suggestion, error: sugError } = await admin
      .from("suggestions")
      .select(`
        id,
        site_id,
        anchor_text,
        source_paragraph,
        relevance,
        status,
        source_page:source_page_id(id, wp_id, wp_type, title, url, path, content_text),
        target_page:target_page_id(id, wp_id, wp_type, title, url, path),
        site:site_id(id, user_id, url, wp_username, wp_password_encrypted)
      `)
      .eq("id", id)
      .single();

    if (sugError || !suggestion || !suggestion.site) {
      return apiError("NOT_FOUND", "Suggestion not found.", 404);
    }

    const siteData = suggestion.site as unknown as {
      id: string;
      user_id: string;
      url: string;
      wp_username: string;
      wp_password_encrypted: string;
    };

    if (siteData.user_id !== user.id) {
      return apiError("FORBIDDEN", "You do not have access to this site.", 403);
    }

    // 2. Check user's plan limit
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = (sub?.plan as PlanType) || "free";
    const limits = PLAN_LIMITS[plan];

    // Check count of pages scanned
    const { count: pagesCount } = await admin
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteData.id);

    if ((pagesCount || 0) > limits.pagesPerSiteLimit) {
      return apiError(
        "PLAN_LIMIT",
        `Upgrade to Pro to apply links on more than ${limits.pagesPerSiteLimit} pages.`,
        403
      );
    }

    const sourcePage = suggestion.source_page as unknown as {
      id: string;
      wp_id: number;
      wp_type: "post" | "page";
      url: string;
      content_text: string;
    };
    const targetPage = suggestion.target_page as unknown as {
      id: string;
      url: string;
    };

    // 3. Connect to WordPress
    const wpPassword = decrypt(siteData.wp_password_encrypted);
    const wpClient = new WordPressClient({
      url: siteData.url,
      username: siteData.wp_username,
      appPasswordDecrypted: wpPassword,
    });

    // 4. Fetch current post HTML from WordPress
    const postData = await wpClient.getPost(sourcePage.wp_id, sourcePage.wp_type);
    const originalContent = postData?.content?.raw || postData?.content?.rendered || "";

    // 5. CONFLICT DETECTION: Compare current WordPress content against scan snapshot
    // Strip HTML tags and normalize whitespace to compare plain text
    const currentPlainText = parseWordPressHtml(
      postData?.content?.rendered || originalContent,
      siteData.url
    ).plainText;
    const scannedPlainText = (sourcePage.content_text || "").trim();

    if (scannedPlainText && currentPlainText) {
      // Compare normalized content - if the article text has changed significantly,
      // an editor modified it after the scan. Block the apply to prevent overwriting.
      const normalizeText = (s: string) =>
        s.replace(/\s+/g, " ").trim().toLowerCase();

      const normalizedCurrent = normalizeText(currentPlainText);
      const normalizedScanned = normalizeText(scannedPlainText);

      if (normalizedCurrent !== normalizedScanned) {
        return apiError(
          "CONTENT_CONFLICT",
          "This article has been modified in WordPress since your last scan. Please run a new scan to generate fresh suggestions based on the updated content.",
          409
        );
      }
    }

    // Check if the link is already present in the post
    const escapedAnchor = suggestion.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alreadyAppliedRegex = new RegExp(`<a\\s+[^>]*href=["'][^"']*["'][^>]*>\\s*${escapedAnchor}\\s*<\\/a>`, "i");

    if (alreadyAppliedRegex.test(originalContent)) {
      // Link is already in the post, update status cleanly
      await admin
        .from("suggestions")
        .update({
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .eq("id", id);

      return apiSuccess({
        status: "applied",
        message: "Link is already present in WordPress post.",
      });
    }

    // 6. Wrap anchor text or append related link
    const { updatedHtml, replaced } = wrapAnchorInHtml({
      htmlContent: originalContent,
      anchorText: suggestion.anchor_text,
      targetUrl: targetPage.url,
    });

    let finalHtml = updatedHtml;
    if (!replaced) {
      // If anchor text was not found inline, append a clean contextual related link
      const safeUrl = targetPage.url.replace(/"/g, "&quot;").replace(/[<>]/g, "");
      const relatedParagraph = `<p>Related: <a href="${safeUrl}">${suggestion.anchor_text}</a></p>`;
      finalHtml = originalContent ? `${originalContent}\n\n${relatedParagraph}` : relatedParagraph;
    }

    // 7. Update WordPress post content
    await wpClient.updatePost(sourcePage.wp_id, finalHtml, sourcePage.wp_type);

    // 8. Record original content in activity_log for Undo support
    const { data: activityRow, error: actError } = await admin
      .from("activity_log")
      .insert({
        site_id: siteData.id,
        user_id: user.id,
        action: "link_applied",
        page_id: sourcePage.id,
        details: {
          suggestion_id: suggestion.id,
          original_content: originalContent,
          target_url: targetPage.url,
          anchor_text: suggestion.anchor_text,
          description: `Applied internal link "${suggestion.anchor_text}"`,
          target: targetPage.url,
        },
      })
      .select("id")
      .single();

    if (actError) {
      console.error("Failed to log activity:", actError);
    }

    // 9. Update suggestion status and sync page content_text snapshot
    await Promise.all([
      admin
        .from("suggestions")
        .update({
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .eq("id", id),
      // Update the page's content snapshot so future applies on the same page
      // won't falsely trigger a conflict from our own link insertion
      admin
        .from("pages")
        .update({
          content_text: parseWordPressHtml(finalHtml, siteData.url).plainText,
        })
        .eq("id", sourcePage.id),
    ]);

    return apiSuccess({
      status: "applied",
      activityId: activityRow?.id || "",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to apply suggestion.";
    return apiError("INTERNAL", message, 500);
  }
}

