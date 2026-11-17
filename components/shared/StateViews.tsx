import React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between p-6 bg-surface rounded-[6px] border border-border gap-4 ${className}`}
    >
      <div className="flex flex-col gap-0.5 text-left">
        {title && <h4 className="text-[14px] font-semibold text-text">{title}</h4>}
        <p className="text-[13px] text-muted">{message}</p>
      </div>
      {actionLabel && (
        <Button
          onClick={onAction}
          variant="outline"
          className="h-9 px-4 text-[13px] border-border text-text font-medium shrink-0"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({
  message,
  onRetry,
  className = "",
}: InlineErrorProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 bg-[#FEE4E2]/40 rounded-[6px] border border-danger/30 text-danger text-[13px] gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          className="h-7 px-2 text-[12px] text-danger hover:bg-danger/10 hover:text-danger font-medium"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-surface rounded-[6px] border border-border overflow-hidden p-4 space-y-3">
      <div className="flex gap-4 pb-2 border-b border-border">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 items-center">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-7 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface p-5 rounded-[6px] border border-border space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

