import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg text-text p-4 sm:p-8">
      {/* Top Header */}
      <div className="w-full max-w-[400px] mx-auto flex items-center justify-between pt-4">
        <Logo href="/" />
        <Link
          href="/"
          className="text-[13px] text-muted hover:text-text transition-colors"
        >
          Back to home
        </Link>
      </div>

      {/* Main Form Center */}
      <main className="w-full max-w-[400px] mx-auto my-auto py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[400px] mx-auto text-center pb-4">
        <p className="text-[12px] text-muted">
          Protected by Linkwise SSO and WordPress Application API.
        </p>
      </footer>
    </div>
  );
}

