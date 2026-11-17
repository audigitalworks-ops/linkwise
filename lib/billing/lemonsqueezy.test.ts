import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  getVariantId,
  getPlanFromVariantId,
} from "./lemonsqueezy";

describe("Lemon Squeezy integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: "var_pro_monthly",
      LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID: "var_pro_yearly",
      LEMONSQUEEZY_AGENCY_MONTHLY_VARIANT_ID: "var_agency_monthly",
      LEMONSQUEEZY_AGENCY_YEARLY_VARIANT_ID: "var_agency_yearly",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("resolves variant IDs from environment", () => {
    expect(getVariantId("pro", "monthly")).toBe("var_pro_monthly");
    expect(getVariantId("pro", "yearly")).toBe("var_pro_yearly");
    expect(getVariantId("agency", "monthly")).toBe("var_agency_monthly");
    expect(getVariantId("agency", "yearly")).toBe("var_agency_yearly");
  });

  it("maps variant IDs back to plan and interval", () => {
    expect(getPlanFromVariantId("var_pro_monthly")).toEqual({
      plan: "pro",
      interval: "monthly",
    });
    expect(getPlanFromVariantId("var_agency_yearly")).toEqual({
      plan: "agency",
      interval: "yearly",
    });
    expect(getPlanFromVariantId("unknown_var")).toEqual({
      plan: "free",
      interval: "monthly",
    });
  });

  it("verifies valid HMAC SHA-256 webhook signatures", () => {
    const secret = "test_webhook_secret_key_123";
    const payload = JSON.stringify({
      meta: { event_name: "subscription_created" },
      data: { id: "sub_123" },
    });

    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered payload or incorrect signatures", () => {
    const secret = "test_webhook_secret_key_123";
    const payload = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const wrongSignature = "bad_signature_deadbeef";

    expect(verifyWebhookSignature(payload, wrongSignature, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, "invalid", "")).toBe(false);

    // Tampered payload with valid signature for original payload
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const tamperedPayload = JSON.stringify({ meta: { event_name: "subscription_created", tampered: true } });
    expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
  });
});

