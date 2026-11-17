"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Compass,
  Link2Off,
  MailCheck,
  SpellCheck,
  History,
  ShieldCheck,
  CheckCircle,
  Power,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const [appliedRows, setAppliedRows] = useState<Record<string, boolean>>({});

  const toggleApply = (id: string) => {
    setAppliedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full max-w-[1120px] mx-auto px-4 md:px-8 py-10 md:py-16">
      {/* HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-16">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-surface border border-border text-muted text-[12px] font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>WordPress Internal Linking Intelligence</span>
          </div>

          <h1 className="text-[34px] sm:text-[44px] leading-[1.15] font-semibold text-text tracking-tight max-w-xl">
            Fix your internal links in minutes, not days.
          </h1>

          <p className="text-[16px] leading-relaxed text-muted mt-4 max-w-xl">
            Linkwise scans your WordPress site, suggests the right contextual links with exact anchor text, and sends a weekly link-health report.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/signup">
              <Button className="h-[38px] px-5 bg-primary text-white hover:bg-primary-hover font-medium text-[14px] rounded-[6px]">
                Start free
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                className="h-[38px] px-4 bg-surface text-text font-medium text-[14px] rounded-[6px] border-border"
              >
                See how it works
              </Button>
            </a>
          </div>

          <p className="text-[12px] text-muted mt-3">
            Free for up to 20 pages. No credit card required.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-6 mt-6 w-full max-w-lg bg-surface border border-border p-4 rounded-[6px]">
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
                Crawl Speed
              </div>
              <div className="text-[15px] text-text font-semibold tabular-nums mt-0.5">
                120 pgs/min
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
                Precision
              </div>
              <div className="text-[15px] text-text font-semibold tabular-nums mt-0.5">
                98.2% match
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
                Integration
              </div>
              <div className="text-[15px] text-text font-semibold mt-0.5">
                Native WP REST
              </div>
            </div>
          </div>
        </div>

        {/* HERO INTERACTIVE PREVIEW */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-surface rounded-[6px] border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-text">
                  Live Suggestions Queue
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-primary-tint text-primary text-[11px] font-medium">
                14 Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-border">
                    <th className="py-2 pr-2">Source / Anchor</th>
                    <th className="py-2 px-2 text-right">Score</th>
                    <th className="py-2 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 pr-2">
                      <div className="font-medium text-text text-[13px] truncate max-w-[160px]">
                        How to Compost in Winter
                      </div>
                      <div className="text-[11px] text-primary bg-primary-tint inline-block px-1.5 py-0.5 rounded mt-1 font-mono">
                        &quot;best compost bins 2026&quot;
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[12px] font-medium tabular-nums">
                      0.94
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => toggleApply("sug1")}
                        className={`h-7 px-3 text-[12px] rounded-[4px] ${
                          appliedRows["sug1"]
                            ? "bg-primary-tint text-primary hover:bg-primary-tint"
                            : "bg-primary text-white hover:bg-primary-hover"
                        }`}
                      >
                        {appliedRows["sug1"] ? "Applied" : "Apply"}
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2">
                      <div className="font-medium text-text text-[13px] truncate max-w-[160px]">
                        Pruning Fruit Trees Guide
                      </div>
                      <div className="text-[11px] text-primary bg-primary-tint inline-block px-1.5 py-0.5 rounded mt-1 font-mono">
                        &quot;sterilize shears&quot;
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[12px] font-medium tabular-nums">
                      0.91
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => toggleApply("sug2")}
                        className={`h-7 px-3 text-[12px] rounded-[4px] ${
                          appliedRows["sug2"]
                            ? "bg-primary-tint text-primary hover:bg-primary-tint"
                            : "bg-primary text-white hover:bg-primary-hover"
                        }`}
                      >
                        {appliedRows["sug2"] ? "Applied" : "Apply"}
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2">
                      <div className="font-medium text-text text-[13px] truncate max-w-[160px]">
                        Organic Pest Control
                      </div>
                      <div className="text-[11px] text-primary bg-primary-tint inline-block px-1.5 py-0.5 rounded mt-1 font-mono">
                        &quot;neem oil dilution&quot;
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-[12px] font-medium tabular-nums">
                      0.88
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => toggleApply("sug3")}
                        className={`h-7 px-3 text-[12px] rounded-[4px] ${
                          appliedRows["sug3"]
                            ? "bg-primary-tint text-primary hover:bg-primary-tint"
                            : "bg-primary text-white hover:bg-primary-hover"
                        }`}
                      >
                        {appliedRows["sug3"] ? "Applied" : "Apply"}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[12px] text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Automatic revision rollback enabled
              </span>
              <Link href="/app/suggestions" className="text-primary font-medium hover:underline">
                View all (42) →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: HOW IT WORKS */}
      <section className="py-16 border-t border-border" id="how-it-works">
        <div className="flex flex-col items-start mb-10">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted mb-2">
            Workflow
          </span>
          <h2 className="text-[24px] font-semibold text-text tracking-tight">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-[6px] border border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-primary-tint text-primary font-semibold text-[14px] flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-[16px] font-semibold text-text mb-2">
                Connect your site
              </h3>
              <p className="text-[14px] text-muted leading-relaxed">
                Add your WordPress application password in under 60 seconds with read-only permissions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[12px] text-muted">
              No plugin installation required. Uses standard native WP REST API endpoints.
            </div>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-primary-tint text-primary font-semibold text-[14px] flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-[16px] font-semibold text-text mb-2">
                Review suggestions
              </h3>
              <p className="text-[14px] text-muted leading-relaxed">
                Linkwise scans topical depth, semantic context, and suggests exact anchor sentences.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[12px] text-muted">
              Deterministic relevance scoring prevents unnatural anchor repetition.
            </div>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[6px] bg-primary-tint text-primary font-semibold text-[14px] flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-[16px] font-semibold text-text mb-2">
                Apply with one click
              </h3>
              <p className="text-[14px] text-muted leading-relaxed">
                Approve individual recommendations or bulk apply directly to your live content safely.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[12px] text-muted">
              Instant automatic backup revision generated in WordPress before any update.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: WHAT YOU GET */}
      <section className="py-16 border-t border-border">
        <div className="flex flex-col items-start mb-10">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted mb-2">
            Features
          </span>
          <h2 className="text-[24px] font-semibold text-text tracking-tight">
            What you get
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Contextual link suggestions
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              AI analyzes surrounding paragraphs to find natural anchor placement without keyword stuffing.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Orphan page detection
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Instantly flag high-value articles that receive zero internal links from your existing content library.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <Link2Off className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Broken link monitoring
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Detect 404 dead ends and looping redirects immediately before search crawlers penalize your rankings.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <MailCheck className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Weekly report
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Receive concise Monday morning health scores, orphan counts, and link counts directly in your inbox.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <SpellCheck className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Anchor text variety
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Balance exact-match, partial-match, and branded anchors across topical clusters automatically.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="w-8 h-8 rounded-[4px] bg-primary-tint flex items-center justify-center mb-4 text-primary">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-[16px] font-semibold text-text mb-2">
              Approval before any change
            </h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Nothing updates without your explicit sign-off. Full audit logs and one-click rollback on every change.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: INTEGRITY / TRUST */}
      <section className="py-16 border-t border-border">
        <div className="flex flex-col items-start mb-10">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted mb-2">
            Integrity
          </span>
          <h2 className="text-[24px] font-semibold text-text tracking-tight">
            Built for SEO teams who cannot risk broken sites
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="flex items-center gap-2 text-primary mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[15px] font-semibold text-text">
                Safe by default
              </span>
            </div>
            <p className="text-[14px] text-muted leading-relaxed">
              We only edit a post when you click Apply. We never write to your theme files or alter plugin settings.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="flex items-center gap-2 text-primary mb-3">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[15px] font-semibold text-text">
                Nothing changes without your approval
              </span>
            </div>
            <p className="text-[14px] text-muted leading-relaxed">
              Every suggested internal link requires your explicit review before anything is modified in WordPress.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-[6px] border border-border">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Power className="w-4 h-4" />
              <span className="text-[15px] font-semibold text-text">
                Disconnect any time
              </span>
            </div>
            <p className="text-[14px] text-muted leading-relaxed">
              Revoke API application tokens with a single click in WordPress instantly. All access is immediately severed.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: FAQ */}
      <section className="py-16 border-t border-border" id="faq">
        <div className="flex flex-col items-start mb-10">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted mb-2">
            Questions
          </span>
          <h2 className="text-[24px] font-semibold text-text tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <Accordion className="w-full space-y-3">
          <AccordionItem value="item-1" className="bg-surface border border-border rounded-[6px] px-5 py-1">
            <AccordionTrigger className="text-[15px] font-medium text-text hover:no-underline">
              Does Linkwise slow down my WordPress site?
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted leading-relaxed pt-2">
              No. Linkwise operates via external background crawlers and lightweight REST API queries that take zero server CPU.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="bg-surface border border-border rounded-[6px] px-5 py-1">
            <AccordionTrigger className="text-[15px] font-medium text-text hover:no-underline">
              Can I undo links that I&apos;ve applied?
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted leading-relaxed pt-2">
              Yes, every link insertion is logged in your activity history and can be reverted with one click.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="bg-surface border border-border rounded-[6px] px-5 py-1">
            <AccordionTrigger className="text-[15px] font-medium text-text hover:no-underline">
              What counts as a scanned page?
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted leading-relaxed pt-2">
              Only published public posts and pages. Drafts, revisions, and taxonomies are excluded by default.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="bg-surface border border-border rounded-[6px] px-5 py-1">
            <AccordionTrigger className="text-[15px] font-medium text-text hover:no-underline">
              Do I need to install a heavy WordPress plugin?
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted leading-relaxed pt-2">
              No heavy plugin needed; Linkwise connects securely via standard native WordPress Application Passwords.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="bg-surface border border-border rounded-[6px] px-5 py-1">
            <AccordionTrigger className="text-[15px] font-medium text-text hover:no-underline">
              Is there a free trial?
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted leading-relaxed pt-2">
              Yes, our Free plan supports up to 20 pages forever without requiring a credit card.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* SECTION: CLOSING CTA */}
      <section className="mt-8">
        <div className="bg-surface rounded-[6px] border border-border p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col items-start text-left max-w-xl">
            <h2 className="text-[24px] font-semibold text-text tracking-tight">
              Fix your internal links this afternoon
            </h2>
            <p className="text-[15px] text-muted mt-2">
              Connect your WordPress site in 60 seconds.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="/signup">
              <Button className="h-[38px] px-6 bg-primary text-white hover:bg-primary-hover font-medium text-[14px] rounded-[6px]">
                Start free
              </Button>
            </Link>
            <span className="text-[12px] text-muted">Free 20 pages forever</span>
          </div>
        </div>
      </section>
    </div>
  );
}
