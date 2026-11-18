import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Key, Server, RefreshCw, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Security Architecture & Policy",
  description: "How Linkwise encrypts WordPress Application Passwords, secures API communication, and isolates customer data.",
};

export default function SecurityPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[840px] mx-auto px-4 md:px-8">
        <div className="mb-12 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-primary mb-3">
            <Lock className="w-4 h-4" />
            <span>Enterprise-Grade Protection</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text mb-4">
            Security Architecture &amp; Policy
          </h1>
          <p className="text-[16px] text-muted leading-relaxed">
            Linkwise is engineered with a strict zero-trust model. We never install third-party PHP code inside your WordPress server,
            and all credentials are encrypted using military-grade authenticated cryptography.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-[17px] font-semibold text-text mb-2">AES-256-GCM Encryption</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              WordPress Application Passwords are encrypted before hitting our database using 256-bit AES in Galois/Counter Mode with unique 96-bit initialization vectors.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-[17px] font-semibold text-text mb-2">Zero Plugin Bloat</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              We communicate solely over the native WordPress REST API. We never require plugin installation, protecting you from PHP remote code execution vulnerabilities.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-[17px] font-semibold text-text mb-2">Conflict Detection &amp; Undo</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              Every link update records an exact snapshot in our immutable activity log, enabling 1-click rollbacks and detecting concurrent editorial edits before writing.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[17px] font-semibold text-text mb-2">TLS 1.3 in Transit</h3>
            <p className="text-[14px] text-muted leading-relaxed">
              All data transmitted between your browser, our Next.js edge infrastructure, and your WordPress host is strictly encrypted with HTTPS/TLS 1.3.
            </p>
          </div>
        </div>

        {/* Deep Dive Sections */}
        <div className="space-y-8 text-[15px] leading-relaxed text-muted">
          <section className="bg-surface p-6 rounded-xl border border-border">
            <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              How Application Passwords Protect Your Site
            </h2>
            <p className="mb-3">
              Linkwise never asks for your personal WordPress login password. Instead, WordPress provides <strong>Application Passwords</strong>,
              an isolated authentication mechanism introduced in WordPress core:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>It cannot be used to log in through the WordPress administrative web interface.</li>
              <li>It operates only against authenticated REST API endpoints.</li>
              <li>You can revoke it in 1 second from <code>wp-admin &rarr; Users &rarr; Profile</code> without changing your master password.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">SSRF &amp; Target Validation</h2>
            <p>
              To protect against Server-Side Request Forgery (SSRF), Linkwise strictly validates all target WordPress URLs before opening network sockets.
              Requests targeting loopback addresses (<code>127.0.0.1</code>), private subnets (<code>10.0.0.0/8</code>, <code>192.168.0.0/16</code>),
              cloud metadata endpoints (<code>169.254.169.254</code>), or non-HTTPS URLs are rejected at the edge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">Responsible Security Disclosure</h2>
            <p>
              If you discover a security vulnerability or have a question about our encryption implementation, please contact our security team directly:{" "}
              <a href="mailto:audigitalworks@gmail.com" className="text-primary hover:underline font-medium">
                audigitalworks@gmail.com
              </a>. We treat all security reports with highest priority and respond within 24 hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
