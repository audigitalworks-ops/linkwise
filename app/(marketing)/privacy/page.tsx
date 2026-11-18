import React from "react";
import Link from "next/link";
import { ShieldCheck, Calendar } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how Linkwise collects, protects, and handles your data and WordPress credentials.",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[800px] mx-auto px-4 md:px-8">
        <div className="mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-primary mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text mb-3">
            Privacy Policy
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Calendar className="w-4 h-4" />
            <span>Last updated: November 18, 2026</span>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">1. Introduction</h2>
            <p>
              Linkwise (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy and security.
              This Privacy Policy explains how we collect, store, encrypt, and handle personal data and WordPress website credentials
              when you use our automated internal linking platform at <code>https://linkwise-app.vercel.app</code>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">2. Data We Collect</h2>
            <p>When you register, connect a WordPress site, or use Linkwise services, we collect the following categories of data:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong className="text-text">Account Information:</strong> Your name, email address, and authentication provider identifiers (e.g. Google OAuth or Supabase Auth).
              </li>
              <li>
                <strong className="text-text">WordPress Site Connection:</strong> Site URL, WordPress administrative username, and WordPress Application Password.
              </li>
              <li>
                <strong className="text-text">Crawled Content Data:</strong> Publicly accessible post titles, URLs, excerpts, word counts, and extracted HTML anchor link graphs necessary to calculate relevance scores and orphan page detection.
              </li>
              <li>
                <strong className="text-text">Billing Information:</strong> Payments are processed directly through our Merchant of Record, <strong>Dodo Payments</strong>. We never store credit card numbers, CVVs, or bank account PINs on our servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">3. WordPress Application Password Security</h2>
            <p>
              Your WordPress Application Password is never stored in plaintext. We utilize industry-grade <strong>AES-256-GCM authenticated encryption</strong>.
              Decryption only occurs ephemerally in serverless memory during an authenticated crawl or link application request, and is immediately discarded.
              You can revoke an Application Password at any time directly in your WordPress dashboard (<code>Users &rarr; Profile &rarr; Application Passwords</code>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">4. How We Use Your Data</h2>
            <p>We use collected data solely to deliver and improve Linkwise capabilities:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>To scan your WordPress articles via the standard WordPress REST API.</li>
              <li>To compute internal link recommendations and identify broken links or orphan pages.</li>
              <li>To apply approved anchor links to your posts upon your explicit direction.</li>
              <li>To send automated weekly link health email digests via Resend (which you can disable at any time).</li>
              <li>We do <strong>NOT</strong> sell, rent, or monetize your content or personal information to third-party data brokers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">5. Data Retention &amp; Deletion</h2>
            <p>
              You maintain full ownership of your data. When you disconnect a WordPress site or delete your account in Linkwise settings,
              all associated crawl records, suggestion history, link graphs, and encrypted credentials are automatically purged from our database.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">6. Cookies &amp; Analytics</h2>
            <p>
              We utilize essential authentication cookies to keep you signed in securely. We also use privacy-focused Google Analytics 4 (GA4)
              to track aggregate site engagement, bounce rates, and conversion metrics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">7. Contact Privacy Team</h2>
            <p>
              For data access requests, deletion requests, or questions regarding this Privacy Policy, contact our team at:{" "}
              <a href="mailto:audigitalworks@gmail.com" className="text-primary hover:underline font-medium">
                audigitalworks@gmail.com
              </a>{" "}
              or submit our <Link href="/contact" className="text-primary hover:underline font-medium">Contact Form</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

