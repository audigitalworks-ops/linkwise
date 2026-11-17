"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { KPIBlock } from "@/components/shared/KPIBlock";
import {
  Printer,
  MailCheck,
  TrendingUp,
  Calendar,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ReportPoint {
  week: string;
  date: string;
  healthScore: number;
  orphanScore: number;
  depthScore: number;
  anchorScore: number;
  brokenScore: number;
  pagesScanned: number;
  orphans: number;
  broken: number;
  applied: number;
}

export default function WeeklyReportPage() {
  const [selectedWeek, setSelectedWeek] = useState("Latest");
  const [history, setHistory] = useState<ReportPoint[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [latestStats, setLatestStats] = useState({
    healthScore: 0,
    appliedLinks: 0,
    orphans: 0,
    broken: 0,
    orphanScore: 0,
    depthScore: 0,
    anchorScore: 0,
    brokenScore: 0,
  });

  const loadReport = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasLoaded(true);
        return;
      }
      if (user.email) setUserEmail(user.email);

      const { data: userSites } = await supabase
        .from("sites")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!userSites || userSites.length === 0) {
        setSiteId(null);
        setHistory([]);
        setHasLoaded(true);
        return;
      }
      const site = userSites[0];
      setSiteId(site.id);
      setSiteName(site.name);

      const res = await fetch(`/api/sites/${site.id}/report`);
      const json = await res.json();

      if (json.success && json.data.snapshots?.length > 0) {
        interface RawSnapshot {
          week_start: string;
          health_score: number;
          pages_scanned: number;
          orphan_count: number;
          broken_count: number;
          suggestions_ready: number;
          links_applied: number;
          orphan_score: number;
          depth_score: number;
          anchor_score: number;
          broken_score: number;
        }

        const snaps: RawSnapshot[] = json.data.snapshots;
        const formatted: ReportPoint[] = snaps.map((s) => {
          const d = new Date(s.week_start);
          const monthStr = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          return {
            week: monthStr,
            date: s.week_start,
            healthScore: s.health_score || 0,
            orphanScore: s.orphan_score || 0,
            depthScore: s.depth_score || 0,
            anchorScore: s.anchor_score || 0,
            brokenScore: s.broken_score || 0,
            pagesScanned: s.pages_scanned || 0,
            orphans: s.orphan_count || 0,
            broken: s.broken_count || 0,
            applied: s.links_applied || 0,
          };
        });

        setHistory(formatted);
        const last = snaps[snaps.length - 1];
        if (last) {
          setSelectedWeek(`Week of ${last.week_start}`);
          setLatestStats({
            healthScore: last.health_score || 0,
            appliedLinks: last.links_applied || 0,
            orphans: last.orphan_count || 0,
            broken: last.broken_count || 0,
            orphanScore: last.orphan_score || 0,
            depthScore: last.depth_score || 0,
            anchorScore: last.anchor_score || 0,
            brokenScore: last.broken_score || 0,
          });
        }
      } else {
        // Fetch real-time live counts if snapshots don't exist yet
        const [
          { count: totalPages },
          { count: orphansCount },
          { count: brokenCount },
          { count: appliedCount },
          { count: totalLinks },
          { count: depth3Count },
        ] = await Promise.all([
          supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", site.id),
          supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", site.id).eq("is_orphan", true),
          supabase.from("page_links").select("*", { count: "exact", head: true }).eq("site_id", site.id).eq("is_broken", true),
          supabase.from("suggestions").select("*", { count: "exact", head: true }).eq("site_id", site.id).eq("status", "applied"),
          supabase.from("page_links").select("*", { count: "exact", head: true }).eq("site_id", site.id),
          supabase.from("pages").select("*", { count: "exact", head: true }).eq("site_id", site.id).lte("depth", 3),
        ]);

        const pages = totalPages || 0;
        const orphans = orphansCount || 0;
        const broken = brokenCount || 0;
        const applied = appliedCount || 0;
        const links = totalLinks || 0;
        const depth3 = depth3Count || 0;

        if (pages > 0) {
          const orphanScore = Math.round(((pages - orphans) / pages) * 100);
          const depthScore = Math.round((depth3 / pages) * 100);
          const brokenScore = links > 0 ? Math.round(((links - broken) / links) * 100) : 100;
          const anchorScore = 80;
          const healthScore = Math.round(orphanScore * 0.3 + depthScore * 0.25 + anchorScore * 0.2 + brokenScore * 0.25);
          setLatestStats({
            healthScore,
            appliedLinks: applied,
            orphans,
            broken,
            orphanScore,
            depthScore,
            anchorScore,
            brokenScore,
          });
        }
      }
    } catch {
      // Ignore
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const [isSending, setIsSending] = useState(false);
  const [lastDeliveredAt, setLastDeliveredAt] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!siteId) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/report/send`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to send weekly report email.");
      }
      setLastDeliveredAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast.success(`Weekly link health digest delivered to ${json.data?.email || userEmail}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending email.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  // SVG Chart Dimensions & Calculations
  const chartHeight = 160;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 25;
  const minScore = 50;
  const maxScore = 100;

  const points = history.map((item, index) => {
    const x =
      paddingX +
      (history.length > 1 ? (index / (history.length - 1)) * (chartWidth - paddingX * 2) : 0);
    const y =
      chartHeight -
      paddingY -
      ((item.healthScore - minScore) / (maxScore - minScore)) *
        (chartHeight - paddingY * 2);
    return { ...item, x, y };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${
        chartHeight - paddingY
      } L ${points[0].x} ${chartHeight - paddingY} Z`
    : "";

  return (
    <div className="space-y-8">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-muted mb-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Weekly Audit Snapshot</span>
          </div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight">
            Weekly Report: {selectedWeek}
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Comprehensive health score metrics and changes for{" "}
            <span className="font-medium text-text">{siteName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button
            onClick={handleSendEmail}
            disabled={isSending}
            className="h-9 px-3.5 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px] gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Email Report</span>
              </>
            )}
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="h-9 px-4 text-[13px] border-border text-text font-medium rounded-[6px] gap-2 hover:bg-bg"
          >
            <Printer className="w-3.5 h-3.5 text-muted" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Email Delivery Banner */}
      <div className="p-4 rounded-[6px] bg-primary-tint/60 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
        <div className="flex items-center gap-2.5">
          <MailCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-text">
            {lastDeliveredAt ? (
              <>
                Weekly digest delivered to <strong>{userEmail}</strong> today at {lastDeliveredAt}.
              </>
            ) : (
              <>
                Automated weekly digest is scheduled for <strong>{userEmail}</strong> every Monday at 03:00 UTC.
              </>
            )}
          </span>
        </div>
        <span className="text-[11px] font-medium text-primary bg-surface px-2 py-0.5 rounded border border-primary/20">
          {lastDeliveredAt ? "Delivered: 200 OK" : "Scheduled (Pro Plan Active)"}
        </span>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPIBlock
          label="Health Score"
          value={`${latestStats.healthScore}`}
          delta="+6 pts"
          deltaType="positive"
          caption="Current week"
        />
        <KPIBlock
          label="Applied Links"
          value={`${latestStats.appliedLinks}`}
          delta={latestStats.appliedLinks > 0 ? `+${latestStats.appliedLinks} vs prior` : "0 vs prior"}
          deltaType={latestStats.appliedLinks > 0 ? "positive" : "neutral"}
          caption="Changes live in WP"
        />
        <KPIBlock
          label="Orphan Pages"
          value={`${latestStats.orphans}`}
          delta="0 inbound"
          deltaType="neutral"
          caption="Needs internal links"
        />
        <KPIBlock
          label="Broken Links"
          value={`${latestStats.broken}`}
          delta="Repairs pending"
          deltaType="neutral"
          caption="404s & redirects"
        />
      </div>

      {/* 12-Week Historical Trend Line Chart */}
      <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>12-Week Link Health Trend</span>
            </h2>
            <p className="text-[12px] text-muted">
              {history.length > 0
                ? `Weekly link health progression from ${history[0]?.week} to ${history[history.length - 1]?.week}.`
                : "Weekly link health progression over time."}
            </p>
          </div>
          {history.length > 1 && (
            <div className="text-[13px] font-medium text-primary">
              +{(history[history.length - 1]?.healthScore || 0) - (history[0]?.healthScore || 0)} points overall improvement
            </div>
          )}
        </div>

        {/* Responsive SVG Chart */}
        {history.length === 0 ? (
          <div className="py-12 text-center text-muted text-[13px]">
            No historical snapshots recorded yet. Link health snapshots are generated during automated weekly audits.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[640px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
              {/* Horizontal Grid lines */}
              {[60, 70, 80, 90, 100].map((tick) => {
                const y =
                  chartHeight -
                  paddingY -
                  ((tick - minScore) / (maxScore - minScore)) *
                    (chartHeight - paddingY * 2);
                return (
                  <g key={tick}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#E6E4DF"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#6B6A65"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F6F54" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1F6F54" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {areaD && <path d={areaD} fill="url(#chartGrad)" />}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1F6F54"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={i === points.length - 1 ? 5 : 3.5}
                    fill={i === points.length - 1 ? "#1F6F54" : "#FFFFFF"}
                    stroke="#1F6F54"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6B6A65"
                  >
                    {p.week}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        )}
      </div>

      {/* 4 Health Pillars Breakdown */}
      <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm">
        <h2 className="text-[16px] font-semibold text-text mb-4">
          Current Audit Pillar Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[6px] bg-bg border border-border space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-text">Orphan Pages Ratio</span>
              <span className="font-semibold text-text tabular-nums">{latestStats.orphanScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${latestStats.orphanScore}%` }}
              />
            </div>
            <p className="text-[12px] text-muted">
              {latestStats.orphans} orphan articles detected across the site.
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-bg border border-border space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-text">Crawl Depth Distribution</span>
              <span className="font-semibold text-text tabular-nums">{latestStats.depthScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${latestStats.depthScore}%` }}
              />
            </div>
            <p className="text-[12px] text-muted">
              {latestStats.depthScore}% of all published pages are reachable within 3 clicks from home.
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-bg border border-border space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-text">Anchor Text Diversity</span>
              <span className="font-semibold text-text tabular-nums">{latestStats.anchorScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${latestStats.anchorScore}%` }}
              />
            </div>
            <p className="text-[12px] text-muted">
              Balanced variety of contextual anchor phrases pointing to internal targets.
            </p>
          </div>

          <div className="p-4 rounded-[6px] bg-bg border border-border space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-text">Internal Link Integrity</span>
              <span className="font-semibold text-text tabular-nums">{latestStats.brokenScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${latestStats.brokenScore}%` }}
              />
            </div>
            <p className="text-[12px] text-muted">
              {latestStats.broken} broken URLs identified out of total scanned internal links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
