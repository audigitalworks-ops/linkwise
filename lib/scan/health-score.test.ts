import { describe, it, expect } from "vitest";
import { calculateHealthScore, countDuplicateAnchors } from "./health-score";

describe("calculateHealthScore", () => {
  it("calculates perfect health score when all metrics are optimal", () => {
    const result = calculateHealthScore({
      totalPages: 100,
      orphanPages: 0,
      pagesWithin3Clicks: 100,
      totalInternalLinks: 500,
      duplicateAnchorLinks: 0,
      brokenLinks: 0,
    });

    expect(result.orphanScore).toBe(100);
    expect(result.depthScore).toBe(100);
    expect(result.anchorScore).toBe(100);
    expect(result.brokenScore).toBe(100);
    expect(result.healthScore).toBe(100);
  });

  it("calculates correct health score for typical site (Greenleaf mock sample)", () => {
    // 312 pages, 18 orphans -> orphanScore = round(100 * (1 - 18/312)) = 94
    // 256 within 3 clicks -> depthScore = round(100 * (256/312)) = 82
    // 840 links, 202 duplicates -> anchorScore = round(100 * (638/840)) = 76
    // 840 links, 134 broken -> brokenScore = round(100 * (1 - 134/840)) = 84
    // score = 0.30*94 (28.2) + 0.25*82 (20.5) + 0.20*76 (15.2) + 0.25*84 (21) = 84.9 -> 85
    const result = calculateHealthScore({
      totalPages: 312,
      orphanPages: 18,
      pagesWithin3Clicks: 256,
      totalInternalLinks: 840,
      duplicateAnchorLinks: 202,
      brokenLinks: 134,
    });

    expect(result.orphanScore).toBe(94);
    expect(result.depthScore).toBe(82);
    expect(result.anchorScore).toBe(76);
    expect(result.brokenScore).toBe(84);
    expect(result.healthScore).toBe(85);
  });

  it("handles empty site (zero pages and zero links) without dividing by zero", () => {
    const result = calculateHealthScore({
      totalPages: 0,
      orphanPages: 0,
      pagesWithin3Clicks: 0,
      totalInternalLinks: 0,
      duplicateAnchorLinks: 0,
      brokenLinks: 0,
    });

    expect(result.orphanScore).toBe(100);
    expect(result.depthScore).toBe(100);
    expect(result.anchorScore).toBe(100);
    expect(result.brokenScore).toBe(100);
    expect(result.healthScore).toBe(100);
  });

  it("handles completely broken site gracefully", () => {
    const result = calculateHealthScore({
      totalPages: 100,
      orphanPages: 100,
      pagesWithin3Clicks: 0,
      totalInternalLinks: 50,
      duplicateAnchorLinks: 50,
      brokenLinks: 50,
    });

    expect(result.orphanScore).toBe(0);
    expect(result.depthScore).toBe(0);
    expect(result.anchorScore).toBe(0);
    expect(result.brokenScore).toBe(0);
    expect(result.healthScore).toBe(0);
  });

  it("clamps subscores and health scores within [0, 100] even if inputs exceed boundaries", () => {
    const result = calculateHealthScore({
      totalPages: 100,
      orphanPages: 150, // exceeds totalPages
      pagesWithin3Clicks: 200, // exceeds totalPages
      totalInternalLinks: 50,
      duplicateAnchorLinks: 80, // exceeds totalInternalLinks
      brokenLinks: 90, // exceeds totalInternalLinks
    });

    expect(result.orphanScore).toBe(0);
    expect(result.depthScore).toBe(100);
    expect(result.anchorScore).toBe(0);
    expect(result.brokenScore).toBe(0);
    expect(result.healthScore).toBe(25); // 0.25 * 100 = 25
  });
});

describe("countDuplicateAnchors", () => {
  it("returns 0 when all anchors pointing to a target are distinct", () => {
    const links = [
      { targetIdOrUrl: "/gardening-tips", anchorText: "organic gardening tips" },
      { targetIdOrUrl: "/gardening-tips", anchorText: "read our garden advice" },
      { targetIdOrUrl: "/pruning-guide", anchorText: "how to prune roses" },
    ];

    expect(countDuplicateAnchors(links)).toBe(0);
  });

  it("correctly identifies duplicate anchor texts for the same target", () => {
    const links = [
      { targetIdOrUrl: "/gardening-tips", anchorText: "gardening tips" },
      { targetIdOrUrl: "/gardening-tips", anchorText: "Gardening Tips" }, // Case-insensitive duplicate
      { targetIdOrUrl: "/gardening-tips", anchorText: "gardening tips " }, // Whitespace-trimmed duplicate
      { targetIdOrUrl: "/pruning-guide", anchorText: "gardening tips" }, // Different target, not a duplicate for this target
    ];

    // 2 duplicates for /gardening-tips
    expect(countDuplicateAnchors(links)).toBe(2);
  });
});

