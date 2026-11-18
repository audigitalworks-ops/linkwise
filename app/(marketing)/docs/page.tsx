import React from "react";
import Link from "next/link";
import { BookOpen, Key, CheckCircle2, ArrowRight, Code, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Documentation & WordPress Setup Guide",
  description: "Complete guide on connecting your WordPress site, creating Application Passwords, and automating internal links.",
};

export default function DocsPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[960px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-[720px] mb-12">
          <span className="inline-block text-[12px] font-semibold tracking-wider uppercase text-primary mb-3">
            Guides &amp; Reference
          </span>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-text mb-4">
            Linkwise Documentation
          </h1>
          <p className="text-[17px] text-muted leading-relaxed">
            Everything you need to know about connecting WordPress, scanning articles, managing orphan pages, and utilizing our REST API.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex flex-wrap gap-2 pb-8 mb-10 border-b border-border">
          <a
            href="#wordpress-setup"
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-surface border border-border hover:border-primary text-text transition-colors"
          >
            WordPress Setup Guide
          </a>
          <a
            href="#how-it-works"
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-surface border border-border hover:border-primary text-text transition-colors"
          >
            How Scanning Works
          </a>
          <a
            href="#orphans"
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-surface border border-border hover:border-primary text-text transition-colors"
          >
            Orphan Pages &amp; Health Score
          </a>
          <a
            href="#api"
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-surface border border-border hover:border-primary text-text transition-colors"
          >
            API Reference
          </a>
        </div>

        <div className="space-y-16 text-[15px] leading-relaxed text-muted">
          {/* SECTION 1: WordPress Setup */}
          <section id="wordpress-setup" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-text mb-2 flex items-center gap-2">
                <Key className="w-6 h-6 text-primary" />
                WordPress Setup Guide (Application Password)
              </h2>
              <p>
                Linkwise connects securely via WordPress core&apos;s native REST API. No plugin installation is required. Follow these steps to generate your connection credentials:
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="font-semibold text-text text-[16px] mb-2">Step 1: Open Your WordPress Profile</div>
                <p className="text-[14px] text-muted mb-3">
                  Log in to your WordPress admin dashboard (e.g. <code>https://yoursite.com/wp-admin</code>) and navigate to:
                </p>
                <div className="bg-bg px-4 py-2 rounded-md font-mono text-[13px] text-primary border border-border">
                  Users &rarr; Profile (or Users &rarr; All Users &rarr; Edit your user)
                </div>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="font-semibold text-text text-[16px] mb-2">Step 2: Generate an Application Password</div>
                <p className="text-[14px] text-muted mb-3">
                  Scroll down to the <strong>&ldquo;Application Passwords&rdquo;</strong> section at the bottom of the page:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-[14px]">
                  <li>Enter a friendly name in <em>&ldquo;New Application Password Name&rdquo;</em> (e.g., <code>Linkwise</code>).</li>
                  <li>Click the button <strong>&ldquo;Add New Application Password&rdquo;</strong>.</li>
                  <li>WordPress will display a 24-character code (formatted like <code>abcd efgh ijkl mnop qrst uvwx</code>).</li>
                  <li>Copy this password. (You will not be able to view it again once you leave the page).</li>
                </ol>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-border">
                <div className="font-semibold text-text text-[16px] mb-2">Step 3: Connect in Linkwise</div>
                <p className="text-[14px] text-muted mb-3">
                  In your Linkwise dashboard, go to <strong>Connect Site</strong> and enter:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
                  <li><strong>Site URL:</strong> Your full HTTPS WordPress domain (e.g. <code>https://myblog.com</code>)</li>
                  <li><strong>WordPress Username:</strong> Your admin username</li>
                  <li><strong>Application Password:</strong> The 24-character key generated in Step 2</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: How It Works */}
          <section id="how-it-works" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-text mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                How the Link Graph Engine Works
              </h2>
              <p>
                Once connected, Linkwise initiates an asynchronous crawl over the WordPress REST API:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-lg bg-surface border border-border space-y-2">
                <div className="text-[13px] font-bold text-primary uppercase tracking-wide">Stage 1</div>
                <div className="font-semibold text-text">Content Crawl</div>
                <p className="text-[14px]">
                  Fetches your published posts in batches of 20, extracting plain text, titles, URLs, and existing hyperlink structures.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-surface border border-border space-y-2">
                <div className="text-[13px] font-bold text-primary uppercase tracking-wide">Stage 2</div>
                <div className="font-semibold text-text">Graph Traversal</div>
                <p className="text-[14px]">
                  Maps incoming vs. outgoing links for every URL, calculating PageRank distribution and identifying isolated clusters.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-surface border border-border space-y-2">
                <div className="text-[13px] font-bold text-primary uppercase tracking-wide">Stage 3</div>
                <div className="font-semibold text-text">AI Matching</div>
                <p className="text-[14px]">
                  Our AI evaluates semantic context and generates exact anchor text suggestions scored from 0% to 100% relevance.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: API Reference */}
          <section id="api" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-text mb-2 flex items-center gap-2">
                <Code className="w-6 h-6 text-primary" />
                REST API Reference
              </h2>
              <p>
                Linkwise exposes clean REST endpoints for automated scans, suggestions, and application health monitoring:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="bg-bg px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-[13px]">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">POST</span>
                    <span>/api/scan/start</span>
                  </div>
                  <span className="text-[12px] text-muted">Triggers automated crawl</span>
                </div>
                <div className="p-4 font-mono text-[13px] bg-surface text-text">
                  <p className="text-muted mb-2">// Request Payload:</p>
                  <pre className="text-primary">{`{ "siteId": "3a690ef7-6cea-4f20-9146-77aa4caa5b26" }`}</pre>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="bg-bg px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-[13px]">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">POST</span>
                    <span>/api/suggestions/:id/apply</span>
                  </div>
                  <span className="text-[12px] text-muted">Applies link with conflict detection</span>
                </div>
                <div className="p-4 font-mono text-[13px] bg-surface text-text">
                  <p className="text-muted mb-2">// Response (200 OK):</p>
                  <pre className="text-primary">{`{ "success": true, "data": { "status": "applied", "activityId": "uuid" } }`}</pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

