"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import PRICING_PLANS_DEFAULT, {
  PRICING_PLANS as PRICING_PLANS_NAMED,
  PricingPlan,
} from "@/lib/billing/plans";

const FALLBACK_PLANS: PricingPlan[] = [
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

const AVAILABLE_PLANS: PricingPlan[] =
  Array.isArray(PRICING_PLANS_NAMED) && PRICING_PLANS_NAMED.length > 0
    ? PRICING_PLANS_NAMED
    : Array.isArray(PRICING_PLANS_DEFAULT) && PRICING_PLANS_DEFAULT.length > 0
    ? PRICING_PLANS_DEFAULT
    : FALLBACK_PLANS;
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
        }
      } catch {
        // Continue in guest mode
      }
    }
    checkAuth();
  }, []);

  const handlePlanClick = async (planId: string) => {
    if (planId === "free") {
      if (isLoggedIn) {
        router.push("/app");
      } else {
        router.push("/signup");
      }
      return;
    }

    if (!isLoggedIn) {
      router.push(`/signup?plan=${planId}&interval=${billingInterval}`);
      return;
    }

    // If logged in, initiate checkout
    try {
      setProcessingPlan(planId);
      toast.info(`Preparing ${planId.toUpperCase()} checkout...`);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          interval: billingInterval,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to start checkout");
      }

      if (json.data?.url) {
        window.location.assign(json.data.url);
      } else {
        router.push("/app/billing");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating checkout";
      toast.error(msg);
      router.push("/app/billing");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1120px] mx-auto px-4 md:px-8 py-10 md:py-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-surface border border-border text-muted text-[12px] font-medium mb-4">
          <span>Simple, transparent pricing</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-semibold text-text tracking-tight">
          Plans that grow with your content
        </h1>
        <p className="text-[16px] text-muted mt-3">
          Every plan includes WordPress native REST integration, anchor sentence extraction, and 1-click apply.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-8 inline-flex items-center p-1 bg-surface border border-border rounded-[6px]">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors cursor-pointer ${
              billingInterval === "monthly"
                ? "bg-bg text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            Monthly billing
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              billingInterval === "yearly"
                ? "bg-primary text-white"
                : "text-muted hover:text-text"
            }`}
          >
            <span>Yearly billing</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded ${
                billingInterval === "yearly"
                  ? "bg-white/20 text-white"
                  : "bg-primary-tint text-primary font-semibold"
              }`}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {AVAILABLE_PLANS.map((plan) => {
          const isYearly = billingInterval === "yearly";
          const displayPrice =
            plan.id === "free"
              ? "$0"
              : isYearly
              ? `$${plan.priceYearly}`
              : `$${plan.priceMonthly}`;
          const periodText =
            plan.id === "free"
              ? "forever"
              : isYearly
              ? "per year"
              : "per month";

          const isPro = plan.id === "pro";
          const isProcessing = processingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-surface rounded-[6px] border flex flex-col justify-between p-6 md:p-8 transition-shadow ${
                isPro
                  ? "border-primary ring-1 ring-primary shadow-sm relative"
                  : "border-border"
              }`}
            >
              <div>
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] font-semibold text-text">{plan.name}</h3>
                  <span className="text-[12px] text-muted">
                    {plan.sitesLimit === 1 ? "1 Site" : `${plan.sitesLimit} Sites`}
                  </span>
                </div>

                <p className="text-[13px] text-muted mb-6 min-h-[38px]">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-border">
                  <span className="text-[36px] font-bold text-text tabular-nums tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-[13px] text-muted">/{periodText}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <div className="text-[12px] font-medium uppercase tracking-wider text-muted mb-3">
                    Includes:
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-text">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  disabled={isProcessing}
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full h-10 rounded-[6px] font-medium text-[13px] cursor-pointer ${
                    isPro
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "bg-surface border border-border text-text hover:bg-bg"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plan.id === "free" ? (
                    isLoggedIn ? "Go to Dashboard" : "Start free (20 pgs)"
                  ) : (
                    `Start with ${plan.name}`
                  )}
                </Button>
                <div className="text-center text-[11px] text-muted mt-2">
                  {plan.id === "free"
                    ? "No credit card needed"
                    : "14-day refund guarantee"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="border border-border rounded-[6px] bg-surface p-6 md:p-8">
        <h3 className="text-[18px] font-semibold text-text mb-6">
          Detailed Feature Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-muted text-[11px] uppercase tracking-wider">
                <th className="py-3 pr-4 font-semibold">Capability</th>
                <th className="py-3 px-4 font-semibold">Free</th>
                <th className="py-3 px-4 font-semibold text-primary">Pro</th>
                <th className="py-3 pl-4 font-semibold">Agency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 pr-4 font-medium text-text">Connected WordPress Sites</td>
                <td className="py-3 px-4 text-muted">1 site</td>
                <td className="py-3 px-4 text-text font-medium">1 site</td>
                <td className="py-3 pl-4 text-text font-medium">10 sites</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">Scanned & Indexed Pages Limit</td>
                <td className="py-3 px-4 text-muted">20 pages</td>
                <td className="py-3 px-4 text-text font-medium">500 pages</td>
                <td className="py-3 pl-4 text-text font-medium">5,000 pages / site</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">AI Link Opportunities</td>
                <td className="py-3 px-4 text-text">Yes</td>
                <td className="py-3 px-4 text-text">Yes</td>
                <td className="py-3 pl-4 text-text">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">1-Click Apply to WordPress</td>
                <td className="py-3 px-4 text-text">Yes (up to 20 pgs)</td>
                <td className="py-3 px-4 text-text">Yes</td>
                <td className="py-3 pl-4 text-text">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">Bulk Apply Opportunities (up to 25)</td>
                <td className="py-3 px-4 text-muted">-</td>
                <td className="py-3 px-4 text-primary font-medium">Yes</td>
                <td className="py-3 pl-4 text-primary font-medium">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">Orphan Pages & Broken Link Scanner</td>
                <td className="py-3 px-4 text-muted">View only</td>
                <td className="py-3 px-4 text-primary font-medium">Full Repair</td>
                <td className="py-3 pl-4 text-primary font-medium">Full Repair</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">Automated Weekly Email Report</td>
                <td className="py-3 px-4 text-muted">-</td>
                <td className="py-3 px-4 text-primary font-medium">Yes</td>
                <td className="py-3 pl-4 text-primary font-medium">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-text">White-label PDF Reports</td>
                <td className="py-3 px-4 text-muted">-</td>
                <td className="py-3 px-4 text-muted">-</td>
                <td className="py-3 pl-4 text-primary font-medium">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
