"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/shared/StatusPill";
import { RelevanceBar } from "@/components/shared/RelevanceBar";
import { EmptyState, TableSkeleton } from "@/components/shared/StateViews";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface SuggestionItem {
  id: string;
  sourceTitle: string;
  sourcePath: string;
  targetTitle: string;
  targetPath: string;
  anchorText: string;
  sourceParagraph: string;
  relevance: number;
  status: "pending" | "applied" | "dismissed";
  activityId?: string;
}

export default function SuggestionsPage() {
  const [data, setData] = useState<SuggestionItem[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "applied" | "dismissed">("pending");
  const [minScore, setMinScore] = useState<number>(0.75);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Load user active site and suggestions
  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasLoaded(true);
        return;
      }

      const { data: userSites } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!userSites || userSites.length === 0) {
        setSiteId(null);
        setData([]);
        setHasLoaded(true);
        return;
      }
      const currentSiteId = userSites[0].id;
      setSiteId(currentSiteId);

      setIsLoading(true);
      const res = await fetch(
        `/api/sites/${currentSiteId}/suggestions?status=${statusFilter}&minRelevance=${minScore}&q=${encodeURIComponent(
          search
        )}&page=${page}&pageSize=${pageSize}`
      );
      const json = await res.json();

      if (json.success) {
        interface RawApiRow {
          id: string;
          anchor_text: string;
          source_paragraph: string;
          relevance: number;
          status: "pending" | "applied" | "dismissed";
          source_page?: { title?: string; path?: string } | null;
          target_page?: { title?: string; path?: string } | null;
        }

        const items: RawApiRow[] = json.data.suggestions || [];
        setData(
          items.map((s) => ({
            id: s.id,
            sourceTitle: s.source_page?.title || "Source Page",
            sourcePath: s.source_page?.path || "/",
            targetTitle: s.target_page?.title || "Target Page",
            targetPath: s.target_page?.path || "/",
            anchorText: s.anchor_text,
            sourceParagraph: s.source_paragraph || "",
            relevance: Number(s.relevance) || 0.85,
            status: s.status,
          }))
        );
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [statusFilter, minScore, search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (item.relevance < minScore) return false;
      if (
        search &&
        !item.sourceTitle.toLowerCase().includes(search.toLowerCase()) &&
        !item.targetTitle.toLowerCase().includes(search.toLowerCase()) &&
        !item.anchorText.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data, search, statusFilter, minScore]);

  // Handle Apply
  const handleApply = async (id: string) => {
    // Optimistic UI
    setData((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "applied" } : s))
    );

    if (siteId) {
      try {
        const res = await fetch(`/api/suggestions/${id}/apply`, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to apply link in WordPress.");
        }
        setData((prev) =>
          prev.map((s) => (s.id === id ? { ...s, activityId: json.data?.activityId } : s))
        );
        toast.success("Applied internal link in WordPress post!");
        await loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Apply failed";
        toast.error(message);
        // Revert optimistic
        setData((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "pending" } : s))
        );
      }
    } else {
      toast.success("Applied internal link in WordPress post (Demo mode)");
    }
  };

  // Handle Dismiss
  const handleDismiss = async (id: string) => {
    setData((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "dismissed" } : s))
    );

    if (siteId) {
      try {
        const res = await fetch(`/api/suggestions/${id}/dismiss`, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to dismiss.");
        }
        toast.info("Suggestion dismissed.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Dismiss failed";
        toast.error(message);
      }
    } else {
      toast.info("Suggestion dismissed (Demo mode).");
    }
  };

  // Handle Undo
  const handleUndo = async (item: SuggestionItem) => {
    setData((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: "pending" } : s))
    );

    if (siteId) {
      try {
        const res = await fetch(`/api/suggestions/${item.id}/undo`, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to undo.");
        }
        toast.success("Link removed from WordPress post!");
        await loadData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Undo failed";
        toast.error(message);
        // Revert optimistic
        setData((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: "applied" } : s))
        );
      }
    } else {
      toast.info("Link reverted to pending state (Demo mode).");
    }
  };

  // Handle Bulk Apply
  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    const toApply = [...selectedIds];

    setData((prev) =>
      prev.map((s) => (toApply.includes(s.id) ? { ...s, status: "applied" } : s))
    );
    setSelectedIds([]);

    if (siteId) {
      try {
        const res = await fetch("/api/suggestions/bulk-apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: toApply }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Bulk apply failed.");
        }
        toast.success(`Successfully applied ${json.data.appliedCount} links in WordPress!`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bulk apply failed";
        toast.error(message);
      }
    } else {
      toast.success(`Bulk applied ${toApply.length} links to WordPress (Demo mode)!`);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.filter((s) => s.status === "pending").map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Render paragraph with highlighted anchor text (No dangerouslySetInnerHTML)
  const renderHighlightedParagraph = (paragraph: string, anchor: string) => {
    if (!paragraph || !anchor) return <p className="text-[13px] text-muted">No preview available.</p>;

    const parts = paragraph.split(new RegExp(`(${anchor})`, "gi"));
    return (
      <p className="text-[13px] text-text leading-relaxed">
        {parts.map((part, index) =>
          part.toLowerCase() === anchor.toLowerCase() ? (
            <mark
              key={index}
              className="bg-primary-tint text-primary font-semibold px-1 rounded border border-primary/20"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight flex items-center gap-2">
            <span>Link Suggestions</span>
            <span className="text-[12px] bg-primary-tint text-primary font-medium px-2 py-0.5 rounded-[4px]">
              {data.filter((s) => s.status === "pending").length} Pending
            </span>
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Contextual internal link candidates scored by topical relevance and anchor variety.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted font-medium">
              {selectedIds.length} selected
            </span>
            <Button
              onClick={handleBulkApply}
              className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px]"
            >
              Apply Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-[6px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search source, target or anchor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px] border-border bg-bg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 bg-bg border border-border rounded-[6px] text-[12px]">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                statusFilter === "pending"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("applied")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                statusFilter === "applied"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Applied
            </button>
            <button
              onClick={() => setStatusFilter("dismissed")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                statusFilter === "dismissed"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              Dismissed
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              All
            </button>
          </div>

          {/* Min relevance filter */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg border border-border rounded-[6px] text-[12px] text-muted shrink-0">
            <span>Min score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              aria-label="Filter by minimum relevance score"
              className="bg-transparent font-medium text-text outline-none cursor-pointer"
            >
              <option value={0.75}>0.75</option>
              <option value={0.85}>0.85</option>
              <option value={0.90}>0.90</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !siteId && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="No Site Connected"
              message="Connect your WordPress site to start discovering AI-powered internal link opportunities."
              actionLabel="Connect WordPress Site"
              onAction={() => {
                window.location.href = "/onboarding/connect";
              }}
            />
          </div>
        ) : data.length === 0 && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="No Link Suggestions Yet"
              message="Your site has not generated any internal link suggestions yet. Run a site crawl from the Overview page to analyze your posts."
              actionLabel="Go to Overview to Scan"
              onAction={() => {
                window.location.href = "/app";
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              message="No link suggestions match your current filter criteria."
              actionLabel="Reset filters"
              onAction={() => {
                setSearch("");
                setStatusFilter("all");
                setMinScore(0.75);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-bg text-muted text-[11px] uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 w-10">
                    <Checkbox
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length ===
                          filtered.filter((s) => s.status === "pending").length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all pending suggestions"
                    />
                  </th>
                  <th className="py-3 pr-4 font-semibold">Source Page / Anchor</th>
                  <th className="py-3 px-4 font-semibold">Target Destination</th>
                  <th className="py-3 px-4 text-right font-semibold">Score</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 pr-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-bg/60 transition-colors cursor-pointer ${
                          isExpanded ? "bg-bg/40" : ""
                        }`}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                      >
                        <td
                          className="py-3.5 px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.status === "pending" && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRow(item.id)}
                              aria-label={`Select suggestion ${item.id}`}
                            />
                          )}
                        </td>
                        <td className="py-3.5 pr-4 max-w-[280px]">
                          <div className="flex items-center gap-1.5 font-medium text-text">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                            )}
                            <span className="truncate">{item.sourceTitle}</span>
                          </div>
                          <div className="pl-5 mt-1">
                            <span className="text-[11px] font-mono text-primary bg-primary-tint px-1.5 py-0.5 rounded">
                              &quot;{item.anchorText}&quot;
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="text-text font-medium truncate">
                            {item.targetTitle}
                          </div>
                          <div className="text-[11px] text-muted font-mono truncate">
                            {item.targetPath}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <RelevanceBar score={item.relevance} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <StatusPill status={item.status} />
                        </td>
                        <td
                          className="py-3.5 pr-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.status === "pending" && (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleApply(item.id)}
                                className="h-7 px-2.5 bg-primary text-white hover:bg-primary-hover text-[12px] rounded-[4px]"
                              >
                                Apply
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDismiss(item.id)}
                                className="h-7 w-7 p-0 text-muted hover:text-danger rounded-[4px]"
                                title="Dismiss suggestion"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                          {item.status === "applied" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUndo(item)}
                              className="h-7 px-2 text-[11px] border-border text-muted hover:text-text rounded-[4px] gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Undo</span>
                            </Button>
                          )}
                          {item.status === "dismissed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUndo(item)}
                              className="h-7 px-2 text-[11px] text-muted hover:text-text rounded-[4px]"
                            >
                              Restore
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row Context Preview */}
                      {isExpanded && (
                        <tr className="bg-bg/80 border-b border-border">
                          <td colSpan={6} className="p-4 pl-12">
                            <div className="bg-surface border border-border rounded-[6px] p-4 space-y-3">
                              <div className="flex items-center justify-between text-[11px] text-muted">
                                <span className="font-medium uppercase tracking-wider">
                                  Context Paragraph Preview in WordPress Post
                                </span>
                                <span>Source: {item.sourcePath}</span>
                              </div>
                              {renderHighlightedParagraph(
                                item.sourceParagraph,
                                item.anchorText
                              )}
                              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
                                <span>
                                  Target: <strong>{item.targetTitle}</strong> ({item.targetPath})
                                </span>
                                <span>Relevance: {(item.relevance * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-3 border-t border-border bg-bg flex items-center justify-between text-[12px] text-muted">
              <span>
                Showing {filtered.length} suggestions
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-[11px] border-border"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <span className="font-medium text-text">Page {page}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={filtered.length < pageSize}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2 text-[11px] border-border"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
