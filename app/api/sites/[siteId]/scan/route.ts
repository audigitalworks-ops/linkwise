import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(
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
      return apiError("UNAUTHENTICATED", "You must be signed in to start a scan.", 401);
    }

    // Verify site belongs to user
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (siteError || !site) {
      return apiError("NOT_FOUND", "Site not found or access denied.", 404);
    }

    const admin = createAdminClient();

    // Check if an active scan is already running/queued
    const { data: activeScan } = await admin
      .from("scans")
      .select("id, status")
      .eq("site_id", siteId)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeScan) {
      return apiSuccess({ scanId: activeScan.id });
    }

    // Create a new queued scan
    const { data: newScan, error: insertError } = await admin
      .from("scans")
      .insert({
        site_id: siteId,
        status: "queued",
        step: "fetching",
        processed_pages: 0,
        total_pages: 0,
      })
      .select("id")
      .single();

    if (insertError || !newScan) {
      return apiError("INTERNAL", insertError?.message || "Failed to create scan record", 500);
    }

    return apiSuccess({ scanId: newScan.id }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return apiError("INTERNAL", message, 500);
  }
}
