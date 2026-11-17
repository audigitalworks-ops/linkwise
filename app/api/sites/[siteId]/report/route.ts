import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

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
      .select("id, name, url")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (!site) {
      return apiError("NOT_FOUND", "Site not found.", 404);
    }

    const admin = createAdminClient();

    // Query 12-week snapshots
    const { data: snapshots, error: snapErr } = await admin
      .from("report_snapshots")
      .select(`
        id,
        site_id,
        week_start,
        health_score,
        pages_scanned,
        orphan_count,
        broken_count,
        suggestions_ready,
        links_applied,
        orphan_score,
        depth_score,
        anchor_score,
        broken_score
      `)
      .eq("site_id", siteId)
      .order("week_start", { ascending: true })
      .limit(12);

    if (snapErr) {
      return apiError("INTERNAL", snapErr.message, 500);
    }

    return apiSuccess({
      site,
      snapshots: snapshots || [],
      latest: snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed retrieving report.";
    return apiError("INTERNAL", message, 500);
  }
}

