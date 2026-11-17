import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getDodoCustomerPortalUrl } from "@/lib/billing/dodo";
import { getCustomerPortalUrl as getLsCustomerPortalUrl } from "@/lib/billing/lemonsqueezy";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("UNAUTHENTICATED", "You must be logged in to access the customer portal.", 401);
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("ls_customer_id, ls_subscription_id, plan, status")
      .eq("user_id", user.id)
      .single();

    if (!subscription || (!subscription.ls_customer_id && !subscription.ls_subscription_id)) {
      return apiError(
        "NOT_FOUND",
        "No active paid subscription or billing customer record found.",
        404
      );
    }

    let portalUrl: string | null = null;

    if (subscription.ls_customer_id) {
      portalUrl = await getDodoCustomerPortalUrl(subscription.ls_customer_id);
    }

    if (!portalUrl) {
      portalUrl = await getLsCustomerPortalUrl({
        customerId: subscription.ls_customer_id,
        subscriptionId: subscription.ls_subscription_id,
      });
    }

    if (!portalUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return apiSuccess({
        url: `${appUrl}/app/billing?mock_portal=true`,
      });
    }

    return apiSuccess({ url: portalUrl });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load customer portal";
    return apiError("INTERNAL", message, 500);
  }
}
