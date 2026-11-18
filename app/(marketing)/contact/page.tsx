"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to send message. Please try again.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 md:py-24 bg-bg">
      <div className="max-w-[1120px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-[680px] mb-12">
          <span className="inline-block text-[12px] font-semibold tracking-wider uppercase text-primary mb-3">
            Get in touch
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text mb-4">
            Contact Linkwise Support
          </h1>
          <p className="text-[16px] text-muted leading-relaxed">
            Have questions about WordPress integration, custom SEO rules, or team plans?
            Send us a message and our engineering team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-surface p-8 rounded-xl border border-border shadow-sm">
            {status === "success" ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">Message Received!</h3>
                <p className="text-muted text-[15px] max-w-[420px] mb-6">
                  Thank you for reaching out. We have sent a copy to our support inbox and will reply directly to your email shortly.
                </p>
                <Button
                  onClick={() => setStatus("idle")}
                  variant="outline"
                  className="rounded-[6px]"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === "error" && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[14px] flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-text mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-10 px-3 text-[14px] rounded-[6px] border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-text mb-1.5">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-10 px-3 text-[14px] rounded-[6px] border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-text mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Question about WordPress multisite or agency license"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-10 px-3 text-[14px] rounded-[6px] border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-text mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe how we can help you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 text-[14px] rounded-[6px] border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary text-white hover:bg-primary-hover font-medium text-[14px] rounded-[6px] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Sending message...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Direct Contact Info & SLA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface p-6 rounded-xl border border-border space-y-6">
              <h3 className="text-[17px] font-semibold text-text">Direct Contact</h3>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] text-muted">Support Email</div>
                  <a
                    href="mailto:audigitalworks@gmail.com"
                    className="text-[14px] font-medium text-text hover:text-primary transition-colors"
                  >
                    audigitalworks@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] text-muted">Response Time</div>
                  <div className="text-[14px] font-medium text-text">
                    Within 24 hours (Mon – Fri)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] text-muted">Security Inquiries</div>
                  <div className="text-[14px] font-medium text-text">
                    Responsible disclosure & data protection
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-border">
              <h3 className="text-[16px] font-semibold text-text mb-3">Looking for quick answers?</h3>
              <p className="text-[14px] text-muted mb-4 leading-relaxed">
                Check our setup tutorials and documentation for step-by-step guides on WordPress Application Passwords and linking automation.
              </p>
              <div className="flex flex-col gap-2 text-[14px]">
                <Link href="/docs" className="text-primary hover:underline font-medium">
                  → How to connect WordPress in 30 seconds
                </Link>
                <Link href="/pricing" className="text-primary hover:underline font-medium">
                  → Compare Free, Pro, and Agency plans
                </Link>
                <Link href="/security" className="text-primary hover:underline font-medium">
                  → Read our AES-256 encryption architecture
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
