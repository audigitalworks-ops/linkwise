import React from "react";

export type PillStatus = "pending" | "applied" | "dismissed" | "404" | "301" | "redirect" | "active";

interface StatusPillProps {
  status: PillStatus;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className = "" }: StatusPillProps) {
  let displayLabel = label;
  let colorClasses = "bg-[#F0EDEA] text-[#6B6A65]";

  switch (status) {
    case "pending":
      displayLabel = label || "Pending";
      colorClasses = "bg-[#F0EDEA] text-[#6B6A65]";
      break;
    case "applied":
    case "active":
      displayLabel = label || "Applied";
      colorClasses = "bg-primary-tint text-primary";
      break;
    case "dismissed":
      displayLabel = label || "Dismissed";
      colorClasses = "bg-[#F0EDEA] text-[#6B6A65]";
      break;
    case "404":
      displayLabel = label || "404 Error";
      colorClasses = "bg-[#FEE4E2] text-danger";
      break;
    case "301":
    case "redirect":
      displayLabel = label || "301 Redirect";
      colorClasses = "bg-[#FEF0C7] text-warning";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[12px] font-medium leading-none tabular-nums ${colorClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
}

