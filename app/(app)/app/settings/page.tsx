"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [scanFrequency, setScanFrequency] = useState<"weekly" | "manual">("weekly");
  const [minRelevance, setMinRelevance] = useState(0.75);
  const [requireApproval, setRequireApproval] = useState(true);
  const [ignorePatterns, setIgnorePatterns] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasLoaded(true);
        return;
      }

      const { data: userSites } = await supabase
        .from("sites")
        .select("id, name, url, wp_username, scan_frequency, min_relevance, ignore_patterns, require_approval")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!userSites || userSites.length === 0) {
        setHasLoaded(true);
        return;
      }
      const site = userSites[0];

      setSiteId(site.id);
      if (site.name) setSiteName(site.name);
      if (site.url) setSiteUrl(site.url);
      if (site.wp_username) setWpUsername(site.wp_username);
      if (site.scan_frequency) setScanFrequency(site.scan_frequency as "weekly" | "manual");
      if (site.min_relevance !== null && site.min_relevance !== undefined) setMinRelevance(Number(site.min_relevance));
      if (site.require_approval !== null && site.require_approval !== undefined) setRequireApproval(site.require_approval);
      if (site.ignore_patterns) setIgnorePatterns(site.ignore_patterns.join("\n"));
    } catch {
      // Ignore
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const patterns = ignorePatterns
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    if (siteId) {
      try {
        const res = await fetch(`/api/sites/${siteId}/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanFrequency,
            minRelevance,
            ignorePatterns: patterns,
            requireApproval,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to update settings.");
        }
        toast.success("Settings saved successfully!");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Save failed";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    } else {
      setTimeout(() => {
        setIsSaving(false);
        toast.success("Settings saved successfully (Demo mode)!");
      }, 500);
    }
  };

  const handleDisconnect = async () => {
    if (siteId) {
      try {
        setIsDeleting(true);
        const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to disconnect site.");
        }
        setShowDisconnectModal(false);
        toast.error("Site disconnected. Access credentials removed.");
        router.push("/onboarding/connect");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Disconnect failed";
        toast.error(message);
      } finally {
        setIsDeleting(false);
      }
    } else {
      setShowDisconnectModal(false);
      toast.error("Site disconnected (Demo mode).");
      router.push("/onboarding/connect");
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold text-text tracking-tight">
          Site Settings
        </h1>
        <p className="text-[13px] text-muted mt-1">
          {siteName
            ? `Configure crawl schedules, AI link suggestion thresholds and URL ignore rules for ${siteName}.`
            : "Configure crawl schedules, AI link suggestion thresholds and URL ignore rules."}
        </p>
      </div>

      {!siteId && hasLoaded ? (
        <div className="bg-surface rounded-[6px] border border-border p-8 text-center space-y-4">
          <h2 className="text-[16px] font-semibold text-text">No WordPress Site Connected</h2>
          <p className="text-[13px] text-muted max-w-md mx-auto">
            Connect your WordPress site to configure automated crawl schedules, AI relevance thresholds, and URL ignore rules.
          </p>
          <Button
            type="button"
            onClick={() => router.push("/onboarding/connect")}
            className="bg-primary text-white hover:bg-primary-hover text-[13px] h-9 px-4 rounded-[6px]"
          >
            Connect WordPress Site →
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
        {/* WordPress Connection Status Card */}
        <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text">
              WordPress Connection
            </h2>
            <div className="flex items-center gap-1.5 text-[12px] text-primary font-medium bg-primary-tint px-2.5 py-0.5 rounded-[4px]">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Connected via REST API</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] font-medium text-text mb-1.5 block">
                Site Name
              </Label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="h-9 text-[13px] border-border bg-bg"
              />
            </div>
            <div>
              <Label className="text-[13px] font-medium text-text mb-1.5 block">
                Site URL
              </Label>
              <Input
                value={siteUrl}
                disabled
                className="h-9 text-[13px] border-border bg-bg/50 text-muted font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[12px] text-muted">
            <span>
              Connected WordPress user: <strong>{wpUsername}</strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDisconnectModal(true)}
              className="h-8 px-2.5 text-danger hover:bg-danger/10 hover:text-danger text-[12px] rounded-[4px]"
            >
              Disconnect site...
            </Button>
          </div>
        </div>

        {/* Crawl & AI Configuration */}
        <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text">
              Scan & Relevance Rules
            </h2>
            <p className="text-[12px] text-muted">
              Control automated background indexing and AI suggestion quality.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[13px] font-medium text-text mb-1.5 block">
                Scan Frequency
              </Label>
              <select
                value={scanFrequency}
                onChange={(e) =>
                  setScanFrequency(e.target.value as "weekly" | "manual")
                }
                className="w-full sm:w-64 h-9 px-3 rounded-[6px] border border-border bg-bg text-[13px] font-medium text-text outline-none"
              >
                <option value="weekly">Weekly automated scan (Monday 03:00 UTC)</option>
                <option value="manual">Manual scans only</option>
              </select>
              <span className="text-[11px] text-muted mt-1 block">
                Weekly scans automatically update your health report score.
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-text">
                  Minimum AI Relevance Score
                </Label>
                <span className="font-mono text-[13px] font-semibold text-primary">
                  {(minRelevance * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.60"
                max="0.95"
                step="0.05"
                value={minRelevance}
                onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted">
                <span>0.60 (More suggestions)</span>
                <span>0.95 (High strictness)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <Label className="text-[13px] font-medium text-text block">
                  Require Manual Approval
                </Label>
                <p className="text-[12px] text-muted">
                  Never edit WordPress content automatically without explicit user review.
                </p>
              </div>
              <Switch
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
              />
            </div>
          </div>
        </div>

        {/* URL Exclusion Patterns */}
        <div className="bg-surface rounded-[6px] border border-border p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text">
              URL Ignore Patterns
            </h2>
            <p className="text-[12px] text-muted">
              Specify paths that should be skipped during link suggestions (one pattern per line).
            </p>
          </div>

          <Textarea
            rows={5}
            value={ignorePatterns}
            onChange={(e) => setIgnorePatterns(e.target.value)}
            className="font-mono text-[12px] border-border bg-bg leading-relaxed"
          />

          <span className="text-[11px] text-muted block">
            Supports wildcard <code>*</code> matching (e.g. <code>/author/*</code>, <code>/tag/*</code>).
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-9 px-6 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px] gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </Button>
        </div>
      </form>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <Dialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
          <DialogContent className="max-w-[420px] bg-surface p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold text-text flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <span>Disconnect WordPress Site?</span>
              </DialogTitle>
            </DialogHeader>

            <p className="text-[13px] text-muted mt-2 leading-relaxed">
              Disconnecting will immediately delete your encrypted WordPress application credentials and stop scheduled scans for <strong>{siteName}</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setShowDisconnectModal(false)}
                className="h-9 px-4 text-[13px] border-border"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDisconnect}
                className="h-9 px-4 text-[13px] rounded-[6px]"
              >
                {isDeleting ? "Disconnecting..." : "Yes, Disconnect"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
