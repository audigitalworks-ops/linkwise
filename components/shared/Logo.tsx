import Link from "next/link";

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({ href = "/", className = "", showText = true }: LogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-primary text-white">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
      {showText && (
        <span className="font-sans text-[16px] font-semibold tracking-tight text-text">
          Linkwise
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-2 hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

