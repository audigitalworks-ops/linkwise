"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  CreditCard,
  Check,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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

export const PRICING_PLANS: PricingPlan[] =
  Array.isArray(PRICING_PLANS_NAMED) && PRICING_PLANS_NAMED.length > 0
    ? PRICING_PLANS_NAMED
    : Array.isArray(PRICING_PLANS_DEFAULT) && PRICING_PLANS_DEFAULT.length > 0
    ? PRICING_PLANS_DEFAULT
    : FALLBACK_PLANS;

export const AVAILABLE_PLANS = PRICING_PLANS;

interface SubscriptionInfo {
  plan: "free" | "pro" | "agency";
  status: "active" | "past_due" | "cancelled";
  interval: "monthly" | "yearly";
  currentPeriodEnd: string | null;
  hasCustomerPortal: boolean;
  sitesCount: number;
  sitesLimit: number;
  pagesUsed: number;
  pagesLimit: number;
}

export default function BillingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro" | "agency">("free");
  const [subStatus, setSubStatus] = useState<"active" | "past_due" | "cancelled">("active");
  const [pagesUsed, setPagesUsed] = useState<number>(0);
  const [pagesLimit, setPagesLimit] = useState<number>(20);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/subscription");
      const json = await res.json();
      if (json.success && json.data) {
        const data: SubscriptionInfo = json.data;
        setCurrentPlan(data.plan);
        setSubStatus(data.status);
        if (data.interval) {
          setBillingInterval(data.interval);
        }
        setPagesUsed(data.pagesUsed);
        setPagesLimit(data.pagesLimit);
        setCurrentPeriodEnd(data.currentPeriodEnd);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();

    // Check if returning from a successful payment checkout
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get("checkout") === "success";
      const subscriptionId = params.get("subscription_id");

      if (isSuccess) {
        toast.success("Payment successful! Your Linkwise Pro plan is now active.");
        setCurrentPlan("pro");
        setSubStatus("active");

        if (subscriptionId) {
          fetch("/api/billing/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionId }),
          }).then(() => {
            loadSubscription();
          });
        }

        // Clean query parameters from URL bar
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [loadSubscription]);

  const usagePercent = Math.min(100, Math.round((pagesUsed / (pagesLimit || 1)) * 100));

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    if (planId === "free") {
      toast.info("To cancel or downgrade your subscription, please open the Customer Portal.");
      return;
    }

    try {
      setProcessingPlan(planId);
      toast.info(`Preparing checkout for ${planId.toUpperCase()} plan...`);

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
        throw new Error(json.error?.message || "Failed to initialize checkout.");
      }

      toast.success("Redirecting to secure checkout...");
      if (json.data?.url) {
        window.location.assign(json.data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout error occurred.";
      toast.error(msg);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setOpeningPortal(true);
      toast.info("Connecting to Customer Portal...");

      const res = await fetch("/api/billing/portal");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message ||
            "Customer portal is only available for paid active subscriptions."
        );
      }

      if (json.data?.url) {
        window.location.assign(json.data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Portal error occurred.";
      toast.error(msg);
    } finally {
      setOpeningPortal(false);
    }
  };

  const formattedPeriodEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : currentPlan === "free"
    ? "Active (Free Tier)"
    : "Active (Monthly)";

  const mockInvoices = [
    {
      id: "inv_104",
      date: formattedPeriodEnd === "Active (Free Tier)" ? "Nov 01, 2026" : formattedPeriodEnd,
      plan: `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan (${billingInterval})`,
      amount:
        currentPlan === "free"
          ? "$0.00"
          : currentPlan === "pro"
          ? billingInterval === "yearly"
            ? "$79.00"
            : "$9.00"
          : billingInterval === "yearly"
          ? "$279.00"
          : "$29.00",
      status: "paid" as const,
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold text-text tracking-tight">
          Billing & Usage
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Manage your subscription plan, view page quota limits and download billing invoices.
        </p>
      </div>

      {/* Current Usage Status Banner */}
      <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
          <div>
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
              Active Subscription
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[20px] font-bold text-text capitalize">
                {currentPlan} Plan
              </span>
              <StatusPill
                status={subStatus === "active" ? "active" : subStatus === "past_due" ? "pending" : "dismissed"}
                label={subStatus === "active" ? "Active" : subStatus === "past_due" ? "Past Due" : "Cancelled"}
              />
            </div>
            {currentPeriodEnd && (
              <span className="text-[12px] text-muted mt-0.5 block">
                Renews on {formattedPeriodEnd}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            disabled={openingPortal}
            onClick={handleOpenPortal}
            className="h-9 px-4 text-[13px] border-border text-text font-medium rounded-[6px] gap-2 hover:bg-bg self-start sm:self-auto cursor-pointer"
          >
            {openingPortal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5 text-muted" />
            )}
            <span>Customer Portal</span>
          </Button>
        </div>

        {/* Quota Progress */}
        <div>
          <div className="flex justify-between items-center text-[12px] mb-1.5">
            <span className="text-muted">Pages Indexed Across Sites</span>
            <span className="text-text font-medium tabular-nums">
              {pagesUsed} / {pagesLimit} pages ({usagePercent}%)
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent >= 90
                  ? "bg-red-500"
                  : usagePercent >= 75
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {usagePercent >= 80 && (
            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Approaching your page quota limit. Upgrade your plan to index additional pages.
            </p>
          )}
        </div>
      </div>

      {/* Available Plans Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              Available Plans
            </h2>
            <p className="text-[13px] text-muted">
              Choose the tier that matches your publishing scale.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center bg-surface border border-border p-1 rounded-[6px] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors cursor-pointer ${
                billingInterval === "monthly"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                billingInterval === "yearly"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-white/20 text-white px-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => {
            const isYearly = billingInterval === "yearly";
            const price =
              plan.id === "free"
                ? "$0"
                : isYearly
                ? `$${plan.priceYearly}/yr`
                : `$${plan.priceMonthly}/mo`;
            const isCurrent = currentPlan === plan.id;
            const isPro = plan.id === "pro";
            const isProcessing = processingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-surface rounded-[6px] border p-6 flex flex-col justify-between ${
                  isCurrent
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[16px] font-semibold text-text">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[11px] font-semibold text-primary bg-primary-tint px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-muted mb-4 min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="text-[28px] font-bold text-text tabular-nums mb-4 pb-4 border-b border-border">
                    {price}
                  </div>

                  <div className="space-y-2.5 text-[12px] mb-6">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-text">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  disabled={isCurrent || isProcessing || loading}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full h-9 text-[13px] font-medium rounded-[6px] cursor-pointer ${
                    isCurrent
                      ? "bg-bg text-muted border border-border cursor-default"
                      : isPro
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "bg-surface border border-border text-text hover:bg-bg"
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    `Select ${plan.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm">
        <h2 className="text-[16px] font-semibold text-text mb-4">
          Billing History & Invoices
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-border">
                <th className="py-2.5 pr-4">Invoice Date</th>
                <th className="py-2.5 px-4">Plan Description</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 pl-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 pr-4 font-mono text-[12px] text-text">
                    {inv.date}
                  </td>
                  <td className="py-3 px-4 text-text">{inv.plan}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {inv.amount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusPill status="applied" label="Paid" />
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      type="button"
                      onClick={handleOpenPortal}
                      className="text-primary hover:underline text-[12px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Portal / Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
