import React from "react";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of the Linkwise WordPress internal linking platform.",
};

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[800px] mx-auto px-4 md:px-8">
        <div className="mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-primary mb-3">
            <FileText className="w-4 h-4" />
            <span>User Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text mb-3">
            Terms of Service
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Calendar className="w-4 h-4" />
            <span>Last updated: November 18, 2026</span>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed text-muted">
          <section>
            <h2 className="text-xl font-semibold text-text mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Linkwise (the &ldquo;Service&rdquo;) provided at <code>https://linkwise-app.vercel.app</code>,
              you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">2. Description of Service</h2>
            <p>
              Linkwise provides automated WordPress internal link recommendations, orphan page discovery, link equity graph visualization,
              and remote link application via the WordPress REST API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">3. WordPress Site Permissions &amp; Ownership</h2>
            <p>
              You represent and warrant that you own or have explicit administrative authorization to connect each WordPress domain you add to Linkwise.
              You are responsible for keeping backups of your WordPress content. While Linkwise records full rollback snapshots in the activity log for every applied link,
              you acknowledge that content changes published to WordPress are performed under your account authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">4. Subscriptions, Billing &amp; Cancellations</h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong className="text-text">Plans &amp; Limits:</strong> Linkwise offers Free, Pro, and Agency tiers with published page and site limits.
              </li>
              <li>
                <strong className="text-text">Merchant of Record:</strong> Billing and payment processing is operated by <strong>Dodo Payments</strong>.
                Subscriptions renew automatically monthly or yearly according to your chosen interval.
              </li>
              <li>
                <strong className="text-text">Cancellation:</strong> You can cancel your subscription at any time via the Customer Portal in your billing settings.
                Upon cancellation, you retain access until the end of your prepaid billing period.
              </li>
              <li>
                <strong className="text-text">Refunds:</strong> We provide a 14-day satisfaction money-back guarantee for first-time paid subscribers upon request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">5. Fair Use &amp; Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use the Service to connect websites that publish malware, phishing content, or violate applicable laws.</li>
              <li>Reverse engineer, scrape, or attempt to compromise Linkwise API infrastructure.</li>
              <li>Exceed API rate limits through unauthorized automation or denial-of-service attempts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Linkwise and its operators shall not be liable for any indirect,
              incidental, consequential, or punitive damages resulting from your use of the Service or content modifications in WordPress.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text mb-3">7. Contact Information</h2>
            <p>
              If you have any questions regarding these Terms, please reach out to:{" "}
              <a href="mailto:audigitalworks@gmail.com" className="text-primary hover:underline font-medium">
                audigitalworks@gmail.com
              </a>{" "}
              or visit our <Link href="/contact" className="text-primary hover:underline font-medium">Support Page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

