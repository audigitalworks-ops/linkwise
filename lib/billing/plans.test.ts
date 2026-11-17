import { describe, it, expect } from "vitest";
import {
  isWithinSiteLimit,
  isWithinPageLimit,
  canUseFeature,
  getPlanLimits,
} from "./plans";

describe("Plan limits and enforcement", () => {
  it("enforces free plan limits correctly", () => {
    const freeLimits = getPlanLimits("free");
    expect(freeLimits.sitesLimit).toBe(1);
    expect(freeLimits.pagesPerSiteLimit).toBe(20);
    expect(freeLimits.canUseWeeklyScan).toBe(false);
    expect(freeLimits.canUseBulkApply).toBe(false);
    expect(freeLimits.canUseOrphansAndBroken).toBe(false);

    expect(isWithinSiteLimit(0, "free")).toBe(true);
    expect(isWithinSiteLimit(1, "free")).toBe(false);

    expect(isWithinPageLimit(18, "free")).toBe(true);
    expect(isWithinPageLimit(20, "free")).toBe(true);
    expect(isWithinPageLimit(21, "free")).toBe(false);

    expect(canUseFeature("free", "canUseBulkApply")).toBe(false);
  });

  it("enforces pro plan limits correctly", () => {
    const proLimits = getPlanLimits("pro");
    expect(proLimits.sitesLimit).toBe(1);
    expect(proLimits.pagesPerSiteLimit).toBe(500);
    expect(proLimits.canUseWeeklyScan).toBe(true);
    expect(proLimits.canUseBulkApply).toBe(true);
    expect(proLimits.canUseOrphansAndBroken).toBe(true);
    expect(proLimits.canUseWhiteLabel).toBe(false);

    expect(isWithinPageLimit(499, "pro")).toBe(true);
    expect(isWithinPageLimit(500, "pro")).toBe(true);
    expect(isWithinPageLimit(501, "pro")).toBe(false);

    expect(canUseFeature("pro", "canUseBulkApply")).toBe(true);
    expect(canUseFeature("pro", "canUseWeeklyScan")).toBe(true);
  });

  it("enforces agency plan limits correctly", () => {
    const agencyLimits = getPlanLimits("agency");
    expect(agencyLimits.sitesLimit).toBe(10);
    expect(agencyLimits.pagesPerSiteLimit).toBe(5000);
    expect(agencyLimits.canUseWhiteLabel).toBe(true);

    expect(isWithinSiteLimit(9, "agency")).toBe(true);
    expect(isWithinSiteLimit(10, "agency")).toBe(false);

    expect(isWithinPageLimit(5000, "agency")).toBe(true);
    expect(isWithinPageLimit(5001, "agency")).toBe(false);

    expect(canUseFeature("agency", "canUseWhiteLabel")).toBe(true);
  });
});
