"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState, TableSkeleton } from "@/components/shared/StateViews";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Wrench,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface BrokenLinkItem {
  id: string;
  sourceTitle: string;
  sourceUrl?: string;
  targetUrl: string;
  anchorText: string;
  statusCode: number;
  type: "404" | "redirect";
  redirectTarget?: string;
  foundAt: string;
}

export default function BrokenLinksPage() {
  const [links, setLinks] = useState<BrokenLinkItem[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "404" | "redirect">("all");
  const [search, setSearch] = useState("");
  const [fixingLink, setFixingLink] = useState<BrokenLinkItem | null>(null);
  const [replacementUrl, setReplacementUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrokenLinks = useCallback(async () => {
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
        setLinks([]);
        setHasLoaded(true);
        return;
      }
      const currentSiteId = userSites[0].id;
      setSiteId(currentSiteId);

      setIsLoading(true);
      const res = await fetch(`/api/sites/${currentSiteId}/broken-links?type=${filterType}`);
      const json = await res.json();

      if (json.success) {
        interface RawBrokenRow {
          id: string;
          target_url: string;
          anchor_text: string;
          http_status: number | null;
          created_at: string;
          source_page?: { title?: string; url?: string } | null;
        }

        const items: RawBrokenRow[] = json.data.brokenLinks || [];
        setLinks(
          items.map((b) => {
            const code = b.http_status || 404;
            const isRedirect = code === 301 || code === 302 || code === 307 || code === 308;
            return {
              id: b.id,
              sourceTitle: b.source_page?.title || "Source Article",
              sourceUrl: b.source_page?.url || "/",
              targetUrl: b.target_url,
              anchorText: b.anchor_text,
              statusCode: code,
              type: isRedirect ? "redirect" : "404",
              foundAt: b.created_at ? new Date(b.created_at).toLocaleDateString() : "Recent",
            };
          })
        );
      } else {
        setLinks([]);
      }
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [filterType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBrokenLinks();
  }, [loadBrokenLinks]);

  const filtered = links.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (
      search &&
      !item.sourceTitle.toLowerCase().includes(search.toLowerCase()) &&
      !item.targetUrl.toLowerCase().includes(search.toLowerCase()) &&
      !item.anchorText.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleFixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixingLink) return;

    const targetId = fixingLink.id;
    const oldTitle = fixingLink.sourceTitle;
    setLinks((prev) => prev.filter((l) => l.id !== targetId));
    setFixingLink(null);

    if (siteId) {
      try {
        setIsSubmitting(true);
        const res = await fetch(`/api/broken-links/${targetId}/fix`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "replace", newUrl: replacementUrl }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to update link in WordPress.");
        }
        toast.success(`Updated broken link in "${oldTitle}"!`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Fix failed";
        toast.error(message);
        loadBrokenLinks();
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.success(`Updated broken link in "${oldTitle}" (Demo mode)!`);
    }
  };

  const handleRemoveLink = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));

    if (siteId) {
      try {
        const res = await fetch(`/api/broken-links/${id}/fix`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove" }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to unlink in WordPress.");
        }
        toast.info("Unlinked anchor text and saved original revision in WordPress.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unlink failed";
        toast.error(message);
        loadBrokenLinks();
      }
    } else {
      toast.info("Unlinked anchor text and saved original revision in WordPress (Demo mode).");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight flex items-center gap-2">
            <span>Broken Links & Redirects</span>
            <span className="text-[12px] bg-[#FEE4E2] text-danger font-medium px-2 py-0.5 rounded-[4px]">
              {links.length} Detected
            </span>
          </h1>
          <p className="text-[13px] text-muted mt-1">
            Internal hyperlinks leading to 404 pages or 301 redirect chains. Fix them to preserve link equity.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            toast.info("Checking links status...");
            loadBrokenLinks();
          }}
          className="h-9 px-4 text-[13px] border-border text-text font-medium rounded-[6px] gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted" />
          <span>Recheck Links</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-[6px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search broken links or targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-[13px] border-border bg-bg"
          />
        </div>

        <div className="inline-flex items-center p-1 bg-bg border border-border rounded-[6px] text-[12px]">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              filterType === "all"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            All Issues ({links.length})
          </button>
          <button
            onClick={() => setFilterType("404")}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              filterType === "404"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            404 Dead Ends ({links.filter((l) => l.type === "404").length})
          </button>
          <button
            onClick={() => setFilterType("redirect")}
            className={`px-3 py-1 rounded-[4px] font-medium transition-colors ${
              filterType === "redirect"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            301 Redirects ({links.filter((l) => l.type === "redirect").length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-[6px] overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !siteId && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="No Site Connected"
              message="Connect your WordPress site to crawl links and detect 404s and redirect loops."
              actionLabel="Connect WordPress Site"
              onAction={() => {
                window.location.href = "/onboarding/connect";
              }}
            />
          </div>
        ) : links.length === 0 && hasLoaded ? (
          <div className="p-8">
            <EmptyState
              title="All Internal Links Healthy"
              message="No broken links (404s) or redirect chains detected across your scanned WordPress posts."
              actionLabel="Go to Overview"
              onAction={() => {
                window.location.href = "/app";
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              message="No broken links match your filters. All internal targets reachable!"
              actionLabel="Reset filters"
              onAction={() => {
                setFilterType("all");
                setSearch("");
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-bg text-muted text-[11px] uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 font-semibold">Source Page / Anchor Text</th>
                  <th className="py-3 px-4 font-semibold">Broken Target URL</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Last Checked</th>
                  <th className="py-3 pr-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-medium text-text truncate">
                        {item.sourceTitle}
                      </div>
                      <div className="mt-1">
                        <span className="text-[11px] font-mono text-muted bg-bg px-1.5 py-0.5 rounded border border-border">
                          &quot;{item.anchorText}&quot;
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="text-text font-mono text-[12px] truncate">
                        {item.targetUrl}
                      </div>
                      {item.redirectTarget && (
                        <div className="text-[11px] text-warning flex items-center gap-1 mt-0.5 font-mono truncate">
                          <span>↳ redirects to:</span>
                          <span className="underline truncate">{item.redirectTarget}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusPill
                        status={item.statusCode === 404 ? "404" : "301"}
                        label={`${item.statusCode} ${
                          item.statusCode === 404 ? "Not Found" : "Redirect"
                        }`}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[12px]">
                      {item.foundAt}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => {
                            setFixingLink(item);
                            setReplacementUrl(
                              item.redirectTarget || ""
                            );
                          }}
                          className="h-7 px-2.5 bg-primary text-white hover:bg-primary-hover text-[12px] rounded-[4px] gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Fix</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLink(item.id)}
                          className="h-7 px-2 text-[11px] text-muted hover:text-danger rounded-[4px]"
                        >
                          Unlink
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fix URL Dialog */}
      {fixingLink && (
        <Dialog open={!!fixingLink} onOpenChange={(open) => !open && setFixingLink(null)}>
          <DialogContent className="max-w-[480px] bg-surface p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold text-text">
                Fix Broken Link
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleFixSubmit} className="space-y-4 mt-2">
              <div className="p-3 rounded-[6px] bg-bg border border-border text-[12px] space-y-1">
                <span className="text-muted block">In post:</span>
                <span className="font-medium text-text block">
                  {fixingLink.sourceTitle}
                </span>
                <span className="text-muted block mt-1">Anchor text:</span>
                <span className="font-mono text-primary font-medium">
                  &quot;{fixingLink.anchorText}&quot;
                </span>
              </div>

              <div>
                <Label className="text-[13px] font-medium text-text mb-1.5 block">
                  Enter Correct Target URL
                </Label>
                <Input
                  type="url"
                  value={replacementUrl}
                  onChange={(e) => setReplacementUrl(e.target.value)}
                  required
                  placeholder="https://example.com/valid-page"
                  className="h-10 text-[13px] border-border bg-surface font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFixingLink(null)}
                  className="h-9 px-4 text-[13px] border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px]"
                >
                  {isSubmitting ? "Updating..." : "Update in WordPress"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
