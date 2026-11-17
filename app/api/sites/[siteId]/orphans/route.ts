import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { updateSiteGraphMetrics } from "@/lib/scan/orphans";

export async function GET(
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

    // Verify site ownership
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (!site) {
      return apiError("NOT_FOUND", "Site not found.", 404);
    }

    const admin = createAdminClient();

    // Dynamically update site graph metrics so orphan status is real-time
    await updateSiteGraphMetrics(admin, siteId);

    // Query orphan pages
    const { data: orphans, error } = await admin
      .from("pages")
      .select("id, title, url, path, word_count, inbound_count, depth, monthly_clicks, created_at")
      .eq("site_id", siteId)
      .eq("is_orphan", true)
      .order("word_count", { ascending: false });

    if (error) {
      return apiError("INTERNAL", error.message, 500);
    }

    return apiSuccess({
      orphans: orphans || [],
      count: orphans?.length || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed retrieving orphans.";
    return apiError("INTERNAL", message, 500);
  }
}

