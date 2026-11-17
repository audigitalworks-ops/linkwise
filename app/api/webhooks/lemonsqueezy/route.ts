import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyWebhookSignature, getPlanFromVariantId } from "@/lib/billing/lemonsqueezy";
import { PlanType } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (secret) {
      const isValid = verifyWebhookSignature(rawBody, signature, secret);
      if (!isValid) {
        return apiError("UNAUTHENTICATED", "Invalid webhook signature.", 401);
      }
    } else if (process.env.NODE_ENV === "production") {
      return apiError("INTERNAL", "LEMONSQUEEZY_WEBHOOK_SECRET is not configured.", 500);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return apiError("INVALID_INPUT", "Malformed JSON body.", 400);
    }

    const meta = (payload?.meta as Record<string, unknown>) || {};
    const eventName = typeof meta.event_name === "string" ? meta.event_name : "";
    const customData = (meta.custom_data as Record<string, unknown>) || {};
    const data = (payload?.data as Record<string, unknown>) || {};
    const attributes = (data.attributes as Record<string, unknown>) || {};

    const handledEvents = [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_expired",
    ];

    if (!handledEvents.includes(eventName)) {
      // Acknowledge other events (e.g. order_created, license_created) without error
      return apiSuccess({ received: true, ignored: true });
    }

    const admin = createAdminClient();

    // 1. Resolve user ID
    let userId: string | null =
      typeof customData.user_id === "string" ? customData.user_id : null;

    const userEmail: string =
      typeof attributes.user_email === "string"
        ? attributes.user_email
        : typeof customData.user_email === "string"
        ? customData.user_email
        : "";
    const customerId: string = attributes.customer_id
      ? String(attributes.customer_id)
      : "";
    const subscriptionId: string = data.id ? String(data.id) : "";

    // If userId not in custom_data, resolve via existing subscription or profile
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

    if (!userId && userEmail) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .single();
      if (profile?.id) {
        userId = profile.id;
      }
    }

    if (!userId) {
      console.warn("Webhook received for unknown user:", { userEmail, customerId, subscriptionId });
      // Return 200 so Lemon Squeezy does not perpetually retry an orphaned subscription
      return apiSuccess({ received: true, warning: "User not identified" });
    }

    // 2. Resolve plan and interval
    let plan: PlanType =
      customData.plan === "pro" || customData.plan === "agency"
        ? customData.plan
        : "free";
    let interval: "monthly" | "yearly" =
      customData.interval === "yearly" ? "yearly" : "monthly";

    if (attributes.variant_id) {
      const mapped = getPlanFromVariantId(String(attributes.variant_id));
      if (mapped.plan !== "free") {
        plan = mapped.plan;
        interval = mapped.interval;
      }
    }

    // 3. Resolve status
    // Supabase subscription status check: ('active', 'past_due', 'cancelled')
    const rawStatus: string =
      typeof attributes.status === "string" ? attributes.status : "active";
    let status: "active" | "past_due" | "cancelled" = "active";

    if (rawStatus === "past_due" || rawStatus === "unpaid") {
      status = "past_due";
    } else if (
      rawStatus === "cancelled" ||
      rawStatus === "expired" ||
      rawStatus === "paused"
    ) {
      status = "cancelled";
    } else {
      status = "active";
    }

    // On subscription_expired, downgrade user to free
    if (eventName === "subscription_expired") {
      plan = "free";
      status = "cancelled";
    }

    const currentPeriodEnd =
      typeof attributes.renews_at === "string"
        ? attributes.renews_at
        : typeof attributes.ends_at === "string"
        ? attributes.ends_at
        : null;

    // 4. Upsert subscription record
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
      console.error("Failed to upsert subscription in webhook:", upsertError);
      return apiError("INTERNAL", "Failed to update subscription in database.", 500);
    }

    return apiSuccess({
      received: true,
      event: eventName,
      user_id: userId,
      plan,
      status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Webhook handler encountered an error";
    return apiError("INTERNAL", message, 500);
  }
}
