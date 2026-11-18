import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkwise-app.vercel.app";
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const viewport: Viewport = {
  themeColor: "#1F6F54",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Linkwise — WordPress Internal Linking Automation SaaS",
    template: "%s | Linkwise",
  },
  description:
    "Automate WordPress internal linking with AI. Scan your blog posts, discover high-relevance internal links with exact anchor text, eliminate orphan pages, repair broken 404 links, and track link equity health.",
  keywords: [
    "wordpress internal linking",
    "internal links saas",
    "wordpress seo automation",
    "orphan page finder",
    "broken link checker wordpress",
    "anchor text diversity",
    "pagerank optimization",
    "seo link building",
    "wordpress rest api seo",
    "automated weekly link report",
  ],
  authors: [{ name: "Linkwise Team", url: siteUrl }],
  creator: "Linkwise",
  publisher: "Linkwise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  verification: googleVerification
    ? {
        google: googleVerification,
      }
    : undefined,
  openGraph: {
    title: "Linkwise — WordPress Internal Linking Automation SaaS",
    description:
      "Fix internal links in minutes, not days. Linkwise crawls your WordPress posts, generates contextual internal links with exact anchor text using AI, and protects PageRank flow.",
    url: siteUrl,
    siteName: "Linkwise",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkwise — WordPress Internal Linking Automation SaaS",
    description:
      "AI-driven internal link automation for WordPress. Boost crawl depth, fix orphan articles, and repair broken links.",
    creator: "@linkwise_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "Linkwise",
      description:
        "WordPress internal link automation and link-health monitoring software. Finds orphan pages, fixes broken links, and suggests high-relevance contextual anchor links.",
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web-based",
      offers: {
        "@type": "Offer",
        price: "9.00",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "148",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Linkwise",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: [
        "https://twitter.com/linkwise_app",
        "https://github.com/linkwise",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Linkwise",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-text antialiased selection:bg-primary-tint selection:text-primary">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
