"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ConnectSitePage() {
  const router = useRouter();
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!siteUrl || !username || !appPassword) {
      setErrorMsg("All fields are required to connect your WordPress site.");
      return;
    }

    if (!siteUrl.startsWith("https://")) {
      setErrorMsg("WordPress site URL must use HTTPS.");
      return;
    }

    setIsTesting(true);
    try {
      // 1. Test Connection
      const testRes = await fetch("/api/sites/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: siteUrl,
          username,
          appPassword,
        }),
      });

      const testData = await testRes.json();
      if (!testRes.ok || !testData.success) {
        setErrorMsg(testData.error?.message || "Failed to connect to WordPress site.");
        return;
      }

      const pagesFound = testData.data?.pagesFound || 312;

      // 2. Create / Register Site
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URL(siteUrl).hostname.replace("www.", ""),
          url: siteUrl,
          username,
          appPassword,
        }),
      });

      const siteData = await siteRes.json();
      if (!siteRes.ok || !siteData.success) {
        setErrorMsg(siteData.error?.message || "Failed to save site.");
        return;
      }

      toast.success(`Connected! Found ${pagesFound} published pages.`);
      router.push(`/onboarding/scan?siteId=${siteData.data.siteId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setErrorMsg(message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-text tracking-tight">
          Connect your WordPress site
        </h1>
        <p className="text-[13px] text-muted mt-1 leading-relaxed">
          Linkwise connects securely via native WordPress Application Passwords to scan posts and pages.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3 rounded-[6px] bg-[#FEE4E2]/50 border border-danger/30 text-danger text-[12px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <Label className="text-[13px] font-medium text-text mb-1.5 block">
            WordPress Site URL
          </Label>
          <Input
            type="url"
            placeholder="https://example.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            required
            className="h-10 text-[13px] border-border bg-surface"
          />
          <span className="text-[11px] text-muted mt-1 block">
            Include https:// (must be publicly reachable)
          </span>
        </div>

        <div>
          <Label className="text-[13px] font-medium text-text mb-1.5 block">
            WordPress Username
          </Label>
          <Input
            type="text"
            placeholder="admin or editor username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-10 text-[13px] border-border bg-surface"
          />
          <span className="text-[11px] text-muted mt-1 block">
            Needs Editor or Administrator role in WordPress
          </span>
        </div>

        <div>
          <Label className="text-[13px] font-medium text-text mb-1.5 block">
            Application Password
          </Label>
          <Input
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            required
            className="h-10 text-[13px] border-border bg-surface font-mono"
          />
          <span className="text-[11px] text-muted mt-1 block">
            Generated from your WordPress user profile screen
          </span>
        </div>

        {/* Security & Instruction Card */}
        <div className="p-3.5 rounded-[6px] bg-bg border border-border space-y-2 mt-4 text-[12px]">
          <div className="flex items-center gap-1.5 font-medium text-text">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>We only edit a post when you click Apply</span>
          </div>
          <p className="text-muted leading-relaxed">
            In WordPress Admin, go to <strong>Users → Profile</strong>, scroll down to <strong>Application Passwords</strong>, enter &quot;Linkwise&quot; and click <em>Add New</em>. Copy the 16-character code above.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isTesting}
          className="w-full h-10 mt-6 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px]"
        >
          {isTesting ? "Testing connection..." : "Test Connection & Continue →"}
        </Button>
      </form>
    </div>
  );
}
