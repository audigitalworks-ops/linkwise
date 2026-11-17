"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, log to internal telemetry or monitoring
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#FEE4E2] flex items-center justify-center text-danger mb-6">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-danger mb-2">
        Application Error
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text max-w-md">
        Something unexpected went wrong
      </h1>

      <p className="text-[14px] text-muted mt-3 max-w-sm leading-relaxed">
        An unexpected error occurred while processing your request. Our system has logged the event.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Button
          onClick={() => reset()}
          className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </Button>
      </div>
    </div>
  );
}

