import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog-data";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | Linkwise Blog",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkwise-app.vercel.app";

  return {
    title: `${post.title} | Linkwise Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `${appUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== slug);

  return (
    <article className="py-12 md:py-20 bg-bg text-text">
      <div className="max-w-[780px] mx-auto px-4 md:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all guides</span>
          </Link>
        </div>

        {/* Article Meta Header */}
        <header className="mb-10 pb-8 border-b border-border">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted mb-4">
            <span className="px-3 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
              {post.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {post.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-text leading-[1.18] mb-6">
            {post.title}
          </h1>

          <p className="text-[18px] text-muted leading-relaxed font-normal">
            {post.excerpt}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3.5 mt-8 pt-6 border-t border-border">
            <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-[14px]">
              LW
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text">{post.author.name}</div>
              <div className="text-[12px] text-muted">{post.author.role}</div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="space-y-10 text-[16px] leading-[1.8] text-text">
          {/* Intro Paragraphs */}
          <div className="space-y-4 text-muted text-[17px] leading-relaxed">
            {post.content.intro.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Content Sections */}
          {post.content.sections.map((section, idx) => (
            <section key={idx} className="space-y-5 pt-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-text tracking-tight">
                {section.heading}
              </h2>

              <div className="space-y-4 text-muted">
                {section.body.map((p, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Callout Box */}
              {section.callout && (
                <div
                  className={`p-5 rounded-xl border flex items-start gap-3.5 my-6 ${
                    section.callout.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-200"
                      : section.callout.type === "tip"
                      ? "bg-primary/5 border-primary/20 text-text"
                      : "bg-surface border-border text-muted"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {section.callout.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : section.callout.type === "tip" ? (
                      <Lightbulb className="w-5 h-5 text-primary" />
                    ) : (
                      <Info className="w-5 h-5 text-muted" />
                    )}
                  </div>
                  <div className="text-[14px] leading-relaxed font-medium">
                    {section.callout.text}
                  </div>
                </div>
              )}
            </section>
          ))}

          {/* Conclusion */}
          <div className="p-6 rounded-xl bg-surface border border-border space-y-3 mt-10">
            <h3 className="text-lg font-semibold text-text">Key Takeaway</h3>
            <p className="text-[15px] text-muted leading-relaxed">
              {post.content.conclusion}
            </p>
          </div>
        </div>

        {/* In-Article Call to Action */}
        <div className="my-16 p-8 rounded-2xl bg-primary text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-white/80">
              Put this into practice
            </span>
            <h3 className="text-2xl font-semibold tracking-tight">
              Audit your WordPress site for free
            </h3>
            <p className="text-white/80 text-[14px] max-w-[440px]">
              Scan your first 20 pages, identify your orphan pages, and see contextual AI link suggestions in 30 seconds.
            </p>
          </div>
          <Link href="/signup">
            <Button className="h-11 px-6 bg-white text-primary hover:bg-white/90 font-medium text-[14px] rounded-[6px] shadow-sm flex items-center gap-2">
              <span>Start Free Scan</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Read Next Section */}
        <div className="pt-10 border-t border-border">
          <h3 className="text-xl font-semibold text-text mb-6">Read Next</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((related, rIdx) => (
              <Link
                key={rIdx}
                href={`/blog/${related.slug}`}
                className="p-5 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-[12px] text-muted mb-2">
                    <span className="font-semibold text-primary">{related.category}</span>
                    <span>•</span>
                    <span>{related.readTime}</span>
                  </div>
                  <h4 className="text-[16px] font-semibold text-text group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {related.title}
                  </h4>
                  <p className="text-[13px] text-muted line-clamp-2">
                    {related.excerpt}
                  </p>
                </div>
                <div className="mt-4 text-[13px] font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Read guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
