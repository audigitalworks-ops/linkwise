import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkwise.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/signup"],
        disallow: [
          "/app/",
          "/api/",
          "/auth/",
          "/onboarding/",
          "/_next/",
          "/static/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

