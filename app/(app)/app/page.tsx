"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KPIBlock } from "@/components/shared/KPIBlock";
import { StatusPill } from "@/components/shared/StatusPill";
import { RelevanceBar } from "@/components/shared/RelevanceBar";
import {
  MockSuggestion,
  MockActivityItem,
} from "@/lib/mock-data";
import {
  RefreshCw,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface SuggestionRow {
  id: string;
  anchor_text: string;
  relevance: number;
  status: string;
  source_page?: { title?: string; path?: string } | null;
  target_page?: { title?: string; path?: string } | null;
}

interface ActivityRow {
  id: string;
  action: MockActivityItem["action"];
  details?: { description?: string; target?: string } | null;
  created_at: string;
}

export default function OverviewPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [site, setSite] = useState<{ id: string; name: string; url: string } | null>(null);
  const [kpis, setKpis] = useState({
    healthScore: 0,
    healthDelta: 0,
    totalPages: 0,
    pagesDelta: 0,
    suggestionsReady: 0,
    orphansCount: 0,
    brokenCount: 0,
    orphanScore: 0,
    depthScore: 0,
    anchorScore: 0,
    brokenScore: 0,
  });
  const [suggestions, setSuggestions] = useState<MockSuggestion[]>([]);
  const [activity, setActivity] = useState<MockActivityItem[]>([]);

  // Load real data from Supabase
  const loadSiteData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get user's active site
      const { data: userSites } = await supabase
        .from("sites")
        .select("id, name, url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!userSites || userSites.length === 0) {
        setSite(null);
        setKpis({
          healthScore: 0,
          healthDelta: 0,
          totalPages: 0,
          pagesDelta: 0,
          suggestionsReady: 0,
          orphansCount: 0,
          brokenCount: 0,
          orphanScore: 0,
          depthScore: 0,
          anchorScore: 0,
          brokenScore: 0,
        });
        setSuggestions([]);
        setActivity([]);
        return;
      }

      const activeSite = userSites[0];
      setSite(activeSite);

      // Fetch all overview data in parallel in a single round-trip
      const [
        { count: totalPages },
        { count: orphansCount },
        { count: brokenCount },
        { count: suggestionsCount },
        { count: totalLinks },
        { count: depth3Count },
        { data: snapshot },
        { data: realSuggs },
        { data: realActivity },
      ] = await Promise.all([
        supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id),
        supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id).eq("is_orphan", true),
        supabase.from("page_links").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id).eq("is_broken", true),
        supabase.from("suggestions").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id).eq("status", "pending"),
        supabase.from("page_links").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id),
        supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", activeSite.id).lte("depth", 3),
        supabase.from("report_snapshots").select("*").eq("site_id", activeSite.id).order("week_start", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("suggestions").select(`
          id,
          anchor_text,
          relevance,
          status,
          source_page:source_page_id(title, path),
          target_page:target_page_id(title, path)
        `).eq("site_id", activeSite.id).eq("status", "pending").order("relevance", { ascending: false }).limit(4),
        supabase.from("activity_log").select("id, action, details, created_at").eq("site_id", activeSite.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const pages = totalPages || 0;
      const orphans = orphansCount || 0;
      const broken = brokenCount || 0;
      const suggs = suggestionsCount || 0;
      const links = totalLinks || 0;
      const depth3 = depth3Count || 0;

      const orphanScore = pages > 0 ? Math.round(((pages - orphans) / pages) * 100) : 100;
      const depthScore = pages > 0 ? Math.round((depth3 / pages) * 100) : 100;
      const brokenScore = links > 0 ? Math.max(0, Math.round(((links - broken) / links) * 100)) : 100;
      const anchorScore = snapshot?.anchor_score ?? 80;
      const healthScore = Math.round(
        orphanScore * 0.3 + depthScore * 0.25 + anchorScore * 0.2 + brokenScore * 0.25
      );

      setKpis({
        healthScore: pages > 0 ? healthScore : 0,
        healthDelta: 0,
        totalPages: pages,
        pagesDelta: 0,
        suggestionsReady: suggs,
        orphansCount: orphans,
        brokenCount: broken,
        orphanScore,
        depthScore,
        anchorScore,
        brokenScore,
      });

      if (realSuggs && realSuggs.length > 0) {
        const typedSuggs = realSuggs as unknown as SuggestionRow[];
        setSuggestions(
          typedSuggs.map((s) => ({
            id: s.id,
            sourceTitle: s.source_page?.title || "Source Page",
            sourcePath: s.source_page?.path || "/",
            targetTitle: s.target_page?.title || "Target Page",
            targetPath: s.target_page?.path || "/",
            anchorText: s.anchor_text,
            sourceParagraph: "",
            relevance: Number(s.relevance) || 0.85,
            status: s.status as "pending" | "applied" | "dismissed",
            createdAt: "Recently",
            monthlyClicks: "-",
          }))
        );
      } else {
        setSuggestions([]);
      }

      if (realActivity && realActivity.length > 0) {
        const typedActivity = realActivity as unknown as ActivityRow[];
        setActivity(
          typedActivity.map((a) => ({
            id: a.id,
            action: (a.action as MockActivityItem["action"]) || "scan_completed",
            description: a.details?.description || a.action.replace("_", " "),
            target: a.details?.target || "",
            timeAgo: a.created_at ? new Date(a.created_at).toLocaleDateString() : "Recently",
            canUndo: a.action === "link_applied",
          }))
        );
      } else {
        setActivity([]);
      }
    } catch {
      // Clean fallback on error
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSiteData();
  }, [loadSiteData]);

  // Handle Scan button
  const handleScan = async () => {
    setIsScanning(true);
    const siteName = site?.name || "Your Website";

    if (site?.id) {
      try {
        toast.info(`Starting scan for ${siteName}...`);
        const initRes = await fetch(`/api/sites/${site.id}/scan`, { method: "POST" });
        const initData = await initRes.json();

        if (!initRes.ok || !initData.success) {
          throw new Error(initData.error?.message || "Failed to trigger scan.");
        }

        const scanId = initData.data.scanId;
        let done = false;

        while (!done) {
          const stepRes = await fetch(`/api/scans/${scanId}/step`, { method: "POST" });
          const stepData = await stepRes.json();
          if (!stepRes.ok || !stepData.success) {
            throw new Error(stepData.error?.message || "Scan step failed.");
          }

          if (stepData.data.status === "done") {
            done = true;
            toast.success("Scan complete! Real data updated.");
            await loadSiteData();
            break;
          } else if (stepData.data.status === "failed") {
            throw new Error("Scan encountered an error.");
          }

          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Scan failed";
        toast.error(message);
      } finally {
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
      toast.info("Please connect your WordPress site first to run a scan.");
      router.push("/onboarding/connect");
    }
  };

  const handleApply = async (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "applied" } : s))
    );
    try {
      const res = await fetch(`/api/suggestions/${id}/apply`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to apply link.");
      }
      toast.success("Applied internal link in WordPress post!");
      await loadSiteData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Apply failed";
      toast.error(message);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "pending" } : s))
      );
    }
  };

  const handleUndo = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activity/${activityId}/undo`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to undo.");
      }
      setActivity((prev) => prev.filter((a) => a.id !== activityId));
      toast.success("Link modification restored in WordPress!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Undo failed";
      toast.error(message);
    }
  };

  const currentSiteName = site?.name || "Your Website";

  return (
    <div className="space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight">
            Overview
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Site link health, pending recommendations, and crawl activity for{" "}
            <span className="font-medium text-text">{currentSiteName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {site ? (
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px] gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning..." : "Scan Now"}</span>
            </Button>
          ) : (
            <Link href="/onboarding/connect">
              <Button className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px] gap-2">
                <span>Connect WordPress Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!site && (
        <div className="p-4 rounded-[6px] bg-primary-tint/40 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-primary">
              Connect your WordPress site to begin
            </h3>
            <p className="text-[12px] text-muted mt-0.5">
              Linkwise crawls your site in seconds and uses AI to surface high-relevance internal linking opportunities.
            </p>
          </div>
          <Link href="/onboarding/connect">
            <Button size="sm" className="bg-primary text-white hover:bg-primary-hover text-[12px] whitespace-nowrap">
              Connect Site Now →
            </Button>
          </Link>
        </div>
      )}

      {/* KPI 5-column / 2x2 responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPIBlock
          label="Health Score"
          value={`${kpis.healthScore}`}
          delta={`+${kpis.healthDelta} pts`}
          deltaType="positive"
          caption="Out of 100 max"
        />
        <KPIBlock
          label="Total Pages"
          value={`${kpis.totalPages}`}
          delta={`+${kpis.pagesDelta}`}
          deltaType="neutral"
          caption="Posts & pages crawled"
        />
        <KPIBlock
          label="Suggestions"
          value={`${kpis.suggestionsReady}`}
          delta="Ready"
          deltaType="positive"
          caption="Contextual links"
        />
        <KPIBlock
          label="Orphan Pages"
          value={`${kpis.orphansCount}`}
          delta="0 inbound"
          deltaType="negative"
          caption="Needs internal links"
        />
        <KPIBlock
          label="Broken Links"
          value={`${kpis.brokenCount}`}
          delta={`${kpis.brokenCount} to fix`}
          deltaType="negative"
          caption="404s & redirects"
        />
      </div>

      {/* Health Score Formula Breakdown */}
      <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-text">
              Health Score Breakdown
            </h2>
            <p className="text-[12px] text-muted">
              Weighted formula based on crawl depth, orphan ratio, anchor diversity and HTTP status.
            </p>
          </div>
          <Link
            href="/app/report"
            className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
          >
            <span>View 12-week report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Orphan Score (30%)</span>
              <span className="font-semibold text-text tabular-nums">
                {kpis.orphanScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${kpis.orphanScore}%` }}
              />
            </div>
            <span className="text-[11px] text-muted block">
              {kpis.orphansCount} orphans / {kpis.totalPages} total pages
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Crawl Depth (25%)</span>
              <span className="font-semibold text-text tabular-nums">
                {kpis.depthScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${kpis.depthScore}%` }}
              />
            </div>
            <span className="text-[11px] text-muted block">
              Pages within 3 clicks of home
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Anchor Variety (20%)</span>
              <span className="font-semibold text-text tabular-nums">
                {kpis.anchorScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${kpis.anchorScore}%` }}
              />
            </div>
            <span className="text-[11px] text-muted block">
              Non-duplicate anchor ratio
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Link Health (25%)</span>
              <span className="font-semibold text-text tabular-nums">
                {kpis.brokenScore}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${kpis.brokenScore}%` }}
              />
            </div>
            <span className="text-[11px] text-muted block">
              {kpis.brokenCount} broken / internal links
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Suggestions Table + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Suggestions (8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-[6px] border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div>
                <h2 className="text-[16px] font-semibold text-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Pending Link Suggestions</span>
                </h2>
                <p className="text-[12px] text-muted">
                  High-relevance links ready for one-click placement.
                </p>
              </div>
              <Link
                href="/app/suggestions"
                className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
              >
                <span>View all ({kpis.suggestionsReady})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-border">
                    <th className="py-2.5 pr-4">Source Page & Suggested Anchor</th>
                    <th className="py-2.5 px-4">Target Page</th>
                    <th className="py-2.5 px-4 text-right">Score</th>
                    <th className="py-2.5 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suggestions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted text-[13px]">
                        No pending link suggestions. Click &quot;Scan Now&quot; to crawl your WordPress posts and generate AI link opportunities.
                      </td>
                    </tr>
                  ) : (
                    suggestions.map((sug) => (
                      <tr key={sug.id} className="hover:bg-bg/50 transition-colors">
                        <td className="py-3.5 pr-4 max-w-[220px]">
                          <div className="font-medium text-text truncate">
                            {sug.sourceTitle}
                          </div>
                          <div className="mt-1">
                            <span className="text-[11px] font-mono text-primary bg-primary-tint px-1.5 py-0.5 rounded">
                              &quot;{sug.anchorText}&quot;
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted max-w-[180px] truncate">
                          {sug.targetTitle}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <RelevanceBar score={sug.relevance} />
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          {sug.status === "applied" ? (
                            <StatusPill status="applied" />
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApply(sug.id)}
                              className="h-7 px-3 bg-primary text-white hover:bg-primary-hover text-[12px] rounded-[4px]"
                            >
                              Apply
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity & Audit Trail (4 cols) */}
        <div className="lg:col-span-4 bg-surface rounded-[6px] border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <h2 className="text-[16px] font-semibold text-text">
                Recent Activity
              </h2>
              <span className="text-[11px] text-muted uppercase tracking-wider">
                Audit Log
              </span>
            </div>

            <div className="space-y-4">
              {activity.length === 0 ? (
                <div className="py-8 text-center text-muted text-[13px]">
                  No recent activity recorded. Scans and link changes will appear here.
                </div>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-[6px] bg-bg border border-border flex flex-col gap-1 text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text truncate pr-2">
                        {item.description}
                      </span>
                      <span className="text-muted shrink-0 text-[11px]">
                        {item.timeAgo}
                      </span>
                    </div>
                    <span className="text-muted text-[11px] truncate">
                      {item.target}
                    </span>
                    {item.canUndo && (
                      <button
                        type="button"
                        onClick={() => handleUndo(item.id)}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px] mt-1 self-start"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Undo change</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 text-[12px] text-muted text-center">
            All edits backed up in WordPress revisions.
          </div>
        </div>
      </div>
    </div>
  );
}
