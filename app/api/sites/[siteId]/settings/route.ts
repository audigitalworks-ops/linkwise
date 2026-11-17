import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

export async function PATCH(
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

    const body = await req.json();
    const { scanFrequency, minRelevance, ignorePatterns, requireApproval } = body;

    // Plan check for weekly scanning
    if (scanFrequency === "weekly") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      const userPlan = (sub?.plan as PlanType) || "free";
      const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

      if (!limits.canUseWeeklyScan) {
        return apiError(
          "PLAN_LIMIT",
          "Automated weekly scans require a Pro or Agency subscription. Upgrade to enable.",
          403
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (scanFrequency !== undefined) updates.scan_frequency = scanFrequency;
    if (minRelevance !== undefined) updates.min_relevance = Number(minRelevance);
    if (ignorePatterns !== undefined) updates.ignore_patterns = ignorePatterns;
    if (requireApproval !== undefined) updates.require_approval = Boolean(requireApproval);

    const admin = createAdminClient();
    const { data: updatedSite, error: updateErr } = await admin
      .from("sites")
      .update(updates)
      .eq("id", siteId)
      .select("id, name, url, scan_frequency, min_relevance, ignore_patterns, require_approval")
      .single();

    if (updateErr) {
      return apiError("INTERNAL", updateErr.message, 500);
    }

    return apiSuccess({ site: updatedSite });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed updating site settings.";
    return apiError("INTERNAL", message, 500);
  }
}
