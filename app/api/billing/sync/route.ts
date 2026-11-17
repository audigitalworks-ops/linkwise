import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getDodoClient, getPlanFromDodoProductId } from "@/lib/billing/dodo";
import { PlanType } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("UNAUTHENTICATED", "You must be logged in.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const subscriptionId = body.subscriptionId || body.subscription_id;

    if (!subscriptionId || typeof subscriptionId !== "string") {
      return apiError("INVALID_INPUT", "subscriptionId is required.", 400);
    }

    const client = getDodoClient();
    if (!client) {
      return apiError("INTERNAL", "Dodo Payments client not configured.", 500);
    }

    // Retrieve subscription details directly from Dodo Payments
    const sub = await client.subscriptions.retrieve(subscriptionId);
    if (!sub) {
      return apiError("NOT_FOUND", "Subscription not found in Dodo Payments.", 404);
    }

    // Verify ownership
    const metaUserId = sub.metadata?.user_id;
    const customerEmail = sub.customer?.email;

    if (metaUserId && metaUserId !== user.id) {
      return apiError("FORBIDDEN", "Subscription belongs to another user.", 403);
    }

    if (!metaUserId && customerEmail && customerEmail !== user.email) {
      return apiError("FORBIDDEN", "Subscription email does not match user.", 403);
    }

    // Determine plan & interval
    let plan: PlanType = "pro";
    if (sub.metadata?.plan === "pro" || sub.metadata?.plan === "agency") {
      plan = sub.metadata.plan;
    } else if (sub.product_id) {
      const mapped = getPlanFromDodoProductId(sub.product_id);
      if (mapped.plan !== "free") {
        plan = mapped.plan;
      }
    }

    const interval: "monthly" | "yearly" =
      sub.metadata?.interval === "yearly" || sub.payment_frequency_interval === "Year"
        ? "yearly"
        : "monthly";

    const status = sub.status === "active" ? "active" : "past_due";
    const currentPeriodEnd = sub.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        status,
        ls_customer_id: sub.customer?.customer_id || null,
        ls_subscription_id: sub.subscription_id,
        interval,
        current_period_end: currentPeriodEnd,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Failed to sync subscription:", upsertError);
      return apiError("INTERNAL", "Failed to update database subscription record.", 500);
    }

    return apiSuccess({
      synced: true,
      plan,
      status,
      subscription_id: sub.subscription_id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sync subscription";
    return apiError("INTERNAL", msg, 500);
  }
}

