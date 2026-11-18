import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, ShieldCheck, Zap, GitCommit } from "lucide-react";

export const metadata = {
  title: "Changelog & Product Updates — Linkwise",
  description: "Stay up to date with new features, algorithm improvements, and engine releases in Linkwise.",
};

export default function ChangelogPage() {
  const releases = [
    {
      version: "v1.2.0",
      date: "November 18, 2026",
      badge: "Latest Release",
      title: "Concurrent Edit Conflict Detection & Live Global Billing",
      changes: [
        "Added real-time revision conflict detection: If an article is edited in WordPress after a scan, Linkwise safely detects the conflict and asks for a rescan instead of overwriting edits.",
        "Launched Dodo Payments Live Mode integration with support for both domestic UPI AutoPay and international credit/debit cards.",
        "Introduced yearly billing discount toggles across Pro ($79/yr) and Agency ($279/yr) tiers.",
        "Integrated Google Analytics 4 (GA4) and Google Search Console automated sitemap indexing.",
      ],
    },
    {
      version: "v1.1.0",
      date: "November 16, 2026",
      badge: "Major Update",
      title: "AI Contextual Relevance Scoring with Groq",
      changes: [
        "Integrated ultra-fast LLM inference using Groq SDK for semantic paragraph link suggestions.",
        "Added intelligent anchor text extraction matching verbatim occurrences in WordPress post bodies.",
        "Implemented fallback related-link paragraphs if target anchor keywords are not explicitly present inline.",
        "Optimized link graph metric calculations with Promise.all parallelization.",
      ],
    },
    {
      version: "v1.0.0",
      date: "November 14, 2026",
      badge: "Initial Launch",
      title: "Public Release of Linkwise Internal Linking Engine",
      changes: [
        "Core WordPress REST API connection with AES-256-GCM encrypted Application Passwords.",
        "Real-time Orphan Page identification (pages with zero inbound links).",
        "404 Broken Internal Link detection and repair queue.",
        "Automated weekly email health report system powered by Resend.",
        "Full 1-click Undo history recorded in immutable activity logs.",
      ],
    },
  ];

  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[760px] mx-auto px-4 md:px-8">
        <div className="mb-12 pb-8 border-b border-border">
          <span className="inline-block text-[12px] font-semibold tracking-wider uppercase text-primary mb-3">
            What&apos;s New
          </span>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-text mb-4">
            Product Changelog
          </h1>
          <p className="text-[16px] text-muted leading-relaxed">
            New features, performance enhancements, and security upgrades shipped to the Linkwise engine.
          </p>
        </div>

        <div className="space-y-12">
          {releases.map((release, i) => (
            <div key={i} className="relative pl-8 border-l border-border space-y-4">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-bg" />

              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[14px] font-bold text-primary">
                  {release.version}
                </span>
                <span className="text-[13px] text-muted">{release.date}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                  {release.badge}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-text">{release.title}</h2>

              <ul className="space-y-2.5 text-[14px] text-muted">
                {release.changes.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
