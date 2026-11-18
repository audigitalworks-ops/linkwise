"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="h-16 max-w-[1120px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <Logo href="/" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-[14px]">
            <Link
              href="/#how-it-works"
              className="text-muted hover:text-text transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className={`transition-colors ${
                pathname === "/pricing"
                  ? "text-primary font-medium"
                  : "text-muted hover:text-text"
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className={`transition-colors ${
                pathname === "/docs"
                  ? "text-primary font-medium"
                  : "text-muted hover:text-text"
              }`}
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className={`transition-colors ${
                pathname === "/blog"
                  ? "text-primary font-medium"
                  : "text-muted hover:text-text"
              }`}
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="text-muted hover:text-text transition-colors"
            >
              Log in
            </Link>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link href="/signup" className="hidden sm:inline-block">
              <Button className="h-9 px-4 bg-primary text-white hover:bg-primary-hover font-medium text-[13px] rounded-[6px]">
                Start free
              </Button>
            </Link>

            {/* Mobile hamburger menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                className="md:hidden h-9 w-9 inline-flex items-center justify-center text-muted hover:text-text rounded-[6px]"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-surface p-6">
                <div className="flex flex-col gap-6 mt-4">
                  <Logo href="/" />
                  <div className="flex flex-col gap-4 text-[15px] pt-4 border-t border-border">
                    <Link
                      href="/#how-it-works"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted hover:text-text"
                    >
                      Features
                    </Link>
                    <Link
                      href="/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        pathname === "/pricing"
                          ? "text-primary font-medium"
                          : "text-muted hover:text-text"
                      }
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/docs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        pathname === "/docs"
                          ? "text-primary font-medium"
                          : "text-muted hover:text-text"
                      }
                    >
                      Docs
                    </Link>
                    <Link
                      href="/blog"
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        pathname === "/blog"
                          ? "text-primary font-medium"
                          : "text-muted hover:text-text"
                      }
                    >
                      Blog
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted hover:text-text"
                    >
                      Log in
                    </Link>
                  </div>
                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-10 bg-primary text-white hover:bg-primary-hover rounded-[6px]">
                        Start free
                      </Button>
                    </Link>
                    <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-10 border-border">
                        Go to App Demo
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* 4-column footer */}
      <footer className="w-full bg-surface border-t border-border mt-16">
        <div className="max-w-[1120px] mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-muted mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-[14px]">
                <li>
                  <Link href="/app" className="text-muted hover:text-text transition-colors">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="/app/suggestions" className="text-muted hover:text-text transition-colors">
                    Link Suggestions
                  </Link>
                </li>
                <li>
                  <Link href="/app/orphans" className="text-muted hover:text-text transition-colors">
                    Orphan Pages
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted hover:text-text transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-muted mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5 text-[14px]">
                <li>
                  <Link href="/docs" className="text-muted hover:text-text transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs#api" className="text-muted hover:text-text transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/docs#wordpress-setup" className="text-muted hover:text-text transition-colors">
                    WordPress Setup
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="text-muted hover:text-text transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-muted mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-[14px]">
                <li>
                  <Link href="/about" className="text-muted hover:text-text transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted hover:text-text transition-colors">
                    SEO Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted hover:text-text transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[12px] font-medium uppercase tracking-wider text-muted mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-[14px]">
                <li>
                  <Link href="/privacy" className="text-muted hover:text-text transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted hover:text-text transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-muted hover:text-text transition-colors">
                    Security Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-muted">
            <p>© 2026 Linkwise Technologies. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>WordPress Internal Linking Intelligence</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
