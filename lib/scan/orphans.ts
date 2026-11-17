import { SupabaseClient } from "@supabase/supabase-js";

export interface CandidateSourcePage {
  id: string;
  title: string;
  url: string;
  path: string;
  wordCount: number;
  outboundCount: number;
  relevanceScore: number;
}

/**
 * Updates inbound_count, outbound_count, depth, and is_orphan for all pages of a site.
 * Also runs breadth-first search from home page ("/" or lowest depth page) to assign click depth.
 */
export async function updateSiteGraphMetrics(
  supabase: SupabaseClient,
  siteId: string
): Promise<{ orphanCount: number; pagesWithin3Clicks: number; totalPages: number }> {
  // 1. Fetch all pages for this site
  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("id, path, url, inbound_count, outbound_count, depth, is_orphan")
    .eq("site_id", siteId);

  if (pagesError || !pages || pages.length === 0) {
    return { orphanCount: 0, pagesWithin3Clicks: 0, totalPages: 0 };
  }

  // 2. Fetch all internal links for this site
  const { data: links, error: linksError } = await supabase
    .from("page_links")
    .select("id, source_page_id, target_page_id, target_url")
    .eq("site_id", siteId)
    .eq("is_internal", true);

  if (linksError) {
    throw linksError;
  }

  // Maps for quick lookup
  const pageMap = new Map<string, { id: string; path: string; url: string }>();
  const pathToPageId = new Map<string, string>();
  for (const page of pages) {
    pageMap.set(page.id, page);
    const normalized = page.path.endsWith("/") ? page.path : `${page.path}/`;
    pathToPageId.set(normalized, page.id);
  }

  // Match target_page_id on page_links if null
  const inboundCountMap = new Map<string, number>();
  const outboundCountMap = new Map<string, number>();
  const adjacencyList = new Map<string, Set<string>>();

  for (const page of pages) {
    inboundCountMap.set(page.id, 0);
    outboundCountMap.set(page.id, 0);
    adjacencyList.set(page.id, new Set());
  }

  for (const link of links || []) {
    let targetId = link.target_page_id;
    if (!targetId && link.target_url) {
      try {
        const parsed = new URL(link.target_url);
        const norm = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
        targetId = pathToPageId.get(norm) || null;
      } catch {
        const norm = link.target_url.endsWith("/") ? link.target_url : `${link.target_url}/`;
        targetId = pathToPageId.get(norm) || null;
      }
    }

    if (link.source_page_id) {
      outboundCountMap.set(link.source_page_id, (outboundCountMap.get(link.source_page_id) || 0) + 1);
    }

    if (targetId && inboundCountMap.has(targetId)) {
      inboundCountMap.set(targetId, (inboundCountMap.get(targetId) || 0) + 1);
      if (link.source_page_id && link.source_page_id !== targetId) {
        adjacencyList.get(link.source_page_id)?.add(targetId);
      }
    }
  }

  // 3. BFS for click depth from home page (depth starts at 0 for home page '/')
  const homePage = pages.find((p) => p.path === "/" || p.path === "");
  const depths = new Map<string, number>();

  if (homePage) {
    const queue: Array<{ id: string; depth: number }> = [{ id: homePage.id, depth: 0 }];
    depths.set(homePage.id, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacencyList.get(current.id);
      if (neighbors) {
        for (const neighborId of neighbors) {
          if (!depths.has(neighborId)) {
            depths.set(neighborId, current.depth + 1);
            queue.push({ id: neighborId, depth: current.depth + 1 });
          }
        }
      }
    }
  }

  let orphanCount = 0;
  let pagesWithin3Clicks = 0;

  // 4. Batch update pages in parallel with dirty checking
  const updatePromises = pages.map((page) => {
    const isHome = homePage ? page.id === homePage.id : false;
    const inbound = inboundCountMap.get(page.id) || 0;
    const outbound = outboundCountMap.get(page.id) || 0;
    const depth = depths.has(page.id) ? depths.get(page.id)! : 1;
    const isOrphan = !isHome && inbound === 0;

    if (isOrphan) orphanCount++;
    if (depth <= 3) pagesWithin3Clicks++;

    // Only update database if values actually changed
    if (
      page.inbound_count === inbound &&
      page.outbound_count === outbound &&
      page.depth === depth &&
      page.is_orphan === isOrphan
    ) {
      return Promise.resolve();
    }

    return supabase
      .from("pages")
      .update({
        inbound_count: inbound,
        outbound_count: outbound,
        depth,
        is_orphan: isOrphan,
      })
      .eq("id", page.id);
  });

  await Promise.all(updatePromises);

  return {
    orphanCount,
    pagesWithin3Clicks,
    totalPages: pages.length,
  };
}

/**
 * Finds the 3 best candidate source pages to link to an orphan page.
 */
export async function findLinkCandidatesForOrphan(
  supabase: SupabaseClient,
  siteId: string,
  orphanPageId: string
): Promise<CandidateSourcePage[]> {
  // Fetch target orphan page
  const { data: orphanPage } = await supabase
    .from("pages")
    .select("id, title, excerpt, path")
    .eq("id", orphanPageId)
    .single();

  if (!orphanPage) return [];

  // Extract key words from title (strip short words)
  const queryTerms = orphanPage.title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w: string) => w.length > 3)
    .join(" | ");

  interface CandidatePageRow {
    id: string;
    title: string;
    url: string;
    path: string;
    word_count: number | null;
    outbound_count: number | null;
  }

  let candidates: CandidatePageRow[] = [];

  // 1. Try full-text search against title and content_text
  if (queryTerms) {
    const { data } = await supabase
      .from("pages")
      .select("id, title, url, path, word_count, outbound_count")
      .eq("site_id", siteId)
      .neq("id", orphanPageId)
      .textSearch("search_vector", queryTerms, { type: "websearch" })
      .order("word_count", { ascending: false })
      .limit(5);

    candidates = data || [];
  }

  // 2. Fallback: if search returns fewer than 3, grab highest word count non-orphan pages
  if (candidates.length < 3) {
    const candidateIds = new Set(candidates.map((c) => c.id));
    candidateIds.add(orphanPageId);

    const { data: topPages } = await supabase
      .from("pages")
      .select("id, title, url, path, word_count, outbound_count")
      .eq("site_id", siteId)
      .eq("is_orphan", false)
      .order("word_count", { ascending: false })
      .limit(5);

    if (topPages) {
      for (const p of topPages) {
        if (!candidateIds.has(p.id)) {
          candidates.push(p);
          candidateIds.add(p.id);
          if (candidates.length >= 3) break;
        }
      }
    }
  }

  return candidates.slice(0, 3).map((page, idx) => ({
    id: page.id,
    title: page.title,
    url: page.url,
    path: page.path,
    wordCount: page.word_count || 0,
    outboundCount: page.outbound_count || 0,
    relevanceScore: Math.round((0.92 - idx * 0.05) * 100) / 100,
  }));
}
