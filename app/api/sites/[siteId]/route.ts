import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await context.params;
    if (!siteId) {
      return apiError("INVALID_INPUT", "Site ID is required.", 400);
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

    // Verify site ownership
    const { data: site, error: fetchErr } = await admin
      .from("sites")
      .select("id, user_id")
      .eq("id", siteId)
      .single();

    if (fetchErr || !site) {
      return apiError("NOT_FOUND", "Site not found.", 404);
    }

    if (site.user_id !== user.id) {
      return apiError("FORBIDDEN", "You do not have permission to delete this site.", 403);
    }

    // Cascade delete
    const { error: delErr } = await admin
      .from("sites")
      .delete()
      .eq("id", siteId);

    if (delErr) {
      return apiError("INTERNAL", delErr.message, 500);
    }

    return apiSuccess({ deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete site.";
    return apiError("INTERNAL", message, 500);
  }
}

