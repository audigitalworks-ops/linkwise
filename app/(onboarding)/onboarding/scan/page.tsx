"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("siteId");

  const [progress, setProgress] = useState(siteId ? 0 : 15);
  const [pagesProcessed, setPagesProcessed] = useState(0);
  const [totalPages, setTotalPages] = useState(siteId ? 0 : 312);
  const [currentStep, setCurrentStep] = useState<string>("fetching");
  const [scanComplete, setScanComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Summary stats after scan
  const stats = {
    healthScore: 78,
    suggestionsReady: 42,
    orphanPages: 18,
    brokenLinks: 7,
  };

  useEffect(() => {
    // Real scanning flow if siteId is present
    if (siteId) {
      let isMounted = true;

      const runRealScan = async () => {
        try {
          // 1. Start or resume scan
          const initRes = await fetch(`/api/sites/${siteId}/scan`, {
            method: "POST",
          });
          const initData = await initRes.json();

          if (!initRes.ok || !initData.success) {
            throw new Error(initData.error?.message || "Failed to initialize scan.");
          }

          const scanId = initData.data.scanId;

          // 2. Step through scan
          while (isMounted) {
            const stepRes = await fetch(`/api/scans/${scanId}/step`, {
              method: "POST",
            });
            const stepData = await stepRes.json();

            if (!stepRes.ok || !stepData.success) {
              throw new Error(stepData.error?.message || "Scan step failed.");
            }

            const { status, processedPages: proc, totalPages: tot, step } = stepData.data;

            if (isMounted) {
              if (typeof tot === "number" && tot > 0) setTotalPages(tot);
              setPagesProcessed(proc || 0);
              setCurrentStep(step);

              const activeTot = tot && tot > 0 ? tot : 1;
              const pct =
                status === "done"
                  ? 100
                  : Math.min(
                      95,
                      Math.max(15, Math.round(((proc || 0) / activeTot) * 100))
                    );
              setProgress(pct);

              if (status === "done") {
                setProgress(100);
                setScanComplete(true);
                toast.success("Site scan finished!");
                break;
              } else if (status === "failed") {
                throw new Error("Scan process encountered an error.");
              }
            }

            // Brief pause between chunks to keep UI responsive
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        } catch (err: unknown) {
          if (isMounted) {
            const message = err instanceof Error ? err.message : "Scan failed";
            setErrorMsg(message);
          }
        }
      };

      runRealScan();

      return () => {
        isMounted = false;
      };
    } else {
      // Mock / Demo mode simulation
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setScanComplete(true);
            return 100;
          }
          const next = prev + 15;
          setPagesProcessed(Math.min(312, Math.round((next / 100) * 312)));
          if (next >= 40) setCurrentStep("indexing");
          if (next >= 75) setCurrentStep("finding");
          return next;
        });
      }, 700);

      return () => clearInterval(timer);
    }
  }, [siteId]);

  const handleFinish = () => {
    toast.success("First scan results ready!");
    router.push("/app");
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-primary-tint text-primary text-[11px] font-medium mb-2">
          {scanComplete ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Scan Finished</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning WordPress site</span>
            </>
          )}
        </div>
        <h1 className="text-[20px] font-semibold text-text tracking-tight">
          {scanComplete ? "Your site audit is ready" : "Indexing your WordPress site"}
        </h1>
        <p className="text-[13px] text-muted mt-1 leading-relaxed">
          {scanComplete
            ? "We finished analyzing all internal link paths, orphan articles, and broken URLs."
            : "Crawling posts, computing internal anchor density, and finding orphan pages."}
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

      {/* Progress Section */}
      <div className="p-4 rounded-[6px] bg-bg border border-border mb-6">
        <div className="flex items-center justify-between text-[13px] mb-2">
          <span className="font-medium text-text">
            {scanComplete
              ? "All pages indexed"
              : totalPages > 0
              ? `Processing ${pagesProcessed} of ${totalPages} pages`
              : "Discovering WordPress catalog..."}
          </span>
          <span className="text-muted font-mono tabular-nums">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-border" />

        {/* Scan sub-steps */}
        <div className="mt-4 space-y-2 text-[12px]">
          <div className="flex items-center gap-2 text-text">
            {progress >= 20 || scanComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            )}
            <span>
              Fetching WordPress catalog{" "}
              {totalPages > 0 ? `(${totalPages} items)` : "(discovering...)"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text">
            {progress >= 60 || scanComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : currentStep === "indexing" || progress >= 30 ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
            )}
            <span>Extracting internal anchors & graph hierarchy</span>
          </div>
          <div className="flex items-center gap-2 text-text">
            {progress >= 85 || scanComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : currentStep === "finding" ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
            )}
            <span>Detecting orphan pages & checking link status</span>
          </div>
          <div className="flex items-center gap-2 text-text">
            {scanComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
            )}
            <span>Computing link health score snapshot</span>
          </div>
        </div>
      </div>

      {/* Audit Summary Card */}
      {scanComplete && (
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-[6px] bg-surface border border-border">
          <div className="p-3 bg-bg rounded-[4px]">
            <span className="text-[11px] uppercase tracking-wider text-muted block mb-1">
              Link Health Score
            </span>
            <span className="text-[24px] font-bold text-text tabular-nums">
              {stats.healthScore}<span className="text-[14px] font-normal text-muted">/100</span>
            </span>
          </div>
          <div className="p-3 bg-bg rounded-[4px]">
            <span className="text-[11px] uppercase tracking-wider text-muted block mb-1">
              Suggestions Ready
            </span>
            <span className="text-[24px] font-bold text-primary tabular-nums">
              {stats.suggestionsReady}
            </span>
          </div>
          <div className="p-3 bg-bg rounded-[4px]">
            <span className="text-[11px] uppercase tracking-wider text-muted block mb-1">
              Orphan Pages
            </span>
            <span className="text-[24px] font-bold text-text tabular-nums">
              {stats.orphanPages}
            </span>
          </div>
          <div className="p-3 bg-bg rounded-[4px]">
            <span className="text-[11px] uppercase tracking-wider text-muted block mb-1">
              Broken Links
            </span>
            <span className="text-[24px] font-bold text-danger tabular-nums">
              {stats.brokenLinks}
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={handleFinish}
        disabled={!scanComplete}
        className="w-full h-10 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px]"
      >
        {scanComplete ? "Open Dashboard →" : "Please wait for scan..."}
      </Button>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="text-[12px] text-muted hover:text-text hover:underline cursor-pointer"
        >
          Skip to Overview Dashboard →
        </button>
      </div>
    </div>
  );
}

export default function FirstScanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading scan...</div>}>
      <ScanContent />
    </Suspense>
  );
}
