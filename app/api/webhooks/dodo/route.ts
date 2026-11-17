import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { parseDodoWebhook, getPlanFromDodoProductId } from "@/lib/billing/dodo";
import { PlanType } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    let event: Record<string, unknown>;
    try {
      event = parseDodoWebhook(rawBody, headers) as Record<string, unknown>;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid webhook signature";
      return apiError("UNAUTHENTICATED", msg, 401);
    }

    const eventType = typeof event?.type === "string" ? event.type : "";
    const data = (event?.data as Record<string, unknown>) || {};

    // Filter relevant subscription and payment events
    const handledSubscriptionEvents = [
      "subscription.active",
      "subscription.renewed",
      "subscription.updated",
      "subscription.plan_changed",
      "subscription.unpaused",
      "subscription.past_due",
      "subscription.on_hold",
      "subscription.failed",
      "subscription.cancelled",
      "subscription.expired",
      "subscription.paused",
    ];

    if (!handledSubscriptionEvents.includes(eventType) && eventType !== "payment.succeeded") {
      return apiSuccess({ received: true, ignored: true, event: eventType });
    }

    const admin = createAdminClient();

    // 1. Resolve customer and subscription identifiers
    const customerObj = (data.customer as Record<string, unknown>) || {};
    const customerId: string =
      typeof customerObj.customer_id === "string"
        ? customerObj.customer_id
        : typeof data.customer_id === "string"
        ? data.customer_id
        : "";
    const customerEmail: string =
      typeof customerObj.email === "string"
        ? customerObj.email
        : typeof data.customer_email === "string"
        ? data.customer_email
        : "";
    const subscriptionId: string =
      typeof data.subscription_id === "string"
        ? data.subscription_id
        : typeof data.id === "string"
        ? data.id
        : "";

    // 2. Resolve User ID
    const metadata = (data.metadata as Record<string, unknown>) || {};
    let userId: string | null =
      typeof metadata.user_id === "string" ? metadata.user_id : null;

    if (!userId && customerId) {
      const { data: existingSub } = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("ls_customer_id", customerId)
        .single();
      if (existingSub?.user_id) {
        userId = existingSub.user_id;
      }
    }

    if (!userId && customerEmail) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();
      if (profile?.id) {
        userId = profile.id;
      }
    }

    if (!userId) {
      console.warn("Dodo webhook received for unidentified user:", {
        customerEmail,
        customerId,
        subscriptionId,
        eventType,
      });
      return apiSuccess({ received: true, warning: "User not identified" });
    }

    // 3. Resolve Plan and Interval
    let plan: PlanType = "pro";
    if (metadata.plan === "pro" || metadata.plan === "agency") {
      plan = metadata.plan;
    } else if (typeof data.product_id === "string") {
      const mapped = getPlanFromDodoProductId(data.product_id);
      if (mapped.plan !== "free") {
        plan = mapped.plan;
      }
    }

    let interval: "monthly" | "yearly" = "monthly";
    if (metadata.interval === "yearly") {
      interval = "yearly";
    } else if (data.payment_frequency_interval === "Year") {
      interval = "yearly";
    }

    // 4. Resolve Status
    // Supabase subscriptions table check constraint: ('active', 'past_due', 'cancelled')
    let status: "active" | "past_due" | "cancelled" = "active";
    const rawStatus = typeof data.status === "string" ? data.status.toLowerCase() : "";

    if (
      eventType === "subscription.past_due" ||
      eventType === "subscription.on_hold" ||
      eventType === "subscription.failed" ||
      rawStatus === "past_due" ||
      rawStatus === "on_hold" ||
      rawStatus === "failed"
    ) {
      status = "past_due";
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired" ||
      eventType === "subscription.paused" ||
      rawStatus === "cancelled" ||
      rawStatus === "expired" ||
      rawStatus === "paused"
    ) {
      status = "cancelled";
    } else {
      status = "active";
    }

    // If subscription expired, revoke features by setting plan to free
    if (eventType === "subscription.expired" || rawStatus === "expired") {
      plan = "free";
      status = "cancelled";
    }

    const currentPeriodEnd =
      typeof data.next_billing_date === "string"
        ? data.next_billing_date
        : typeof data.expires_at === "string"
        ? data.expires_at
        : null;

    // 5. Upsert subscription in Supabase
    const { error: upsertError } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status,
        ls_customer_id: customerId || null,
        ls_subscription_id: subscriptionId || null,
        current_period_end: currentPeriodEnd,
        interval,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Failed to upsert subscription in Dodo webhook:", upsertError);
      return apiError("INTERNAL", "Failed to update subscription in database.", 500);
    }

    return apiSuccess({
      received: true,
      event: eventType,
      user_id: userId,
      plan,
      status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Dodo webhook encountered an error";
    return apiError("INTERNAL", message, 500);
  }
}

