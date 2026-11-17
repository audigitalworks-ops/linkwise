import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-primary mb-6 shadow-sm">
        <Compass className="w-7 h-7" />
      </div>

      <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-muted mb-2">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text max-w-md">
        The link you followed might be broken
      </h1>

      <p className="text-[14px] text-muted mt-3 max-w-sm leading-relaxed">
        We couldn&apos;t find the page you were looking for. It may have been moved, deleted, or never existed.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Link href="/">
          <Button variant="outline" className="h-9 px-4 text-[13px] border-border text-text gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Homepage</span>
          </Button>
        </Link>
        <Link href="/app">
          <Button className="h-9 px-4 text-[13px] bg-primary text-white hover:bg-primary-hover font-medium">
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

