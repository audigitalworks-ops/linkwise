import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Calendar, Sparkles } from "lucide-react";

export const metadata = {
  title: "Linkwise SEO Blog — Internal Linking & WordPress Growth Guides",
  description: "Learn how to optimize internal link equity, eliminate orphan pages, and boost Google organic rankings.",
};

const posts = [
  {
    slug: "how-to-fix-orphan-pages-wordpress",
    category: "WordPress SEO",
    readTime: "6 min read",
    date: "Nov 17, 2026",
    title: "How to Find and Fix Orphan Pages in WordPress (Complete 2026 Guide)",
    excerpt:
      "Orphan pages are published posts with zero inbound internal links. Discover why Google ignores them, how to map your link graph, and how to fix them automatically.",
  },
  {
    slug: "internal-linking-seo-best-practices",
    category: "Link Building",
    readTime: "8 min read",
    date: "Nov 15, 2026",
    title: "Internal Linking for SEO: The Definitive Guide to PageRank Distribution",
    excerpt:
      "Most content teams treat internal links as an afterthought. Learn how topical cluster linking and anchor diversity can double your search visibility without new backlinks.",
  },
  {
    slug: "why-cloud-saas-beats-wordpress-linking-plugins",
    category: "Performance",
    readTime: "5 min read",
    date: "Nov 12, 2026",
    title: "Why Cloud SaaS Beats Heavy PHP Internal Linking Plugins",
    excerpt:
      "Running heavy MySQL text searches directly on your WordPress server slows down TTFB and risks database corruption. Here is how REST API automation solves the problem.",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="py-16 md:py-24 bg-bg text-text">
      <div className="max-w-[960px] mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-[700px] mb-12">
          <span className="inline-block text-[12px] font-semibold tracking-wider uppercase text-primary mb-3">
            Knowledge Hub
          </span>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-text mb-4">
            The Linkwise SEO Blog
          </h1>
          <p className="text-[17px] text-muted leading-relaxed">
            Actionable guides, data studies, and architectural best practices on WordPress SEO, internal link equity, and website architecture.
          </p>
        </div>

        {/* Featured Post Card */}
        <div className="p-8 rounded-2xl bg-surface border border-border mb-12 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3 text-[12px] text-muted mb-3">
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
              Featured Article
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {posts[0].date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {posts[0].readTime}
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-text mb-3 hover:text-primary transition-colors">
            {posts[0].title}
          </h2>

          <p className="text-[15px] text-muted leading-relaxed mb-6">
            {posts[0].excerpt}
          </p>

          <div className="text-[14px] font-semibold text-primary inline-flex items-center gap-1.5">
            <span>Read full guide</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.slice(1).map((post, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-surface border border-border flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 text-[12px] text-muted mb-3">
                  <span className="font-semibold text-primary">{post.category}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="text-lg font-semibold text-text mb-2.5 leading-snug">
                  {post.title}
                </h3>

                <p className="text-[14px] text-muted leading-relaxed mb-4">
                  {post.excerpt}
                </p>
              </div>

              <div className="text-[13px] font-semibold text-primary inline-flex items-center gap-1">
                <span>Read article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 p-8 rounded-xl bg-surface border border-border text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">
            Want to see how your own WordPress site scores?
          </h3>
          <p className="text-[15px] text-muted max-w-[500px] mb-6">
            Scan up to 20 pages for free, uncover orphan pages, and see AI link suggestions in under 30 seconds.
          </p>
          <Link href="/signup">
            <button className="h-10 px-6 bg-primary text-white hover:bg-primary-hover font-medium text-[14px] rounded-[6px] transition-colors">
              Scan Your Site Free
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

