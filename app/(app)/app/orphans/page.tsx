"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RelevanceBar } from "@/components/shared/RelevanceBar";
import { EmptyState, TableSkeleton } from "@/components/shared/StateViews";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CandidateSource {
  sourcePageId?: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourcePath?: string;
  suggestedAnchor: string;
  relevance: number;
}

interface OrphanItem {
  id: string;
  title: string;
  path: string;
  url?: string;
  publishedDate: string;
  wordCount: number;
  inboundCount: number;
  outboundCount: number;
  candidates: CandidateSource[];
}

export default function OrphansPage() {
  const [orphans, setOrphans] = useState<OrphanItem[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeModalOrphan, setActiveModalOrphan] = useState<OrphanItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [dynamicCandidates, setDynamicCandidates] = useState<CandidateSource[]>([]);

  const loadOrphans = useCallback(async () => {
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
        setOrphans([]);
        setHasLoaded(true);
        return;
      }
      const currentSiteId = userSites[0].id;
      setSiteId(currentSiteId);

      setIsLoading(true);
      const res = await fetch(`/api/sites/${currentSiteId}/orphans`);
      const json = await res.json();

      if (json.success) {
        interface RawOrphanRow {
          id: string;
          title: string;
          url: string;
          path: string;
          word_count: number | null;
          inbound_count: number | null;
          outbound_count: number | null;
          created_at: string;
        }

        const items: RawOrphanRow[] = json.data.orphans || [];
        setOrphans(
          items.map((o) => ({
            id: o.id,
            title: o.title,
            path: o.path,
            url: o.url,
            publishedDate: o.created_at ? new Date(o.created_at).toLocaleDateString() : "Recent",
            wordCount: o.word_count || 0,
            inboundCount: o.inbound_count || 0,
            outboundCount: o.outbound_count || 0,
            candidates: [],
          }))
        );
      } else {
        setOrphans([]);
      }
    } catch {
      setOrphans([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrphans();
  }, [loadOrphans]);

  const handleOpenCandidates = async (orphan: OrphanItem) => {
    setActiveModalOrphan(orphan);
    setDynamicCandidates(orphan.candidates);

    try {
      setModalLoading(true);
      const res = await fetch(`/api/pages/${orphan.id}/link-candidates`);
      const json = await res.json();

      if (json.success && json.data?.candidates?.length > 0) {
        interface RawCandidateRow {
          sourcePageId?: string;
          id?: string;
          sourceTitle?: string;
          title?: string;
          sourceUrl?: string;
          url?: string;
          sourcePath?: string;
          path?: string;
          suggestedAnchor?: string;
          relevance?: number;
          relevanceScore?: number;
        }

        const candidates: RawCandidateRow[] = json.data.candidates;
        setDynamicCandidates(
          candidates.map((c) => ({
            sourcePageId: c.sourcePageId || c.id || "",
            sourceTitle: c.sourceTitle || c.title || "Untitled Source",
            sourceUrl: c.sourceUrl || c.url || "",
            sourcePath: c.sourcePath || c.path || "",
            suggestedAnchor: c.suggestedAnchor || orphan.title.toLowerCase().split(" ").slice(0, 3).join(" "),
            relevance: typeof c.relevance === "number" ? c.relevance : (typeof c.relevanceScore === "number" ? c.relevanceScore : 0.85),
          }))
        );
      }
    } catch {
      // Keep orphan candidates
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = orphans.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.path.toLowerCase().includes(search.toLowerCase())
  );

  const [isCreatingLink, setIsCreatingLink] = useState(false);

  const handleLinkCandidate = async (cand: CandidateSource) => {
    if (!activeModalOrphan || !siteId) return;

    try {
      setIsCreatingLink(true);
      const res = await fetch("/api/suggestions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          sourcePageId: cand.sourcePageId,
          targetPageId: activeModalOrphan.id,
          anchorText: cand.suggestedAnchor,
          relevance: cand.relevance,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create suggestion.");
      }

      toast.success(
        `Created link suggestion with anchor "${cand.suggestedAnchor}"! Review it in Link Suggestions.`
      );
      setActiveModalOrphan(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create suggestion.";
      toast.error(message);
    } finally {
      setIsCreatingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight flex items-center gap-2">
            <span>Orphan Pages</span>
            <span className="text-[12px] bg-[#FEF0C7] text-warning font-medium px-2 py-0.5 rounded-[4px]">
              {orphans.length} Found
            </span>
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Articles that have zero internal links pointing to them. Crawlers and readers have trouble discovering these.
          </p>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div className="p-4 rounded-[6px] bg-[#FEF0C7]/40 border border-warning/30 flex items-start sm:items-center justify-between gap-4 text-[13px]">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <span className="font-semibold text-text">
              {orphans.length} published pages have zero inbound links.
            </span>{" "}
            <span className="text-muted">
              Linking from contextually relevant parent articles will boost search indexing and organic visibility.
            </span>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search orphan articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-[13px] border-border bg-bg"
            />
          </div>
          <div className="text-[12px] text-muted font-medium">
            Showing {filtered.length} of {orphans.length} orphan pages
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !siteId && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="No Site Connected"
              message="Connect your WordPress site to crawl pages and detect orphan articles without inbound links."
              actionLabel="Connect WordPress Site"
              onAction={() => {
                window.location.href = "/onboarding/connect";
              }}
            />
          </div>
        ) : orphans.length === 0 && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="No Orphan Pages Detected"
              message="Great news! All published pages have inbound internal links, or no pages have been scanned yet."
              actionLabel="Go to Overview"
              onAction={() => {
                window.location.href = "/app";
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              message="No orphan pages match your search."
              actionLabel="Clear search"
              onAction={() => setSearch("")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-bg text-muted text-[11px] uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 font-semibold">Orphan Article</th>
                  <th className="py-3 px-4 font-semibold">Published</th>
                  <th className="py-3 px-4 text-center font-semibold">Inbound</th>
                  <th className="py-3 px-4 text-center font-semibold">Outbound</th>
                  <th className="py-3 px-4 font-semibold">Best Candidate Sources</th>
                  <th className="py-3 pr-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-medium text-text truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted font-mono truncate mt-0.5">
                        {item.path}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {item.publishedDate}
                      <span className="text-[11px] block font-mono text-muted/70">
                        {item.wordCount} words
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#FEE4E2] text-danger text-[11px] font-mono font-medium">
                        0 links
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-muted">
                      {item.outboundCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 max-w-[240px]">
                        {item.candidates.slice(0, 2).map((cand, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-muted flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{cand.sourceTitle}</span>
                            <span className="font-mono text-primary font-medium shrink-0">
                              {(((cand.relevance ?? 0.85)) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCandidates(item)}
                        className="h-7 px-3 text-[12px] border-border text-primary hover:bg-primary-tint font-medium rounded-[4px] gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Find Links</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidates Modal */}
      {activeModalOrphan && (
        <Dialog
          open={!!activeModalOrphan}
          onOpenChange={(open) => !open && setActiveModalOrphan(null)}
        >
          <DialogContent className="sm:max-w-[560px] w-full bg-surface p-6 rounded-[8px] border border-border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold text-text">
                Best Linking Candidates for Orphan
              </DialogTitle>
            </DialogHeader>

            <div className="mt-2 space-y-4 w-full">
              <div className="p-3.5 rounded-[6px] bg-bg border border-border w-full">
                <span className="text-[11px] uppercase tracking-wider text-muted block mb-1 font-medium">
                  Target Orphan Article:
                </span>
                <span className="text-[14px] font-semibold text-text block truncate">
                  {activeModalOrphan.title}
                </span>
                <span className="text-[12px] text-muted font-mono block mt-0.5 truncate">
                  {activeModalOrphan.path}
                </span>
              </div>

              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                    Recommended Source Pages to Insert a Link:
                  </span>
                  {modalLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  )}
                </div>

                {dynamicCandidates.length === 0 && !modalLoading && (
                  <div className="p-4 rounded-[6px] border border-border bg-bg text-center text-[12px] text-muted">
                    No matching source pages found yet.
                  </div>
                )}

                {dynamicCandidates.map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-[6px] border border-border bg-surface hover:bg-bg/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full overflow-hidden"
                  >
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      <span className="text-[13px] font-medium text-text truncate">
                        {cand.sourceTitle}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] truncate">
                        <span className="text-muted text-[11px]">Anchor:</span>
                        <span className="text-primary font-mono bg-primary-tint px-1.5 py-0.5 rounded text-[11px] truncate">
                          &quot;{cand.suggestedAnchor}&quot;
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <RelevanceBar score={cand.relevance ?? 0.85} />
                      <Button
                        size="sm"
                        disabled={isCreatingLink}
                        onClick={() => handleLinkCandidate(cand)}
                        className="h-7 px-3 bg-primary text-white hover:bg-primary-hover text-[11px] font-medium rounded-[4px] shrink-0"
                      >
                        Create Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
