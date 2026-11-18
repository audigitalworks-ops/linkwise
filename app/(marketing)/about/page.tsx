import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About Linkwise — Our Story & Mission",
  description: "Learn why we built Linkwise: a fast, cloud-native internal linking automation platform for WordPress.",
};

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[880px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-[700px] mb-12">
          <span className="inline-block text-[12px] font-semibold tracking-wider uppercase text-primary mb-3">
            Our Mission
          </span>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-text mb-6">
            Internal linking should take seconds, not weekends.
          </h1>
          <p className="text-[17px] text-muted leading-relaxed">
            Linkwise was founded by full-stack engineers and SEO practitioners who were tired of heavy WordPress plugins slowing down servers and manual linking spreadsheets eating up entire workweeks.
          </p>
        </div>

        {/* Narrative */}
        <div className="space-y-10 text-[15px] leading-relaxed text-muted">
          <div className="bg-surface p-8 rounded-xl border border-border space-y-4">
            <h2 className="text-xl font-semibold text-text">The Problem We Saw</h2>
            <p>
              In modern search engine optimization, internal linking is one of the single most reliable ways to distribute PageRank equity, boost crawl depth, and signal topical authority to Google.
            </p>
            <p>
              Yet in practice, almost every growing WordPress blog suffers from the same two fatal flaws:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-bg border border-border">
                <div className="font-semibold text-text mb-1">1. The Orphan Page Black Hole</div>
                <div className="text-[14px]">
                  Over 40% of published articles have zero incoming internal links, meaning search engine bots rarely find or re-crawl them.
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bg border border-border">
                <div className="font-semibold text-text mb-1">2. Plugin Bloat &amp; Server Crashes</div>
                <div className="text-[14px]">
                  Traditional WordPress linking plugins run heavy SQL queries directly on your live database, causing high TTFB and slowdowns.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-text">The Cloud-Native Architecture</h2>
            <p>
              We decided to rethink internal linking from the ground up:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">External Graph Engine</h3>
                <p className="text-[14px]">
                  We crawl and calculate link equity on serverless edge nodes. Your WordPress server CPU stays at 0%.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">Contextual AI Relevance</h3>
                <p className="text-[14px]">
                  Using advanced LLM scoring, we find natural, high-relevance anchor phrases that feel completely organic.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text">Safe 1-Click Publishing</h3>
                <p className="text-[14px]">
                  Full undo history and conflict detection protect your content before anything is touched in WordPress.
                </p>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="p-8 rounded-xl bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to audit your blog?</h3>
              <p className="text-white/80 text-[14px]">
                Scan your first 20 pages completely free in under 30 seconds.
              </p>
            </div>
            <Link href="/signup">
              <Button className="h-11 px-6 bg-white text-primary hover:bg-white/90 font-medium text-[14px] rounded-[6px] shadow-sm">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
