import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

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
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    const admin = createAdminClient();

    // Verify suggestion and site ownership
    const { data: suggestion, error: sugError } = await admin
      .from("suggestions")
      .select("id, site_id, anchor_text, site:site_id(user_id)")
      .eq("id", id)
      .single();

    if (sugError || !suggestion || !suggestion.site) {
      return apiError("NOT_FOUND", "Suggestion not found.", 404);
    }

    const siteOwnerId = (suggestion.site as unknown as { user_id: string }).user_id;
    if (siteOwnerId !== user.id) {
      return apiError("FORBIDDEN", "You do not own this site.", 403);
    }

    // Update status to dismissed
    await admin
      .from("suggestions")
      .update({ status: "dismissed" })
      .eq("id", id);

    // Record in activity log
    await admin.from("activity_log").insert({
      site_id: suggestion.site_id,
      user_id: user.id,
      action: "link_dismissed",
      details: {
        suggestion_id: suggestion.id,
        anchor_text: suggestion.anchor_text,
        description: `Dismissed suggestion "${suggestion.anchor_text}"`,
      },
    });

    return apiSuccess({ status: "dismissed" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to dismiss suggestion.";
    return apiError("INTERNAL", message, 500);
  }
}

