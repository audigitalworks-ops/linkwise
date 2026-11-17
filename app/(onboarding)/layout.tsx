"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Check } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isStep1 = pathname.includes("/onboarding/connect");
  const isStep3 = pathname.includes("/onboarding/scan");

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-surface px-4 md:px-8 flex items-center justify-between">
        <Logo href="/" />
        <div className="text-[13px] text-muted">
          Need help?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in to existing site
          </Link>
        </div>
      </header>

      {/* Main Centered 480px Column */}
      <main className="flex-1 max-w-[480px] w-full mx-auto px-4 py-8 md:py-12 flex flex-col">
        {/* 3-Step Indicator */}
        <div className="mb-8 w-full">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-bg px-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                  isStep1
                    ? "bg-primary text-white ring-4 ring-primary-tint"
                    : isStep3
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                {isStep3 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span
                className={`text-[12px] ${
                  isStep1 ? "font-medium text-text" : "text-muted"
                }`}
              >
                Connect site
              </span>
            </div>

            {/* Step 2 (Skipped for v1) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-bg px-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium bg-surface border border-border text-muted">
                2
              </div>
              <span className="text-[12px] text-muted/70 flex items-center gap-1">
                GSC <span className="text-[10px] bg-muted/20 px-1 rounded">(v1.1)</span>
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-bg px-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                  isStep3
                    ? "bg-primary text-white ring-4 ring-primary-tint"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                3
              </div>
              <span
                className={`text-[12px] ${
                  isStep3 ? "font-medium text-text" : "text-muted"
                }`}
              >
                First scan
              </span>
            </div>
          </div>
        </div>

        {/* Step Card Content */}
        <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}

