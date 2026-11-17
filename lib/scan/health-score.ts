export interface HealthScoreInput {
  totalPages: number;
  orphanPages: number;
  pagesWithin3Clicks: number;
  totalInternalLinks: number;
  duplicateAnchorLinks: number;
  brokenLinks: number;
}

export interface HealthScoreResult {
  healthScore: number;
  orphanScore: number;
  depthScore: number;
  anchorScore: number;
  brokenScore: number;
}

/**
 * Calculates SEO link health score (0-100) based on PRD formula:
 * score = 0.30*orphanScore + 0.25*depthScore + 0.20*anchorScore + 0.25*brokenScore
 * 
 * - orphanScore = 100 * (1 - orphanPages / totalPages)
 * - depthScore = % of pages reachable within 3 clicks from the home page
 * - anchorScore = % of internal links whose anchor text is not a duplicate of another anchor pointing to the same target
 * - brokenScore = 100 * (1 - brokenLinks / totalInternalLinks)
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const {
    totalPages,
    orphanPages,
    pagesWithin3Clicks,
    totalInternalLinks,
    duplicateAnchorLinks,
    brokenLinks,
  } = input;

  // 1. Orphan score (weight: 30%)
  let orphanScore = 100;
  if (totalPages > 0) {
    const safeOrphans = Math.min(orphanPages, totalPages);
    orphanScore = Math.max(0, Math.min(100, Math.round(100 * (1 - safeOrphans / totalPages))));
  }

  // 2. Depth score (weight: 25%)
  let depthScore = 100;
  if (totalPages > 0) {
    const safeReachable = Math.min(pagesWithin3Clicks, totalPages);
    depthScore = Math.max(0, Math.min(100, Math.round(100 * (safeReachable / totalPages))));
  }

  // 3. Anchor score (weight: 20%)
  // % of internal links whose anchor text is not a duplicate of another anchor pointing to the same target
  let anchorScore = 100;
  if (totalInternalLinks > 0) {
    const safeDuplicates = Math.min(duplicateAnchorLinks, totalInternalLinks);
    const uniqueAnchors = totalInternalLinks - safeDuplicates;
    anchorScore = Math.max(0, Math.min(100, Math.round(100 * (uniqueAnchors / totalInternalLinks))));
  }

  // 4. Broken score (weight: 25%)
  let brokenScore = 100;
  if (totalInternalLinks > 0) {
    const safeBroken = Math.min(brokenLinks, totalInternalLinks);
    brokenScore = Math.max(0, Math.min(100, Math.round(100 * (1 - safeBroken / totalInternalLinks))));
  }

  // Composite health score
  const rawScore = 0.30 * orphanScore + 0.25 * depthScore + 0.20 * anchorScore + 0.25 * brokenScore;
  const healthScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    healthScore,
    orphanScore,
    depthScore,
    anchorScore,
    brokenScore,
  };
}

/**
 * Calculates duplicate anchor links from a list of internal links.
 * For each target, if the same normalized anchor appears more than once,
 * the additional occurrences are counted as duplicates.
 */
export function countDuplicateAnchors(
  links: Array<{ targetIdOrUrl: string; anchorText: string }>
): number {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const link of links) {
    const target = link.targetIdOrUrl.trim().toLowerCase();
    const anchor = link.anchorText.trim().toLowerCase();
    
    // Ignore empty anchors
    if (!anchor) continue;

    const key = `${target}:::${anchor}`;
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

