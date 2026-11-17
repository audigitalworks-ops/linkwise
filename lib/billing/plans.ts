export type PlanType = "free" | "pro" | "agency";

export interface PlanLimits {
  sitesLimit: number;
  pagesPerSiteLimit: number;
  canUseWeeklyScan: boolean;
  canUseEmailReport: boolean;
  canUseOrphansAndBroken: boolean;
  canUseBulkApply: boolean;
  canUseWhiteLabel: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    sitesLimit: 1,
    pagesPerSiteLimit: 20,
    canUseWeeklyScan: false,
    canUseEmailReport: false,
    canUseOrphansAndBroken: false,
    canUseBulkApply: false,
    canUseWhiteLabel: false,
  },
  pro: {
    sitesLimit: 1,
    pagesPerSiteLimit: 500,
    canUseWeeklyScan: true,
    canUseEmailReport: true,
    canUseOrphansAndBroken: true,
    canUseBulkApply: true,
    canUseWhiteLabel: false,
  },
  agency: {
    sitesLimit: 10,
    pagesPerSiteLimit: 5000,
    canUseWeeklyScan: true,
    canUseEmailReport: true,
    canUseOrphansAndBroken: true,
    canUseBulkApply: true,
    canUseWhiteLabel: true,
  },
};

/**
 * Checks if a user is within their allowed site count limit.
 */
export function isWithinSiteLimit(currentSiteCount: number, plan: PlanType = "free"): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentSiteCount < limits.sitesLimit;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  sitesLimit: number;
  pagesLimit: number;
  description: string;
  features: string[];
  cta: string;
  current?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    sitesLimit: 1,
    pagesLimit: 20,
    description: "Essential linking tool for testing on small blogs.",
    features: [
      "1 WordPress site",
      "Up to 20 indexed pages",
      "Contextual link suggestions",
      "Manual scan on demand",
      "1-click undo history",
    ],
    cta: "Current Plan",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    priceYearly: 79,
    badge: "Most Popular",
    sitesLimit: 1,
    pagesLimit: 500,
    description: "For active content creators, SEO freelancers and publishers.",
    features: [
      "1 WordPress site",
      "Up to 500 indexed pages",
      "Automated weekly scans",
      "Weekly link-health email report",
      "Orphan page detection",
      "Broken link monitoring & fixes",
      "Bulk apply (up to 25 at once)",
      "Printable PDF report exports",
    ],
    cta: "Upgrade to Pro",
    current: false,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 29,
    priceYearly: 279,
    sitesLimit: 10,
    pagesLimit: 5000,
    description: "Scale internal link optimization across your entire client roster.",
    features: [
      "Up to 10 WordPress sites",
      "5,000 pages per site",
      "White-label weekly email reports",
      "3 team seats included",
      "Priority scan queue",
      "Custom anchor text exclusion rules",
      "Priority email & chat support",
    ],
    cta: "Upgrade to Agency",
    current: false,
  },
];

/**
 * Checks if a site page count is within the user's plan limit.
 */
export function isWithinPageLimit(pageCount: number, plan: PlanType = "free"): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return pageCount <= limits.pagesPerSiteLimit;
}

/**
 * Returns the plan limits for a given plan.
 */
export function getPlanLimits(plan: PlanType = "free"): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Checks whether a feature is permitted under a given plan.
 */
export function canUseFeature(
  plan: PlanType = "free",
  feature: keyof Omit<PlanLimits, "sitesLimit" | "pagesPerSiteLimit">
): boolean {
  const limits = getPlanLimits(plan);
  return Boolean(limits[feature]);
}

export default PRICING_PLANS;


