import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { decrypt } from "@/lib/crypto";
import { WordPressClient } from "@/lib/wordpress/client";

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
      return apiError("UNAUTHENTICATED", "You must be signed in to undo changes.", 401);
    }

    const admin = createAdminClient();

    // 1. Fetch suggestion with related site and source page
    const { data: suggestion, error: sugError } = await admin
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
      return apiError("FORBIDDEN", "You do not own this site.", 403);
    }

    const sourcePage = suggestion.source_page as unknown as {
      id: string;
      wp_id: number;
      wp_type: "post" | "page";
    };

    if (!sourcePage) {
      return apiError("NOT_FOUND", "Source page record not found.", 404);
    }

    // 2. Connect to WordPress
    const wpPassword = decrypt(siteData.wp_password_encrypted);
    const wpClient = new WordPressClient({
      url: siteData.url,
      username: siteData.wp_username,
      appPasswordDecrypted: wpPassword,
    });

    // 3. Find original content from activity_log
    const { data: activityLogs } = await admin
      .from("activity_log")
      .select("id, details")
      .eq("site_id", siteData.id)
      .eq("action", "link_applied")
      .order("created_at", { ascending: false });

    let originalContent: string | null = null;
    let activityId: string | null = null;

    if (activityLogs && activityLogs.length > 0) {
      for (const log of activityLogs) {
        const det = log.details as Record<string, unknown>;
        if (det?.suggestion_id === id && typeof det.original_content === "string") {
          originalContent = det.original_content;
          activityId = log.id;
          break;
        }
      }
    }

    // Fetch current live post content
    const livePost = await wpClient.getPost(sourcePage.wp_id, sourcePage.wp_type);
    const currentHtml = livePost?.content?.raw || livePost?.content?.rendered || "";

    const escapedAnchor = suggestion.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const linkRegex = new RegExp(`<a\\s+[^>]*href=["'][^"']*["'][^>]*>\\s*(${escapedAnchor})\\s*<\\/a>`, "gi");

    // Ensure content to restore is stripped of the anchor tag
    const contentToSave = (originalContent || currentHtml).replace(linkRegex, "$1");

    if (!contentToSave) {
      return apiError("INTERNAL", "Could not restore post content.", 500);
    }

    // 4. Update WordPress post to restore unlinked content
    await wpClient.updatePost(sourcePage.wp_id, contentToSave, sourcePage.wp_type);

    // 5. Update suggestion status back to pending
    await admin
      .from("suggestions")
      .update({
        status: "pending",
        applied_at: null,
      })
      .eq("id", id);

    // 6. Record link_undone in activity_log
    await admin.from("activity_log").insert({
      site_id: siteData.id,
      user_id: user.id,
      action: "link_undone",
      page_id: sourcePage.id,
      details: {
        suggestion_id: id,
        reverted_activity_id: activityId,
        anchor_text: suggestion.anchor_text,
        description: `Restored post revision to undo link "${suggestion.anchor_text}"`,
      },
    });

    return apiSuccess({ status: "restored" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to undo suggestion.";
    return apiError("INTERNAL", message, 500);
  }
}

