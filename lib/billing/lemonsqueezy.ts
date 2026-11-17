import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";
import { PlanType } from "./plans";

/**
 * Initializes the Lemon Squeezy SDK if the API key is present.
 */
export function initLemonSqueezy(): boolean {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    return false;
  }
  lemonSqueezySetup({ apiKey });
  return true;
}

/**
 * Resolves the variant ID for a given plan and interval.
 */
export function getVariantId(
  plan: "pro" | "agency",
  interval: "monthly" | "yearly"
): string | undefined {
  if (plan === "pro") {
    return interval === "yearly"
      ? process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID
      : process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  }
  if (plan === "agency") {
    return interval === "yearly"
      ? process.env.LEMONSQUEEZY_AGENCY_YEARLY_VARIANT_ID
      : process.env.LEMONSQUEEZY_AGENCY_MONTHLY_VARIANT_ID;
  }
  return undefined;
}

/**
 * Map a variant ID back to a plan and interval if recognized.
 */
export function getPlanFromVariantId(variantId: string | number): {
  plan: PlanType;
  interval: "monthly" | "yearly";
} {
  const vId = String(variantId);
  if (vId === process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID) {
    return { plan: "pro", interval: "monthly" };
  }
  if (vId === process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID) {
    return { plan: "pro", interval: "yearly" };
  }
  if (vId === process.env.LEMONSQUEEZY_AGENCY_MONTHLY_VARIANT_ID) {
    return { plan: "agency", interval: "monthly" };
  }
  if (vId === process.env.LEMONSQUEEZY_AGENCY_YEARLY_VARIANT_ID) {
    return { plan: "agency", interval: "yearly" };
  }
  return { plan: "free", interval: "monthly" };
}

export interface CreateCheckoutOptions {
  userId: string;
  userEmail: string;
  plan: "pro" | "agency";
  interval: "monthly" | "yearly";
  redirectUrl?: string;
}

/**
 * Creates a Lemon Squeezy checkout session URL.
 */
export async function createCheckoutSession(
  options: CreateCheckoutOptions
): Promise<string> {
  const isInitialized = initLemonSqueezy();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = getVariantId(options.plan, options.interval);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl =
    options.redirectUrl || `${appUrl}/app/billing?checkout=success`;

  if (!isInitialized || !storeId || !variantId) {
    // If Lemon Squeezy credentials are not yet configured in environment,
    // return a local fallback for seamless development & manual testing.
    return `${appUrl}/app/billing?mock_checkout=true&plan=${options.plan}&interval=${options.interval}`;
  }

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: options.userEmail,
      custom: {
        user_id: options.userId,
        plan: options.plan,
        interval: options.interval,
      },
    },
    productOptions: {
      redirectUrl,
      receiptButtonText: "Return to Linkwise",
      receiptLinkUrl: `${appUrl}/app`,
    },
  });

  if (error || !data?.data?.attributes?.url) {
    throw new Error(
      error?.message || "Failed to generate Lemon Squeezy checkout URL."
    );
  }

  return data.data.attributes.url;
}

/**
 * Retrieves the Customer Portal URL for an active subscription or customer.
 */
export async function getCustomerPortalUrl(
  customerIdOrSubscriptionId: {
    customerId?: string | null;
    subscriptionId?: string | null;
  }
): Promise<string | null> {
  const isInitialized = initLemonSqueezy();
  if (!isInitialized) {
    return null;
  }

  try {
    if (customerIdOrSubscriptionId.subscriptionId) {
      const { data } = await getSubscription(
        customerIdOrSubscriptionId.subscriptionId
      );
      if (data?.data?.attributes?.urls?.customer_portal) {
        return data.data.attributes.urls.customer_portal;
      }
    }

    if (customerIdOrSubscriptionId.customerId) {
      const { data } = await getCustomer(customerIdOrSubscriptionId.customerId);
      if (data?.data?.attributes?.urls?.customer_portal) {
        return data.data.attributes.urls.customer_portal;
      }
    }
  } catch (err) {
    console.error("Error fetching Lemon Squeezy customer portal:", err);
  }

  return null;
}

/**
 * Verifies the HMAC SHA-256 signature sent by Lemon Squeezy webhooks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(signatureHeader, "utf8");

    if (digest.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(digest, signature);
  } catch {
    return false;
  }
}

