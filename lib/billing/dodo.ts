import DodoPayments from "dodopayments";
import { PlanType } from "./plans";

/**
 * Returns a configured Dodo Payments SDK client, or null if API key is not present.
 */
export function getDodoClient(): DodoPayments | null {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    return null;
  }

  const environment =
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "live_mode"
      : "test_mode";

  return new DodoPayments({
    bearerToken,
    environment,
  });
}

/**
 * Resolves the Dodo Payments product ID for a given plan.
 */
export function getDodoProductId(plan: "pro" | "agency"): string | undefined {
  if (plan === "pro") {
    return process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;
  }
  if (plan === "agency") {
    return process.env.DODO_PAYMENTS_AGENCY_PRODUCT_ID;
  }
  return undefined;
}

/**
 * Maps a Dodo Payments product ID back to a Linkwise plan.
 */
export function getPlanFromDodoProductId(productId: string): {
  plan: PlanType;
  interval: "monthly" | "yearly";
} {
  if (productId === process.env.DODO_PAYMENTS_PRO_PRODUCT_ID) {
    return { plan: "pro", interval: "monthly" };
  }
  if (productId === process.env.DODO_PAYMENTS_AGENCY_PRODUCT_ID) {
    return { plan: "agency", interval: "monthly" };
  }
  return { plan: "free", interval: "monthly" };
}

export interface CreateDodoCheckoutOptions {
  userId: string;
  userEmail: string;
  userName?: string;
  plan: "pro" | "agency";
  interval: "monthly" | "yearly";
  redirectUrl?: string;
}

/**
 * Creates a Dodo Payments checkout session and returns the checkout URL.
 */
export async function createDodoCheckoutSession(
  options: CreateDodoCheckoutOptions
): Promise<string> {
  const client = getDodoClient();
  const productId = getDodoProductId(options.plan);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl =
    options.redirectUrl || `${appUrl}/app/billing?checkout=success`;

  if (!client || !productId) {
    // Development fallback if credentials are absent
    return `${appUrl}/app/billing?mock_checkout=true&plan=${options.plan}&interval=${options.interval}`;
  }

  const session = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    customer: {
      email: options.userEmail,
      name: options.userName || options.userEmail.split("@")[0] || "Linkwise Customer",
    },
    return_url: redirectUrl,
    metadata: {
      user_id: options.userId,
      plan: options.plan,
      interval: options.interval,
    },
  });

  if (!session.checkout_url) {
    throw new Error("Dodo Payments checkout did not return a valid checkout URL.");
  }

  return session.checkout_url;
}

/**
 * Generates a Dodo Payments Customer Portal session URL.
 */
export async function getDodoCustomerPortalUrl(
  customerId: string,
  returnUrl?: string
): Promise<string | null> {
  const client = getDodoClient();
  if (!client || !customerId) {
    return null;
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await client.customers.customerPortal.create(customerId, {
      return_url: returnUrl || `${appUrl}/app/billing`,
    });

    return session.link || null;
  } catch (err) {
    console.error("Error creating Dodo customer portal session:", err);
    return null;
  }
}

/**
 * Verifies and parses a Dodo Payments webhook payload.
 */
export function parseDodoWebhook(
  rawBody: string,
  headers: Record<string, string>,
  secret?: string
): unknown {
  const client = getDodoClient();
  const webhookSecret = secret || process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (client && webhookSecret) {
    return client.webhooks.unwrap(rawBody, {
      headers,
      key: webhookSecret,
    });
  }

  if (client) {
    return client.webhooks.unsafeUnwrap(rawBody);
  }

  return JSON.parse(rawBody);
}

