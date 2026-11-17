import React from "react";

interface RelevanceBarProps {
  score?: number | null; // e.g. 0.94
  showScore?: boolean;
  className?: string;
}

export function RelevanceBar({ score, showScore = true, className = "" }: RelevanceBarProps) {
  const numScore = typeof score === "number" && !isNaN(score) ? score : 0;
  const percentage = Math.min(100, Math.max(0, Math.round(numScore * 100)));

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showScore && (
        <span className="font-mono text-[13px] font-medium text-text tabular-nums">
          {numScore.toFixed(2)}
        </span>
      )}
      <div className="h-1 w-12 rounded-full bg-[#E6E4DF] overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

