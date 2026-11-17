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
      return apiError("INVALID_INPUT", "Activity ID is required.", 400);
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

    // 1. Fetch activity row
    const { data: activity, error: actError } = await admin
      .from("activity_log")
      .select(`
        id,
        site_id,
        user_id,
        action,
        page_id,
        details,
        page:page_id(id, wp_id, wp_type, title, url),
        site:site_id(id, user_id, url, wp_username, wp_password_encrypted)
      `)
      .eq("id", id)
      .single();

    if (actError || !activity || !activity.site) {
      return apiError("NOT_FOUND", "Activity record not found.", 404);
    }

    const siteData = activity.site as unknown as {
      id: string;
      user_id: string;
      url: string;
      wp_username: string;
      wp_password_encrypted: string;
    };

    if (siteData.user_id !== user.id) {
      return apiError("FORBIDDEN", "You do not own this site.", 403);
    }

    if (activity.action !== "link_applied") {
      return apiError("INVALID_INPUT", "Only applied link actions can be undone.", 400);
    }

    const details = activity.details as {
      original_content?: string;
      suggestion_id?: string;
      anchor_text?: string;
      target_url?: string;
    };

    if (!details?.original_content) {
      return apiError("INVALID_INPUT", "No original content backup found for this modification.", 400);
    }

    const pageData = activity.page as unknown as {
      id: string;
      wp_id: number;
      wp_type: "post" | "page";
    };

    if (!pageData) {
      return apiError("NOT_FOUND", "Target page record not found.", 404);
    }

    // 2. Restore in WordPress
    const wpPassword = decrypt(siteData.wp_password_encrypted);
    const wpClient = new WordPressClient({
      url: siteData.url,
      username: siteData.wp_username,
      appPasswordDecrypted: wpPassword,
    });

    await wpClient.updatePost(pageData.wp_id, details.original_content, pageData.wp_type);

    // 3. Revert suggestion status to pending if suggestion_id exists
    if (details.suggestion_id) {
      await admin
        .from("suggestions")
        .update({
          status: "pending",
          applied_at: null,
        })
        .eq("id", details.suggestion_id);
    }

    // 4. Record link_undone in activity_log
    await admin.from("activity_log").insert({
      site_id: siteData.id,
      user_id: user.id,
      action: "link_undone",
      page_id: pageData.id,
      details: {
        reverted_activity_id: activity.id,
        anchor_text: details.anchor_text,
        description: `Restored post revision to undo link "${details.anchor_text || ""}"`,
      },
    });

    return apiSuccess({ status: "restored" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to undo change.";
    return apiError("INTERNAL", message, 500);
  }
}

