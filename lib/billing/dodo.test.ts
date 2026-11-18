import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDodoProductId,
  getPlanFromDodoProductId,
  getDodoClient,
  createDodoCheckoutSession,
  parseDodoWebhook,
} from "./dodo";

describe("Dodo Payments integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DODO_PAYMENTS_API_KEY: "dodo_test_mock_key",
      DODO_PAYMENTS_ENVIRONMENT: "test_mode",
      DODO_PAYMENTS_PRO_PRODUCT_ID: "pdt_pro_test_123",
      DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID: "pdt_pro_yearly_test_789",
      DODO_PAYMENTS_AGENCY_PRODUCT_ID: "pdt_agency_test_456",
      DODO_PAYMENTS_AGENCY_YEARLY_PRODUCT_ID: "pdt_agency_yearly_test_999",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("resolves product IDs from environment", () => {
    expect(getDodoProductId("pro")).toBe("pdt_pro_test_123");
    expect(getDodoProductId("pro", "monthly")).toBe("pdt_pro_test_123");
    expect(getDodoProductId("pro", "yearly")).toBe("pdt_pro_yearly_test_789");
    expect(getDodoProductId("agency")).toBe("pdt_agency_test_456");
    expect(getDodoProductId("agency", "yearly")).toBe("pdt_agency_yearly_test_999");
  });

  it("maps product IDs back to plan and interval", () => {
    expect(getPlanFromDodoProductId("pdt_pro_test_123")).toEqual({
      plan: "pro",
      interval: "monthly",
    });
    expect(getPlanFromDodoProductId("pdt_pro_yearly_test_789")).toEqual({
      plan: "pro",
      interval: "yearly",
    });
    expect(getPlanFromDodoProductId("pdt_agency_test_456")).toEqual({
      plan: "agency",
      interval: "monthly",
    });
    expect(getPlanFromDodoProductId("pdt_agency_yearly_test_999")).toEqual({
      plan: "agency",
      interval: "yearly",
    });
    expect(getPlanFromDodoProductId("pdt_unknown")).toEqual({
      plan: "free",
      interval: "monthly",
    });
  });

  it("initializes Dodo Payments client when API key is present", () => {
    const client = getDodoClient();
    expect(client).not.toBeNull();
  });

  it("returns null client when API key is absent", () => {
    delete process.env.DODO_PAYMENTS_API_KEY;
    const client = getDodoClient();
    expect(client).toBeNull();
  });

  it("returns mock checkout url when client or product ID is absent", async () => {
    delete process.env.DODO_PAYMENTS_API_KEY;
    const url = await createDodoCheckoutSession({
      userId: "user_123",
      userEmail: "test@example.com",
      plan: "pro",
      interval: "monthly",
    });

    expect(url).toContain("mock_checkout=true");
    expect(url).toContain("plan=pro");
  });

  it("parses valid webhook payload safely", () => {
    const payload = JSON.stringify({
      type: "subscription.active",
      data: {
        subscription_id: "sub_123",
        product_id: "pdt_pro_test_123",
      },
    });

    const parsed = parseDodoWebhook(payload, {}) as {
      type: string;
      data: { subscription_id: string };
    };

    expect(parsed.type).toBe("subscription.active");
    expect(parsed.data.subscription_id).toBe("sub_123");
  });
});

