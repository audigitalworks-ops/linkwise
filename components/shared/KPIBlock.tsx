import React from "react";

interface KPIBlockProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  caption?: string;
  className?: string;
}

export function KPIBlock({
  label,
  value,
  delta,
  deltaType = "neutral",
  caption,
  className = "",
}: KPIBlockProps) {
  return (
    <div
      className={`bg-surface p-5 rounded-[6px] border border-border flex flex-col justify-between ${className}`}
    >
      <div className="text-[12px] font-medium text-muted uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[28px] font-semibold text-text tracking-tight tabular-nums">
          {value}
        </div>
        {delta && (
          <div
            className={`text-[12px] font-medium tabular-nums ${
              deltaType === "positive"
                ? "text-primary"
                : deltaType === "negative"
                ? "text-danger"
                : "text-muted"
            }`}
          >
            {delta}
          </div>
        )}
      </div>
      {caption && <div className="text-[12px] text-muted mt-2">{caption}</div>}
    </div>
  );
}

