import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("UNAUTHENTICATED", "You must be logged in to fetch subscription info.", 401);
    }

    // 1. Fetch subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, interval, current_period_end, ls_customer_id, ls_subscription_id")
      .eq("user_id", user.id)
      .single();

    const plan: PlanType = (sub?.plan as PlanType) || "free";
    const status = sub?.status || "active";
    const interval = sub?.interval || "yearly";
    const currentPeriodEnd = sub?.current_period_end || null;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // 2. Fetch sites count
    const { count: sitesCount } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 3. Fetch max pages used on any single site
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id);

    let maxPagesUsed = 0;
    if (sites && sites.length > 0) {
      for (const site of sites) {
        const { count } = await supabase
          .from("pages")
          .select("*", { count: "exact", head: true })
          .eq("site_id", site.id);
        if (count && count > maxPagesUsed) {
          maxPagesUsed = count;
        }
      }
    }

    return apiSuccess({
      plan,
      status,
      interval,
      currentPeriodEnd,
      hasCustomerPortal: Boolean(sub?.ls_customer_id || sub?.ls_subscription_id),
      sitesCount: sitesCount || 0,
      sitesLimit: limits.sitesLimit,
      pagesUsed: maxPagesUsed,
      pagesLimit: limits.pagesPerSiteLimit,
      limits,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load subscription";
    return apiError("INTERNAL", message, 500);
  }
}
