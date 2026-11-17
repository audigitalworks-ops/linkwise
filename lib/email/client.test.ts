import { describe, it, expect } from "vitest";
import {
  renderWeeklyReportHtml,
  sendWeeklyReportEmail,
  WeeklyReportEmailData,
} from "./client";

describe("Weekly Report Email", () => {
  const sampleData: WeeklyReportEmailData = {
    recipientEmail: "sarah@greenleaf.com",
    recipientName: "Sarah Miller",
    siteName: "GreenLeaf Gardening",
    siteUrl: "https://greenleafgardening.com",
    healthScore: 78,
    pagesScanned: 312,
    orphanCount: 14,
    brokenCount: 6,
    suggestionsReady: 42,
    linksApplied: 8,
  };

  it("renders a complete HTML email with proper branding, metrics, and links", () => {
    const html = renderWeeklyReportHtml(sampleData);

    // Branding & Header
    expect(html).toContain("Linkwise");
    expect(html).toContain("Weekly Health Summary for GreenLeaf Gardening");
    expect(html).toContain("https://greenleafgardening.com");

    // Health Score & Rating
    expect(html).toContain("78");
    expect(html).toContain("Needs Attention");

    // Metrics Breakdown
    expect(html).toContain("Opportunities Ready");
    expect(html).toContain("42");
    expect(html).toContain("Links Applied This Week");
    expect(html).toContain("8");
    expect(html).toContain("Orphan Pages");
    expect(html).toContain("14");
    expect(html).toContain("Broken Links");
    expect(html).toContain("6");

    // CTAs & Links
    expect(html).toContain("/app/suggestions");
    expect(html).toContain("/app/report");
    expect(html).toContain("/app/settings");
  });

  it("assigns Good rating when score is 80+", () => {
    const html = renderWeeklyReportHtml({
      ...sampleData,
      healthScore: 92,
    });
    expect(html).toContain("Good");
  });

  it("assigns Poor rating when score is below 60", () => {
    const html = renderWeeklyReportHtml({
      ...sampleData,
      healthScore: 48,
    });
    expect(html).toContain("Poor");
  });

  it("simulates email delivery gracefully in development / demo mode", async () => {
    const result = await sendWeeklyReportEmail(sampleData);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });
});

