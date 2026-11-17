import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { WordPressClient } from "@/lib/wordpress/client";
import { parseWordPressHtml } from "@/lib/wordpress/parse-links";
import { updateSiteGraphMetrics } from "./orphans";
import { checkLinksBatch } from "./broken-links";
import { calculateHealthScore, countDuplicateAnchors } from "./health-score";
import { findCandidatesForPage, scoreCandidatesWithGroq } from "@/lib/ai/suggest-links";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

export interface ScanStepResult {
  scanId: string;
  status: "queued" | "running" | "done" | "failed";
  step: "fetching" | "indexing" | "finding";
  processedPages: number;
  totalPages: number;
  error?: string;
}

/**
 * Gets the current week's Monday as YYYY-MM-DD for report_snapshots.
 */
function getWeekStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

/**
 * Advances a chunked scan step by step.
 */
export async function stepScan(scanId: string): Promise<ScanStepResult> {
  const supabase = createAdminClient();

  // 1. Fetch scan record
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("id, site_id, status, step, total_pages, processed_pages")
    .eq("id", scanId)
    .single();

  if (scanError || !scan) {
    throw new Error(`Scan not found: ${scanId}`);
  }

  if (scan.status === "done" || scan.status === "failed") {
    return {
      scanId: scan.id,
      status: scan.status,
      step: scan.step,
      processedPages: scan.processed_pages || 0,
      totalPages: scan.total_pages || 0,
    };
  }

  // 2. Fetch site and decrypted credentials
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, user_id, url, wp_username, wp_password_encrypted")
    .eq("id", scan.site_id)
    .single();

  if (siteError || !site) {
    await supabase.from("scans").update({ status: "failed", error_message: "Site not found" }).eq("id", scanId);
    throw new Error("Site not found");
  }

  // Fetch user subscription for plan limits
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", site.user_id)
    .single();
  const planLimits = PLAN_LIMITS[(sub?.plan as PlanType) || "free"];

  let wpPassword = "";
  try {
    wpPassword = decrypt(site.wp_password_encrypted);
  } catch {
    await supabase.from("scans").update({ status: "failed", error_message: "Failed to decrypt WP password" }).eq("id", scanId);
    throw new Error("Failed to decrypt credentials");
  }

  const wpClient = new WordPressClient({
    url: site.url,
    username: site.wp_username,
    appPasswordDecrypted: wpPassword,
  });

  // STEP 1: Initialization / Queued
  if (scan.status === "queued") {
    try {
      // Test and get initial count
      const test = await wpClient.testConnection();
      const realCount = Math.max(test.pagesFound, 1);
      const cappedTotal = Math.min(realCount, planLimits.pagesPerSiteLimit);

      await supabase
        .from("scans")
        .update({
          status: "running",
          step: "fetching",
          started_at: new Date().toISOString(),
          total_pages: cappedTotal,
          processed_pages: 0,
        })
        .eq("id", scanId);

      return {
        scanId,
        status: "running",
        step: "fetching",
        processedPages: 0,
        totalPages: cappedTotal,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to WordPress";
      await supabase
        .from("scans")
        .update({ status: "failed", error_message: message })
        .eq("id", scanId);
      throw err;
    }
  }

  // STEP 2: Fetching pages & posts content (chunks of 20)
  if (scan.step === "fetching") {
    const BATCH_SIZE = 20;
    const offset = scan.processed_pages || 0;
    const pageNumber = Math.floor(offset / BATCH_SIZE) + 1;

    try {
      // Fetch posts and pages
      const [posts, pages] = await Promise.all([
        wpClient.getPosts(pageNumber, BATCH_SIZE).catch(() => []),
        wpClient.getPages(pageNumber, BATCH_SIZE).catch(() => []),
      ]);

      const items = [
        ...posts.map((p) => ({ ...p, type: "post" as const })),
        ...pages.map((p) => ({ ...p, type: "page" as const })),
      ].slice(0, BATCH_SIZE);

      for (const item of items) {
        const parsed = parseWordPressHtml(item.content?.rendered || "", site.url);
        const url = item.link || `${site.url}/${item.slug}/`;
        let path = "/";
        try {
          path = new URL(url).pathname;
        } catch {
          path = `/${item.slug}/`;
        }

        // Upsert page
        const { data: pageRow, error: pageErr } = await supabase
          .from("pages")
          .upsert(
            {
              site_id: site.id,
              wp_id: item.id,
              wp_type: item.type,
              url,
              path,
              title: item.title?.rendered || item.slug || "Untitled",
              excerpt: item.excerpt?.rendered?.replace(/<[^>]+>/g, "").slice(0, 300) || "",
              content_text: parsed.plainText,
              word_count: parsed.wordCount,
            },
            { onConflict: "site_id,wp_id,wp_type" }
          )
          .select("id")
          .single();

        if (pageErr) {
          console.error("Page upsert error:", pageErr);
          continue;
        }

        // Insert extracted page links (delete previous links for this page first to avoid duplicates)
        if (pageRow?.id) {
          await supabase.from("page_links").delete().eq("source_page_id", pageRow.id);
          if (parsed.links.length > 0) {
            const linksToInsert = parsed.links.map((link) => ({
              site_id: site.id,
              source_page_id: pageRow.id,
              target_url: link.targetUrl,
              anchor_text: link.anchorText || "",
              is_internal: link.isInternal,
            }));

            await supabase.from("page_links").insert(linksToInsert);
          }
        }
      }

      const newProcessed = offset + items.length;
      const total = scan.total_pages || newProcessed;
      const isFetchDone = items.length === 0 || newProcessed >= total;

      await supabase
        .from("scans")
        .update({
          processed_pages: Math.min(newProcessed, total),
          step: isFetchDone ? "indexing" : "fetching",
        })
        .eq("id", scanId);

      return {
        scanId,
        status: "running",
        step: isFetchDone ? "indexing" : "fetching",
        processedPages: Math.min(newProcessed, total),
        totalPages: total,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed fetching posts";
      await supabase
        .from("scans")
        .update({ status: "failed", error_message: message })
        .eq("id", scanId);
      throw err;
    }
  }

  // STEP 3: Indexing (inbound/outbound graph, BFS depth, orphans)
  if (scan.step === "indexing") {
    try {
      await updateSiteGraphMetrics(supabase, site.id);

      await supabase
        .from("scans")
        .update({ step: "finding" })
        .eq("id", scanId);

      return {
        scanId,
        status: "running",
        step: "finding",
        processedPages: scan.processed_pages,
        totalPages: scan.total_pages,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Graph indexing failed";
      await supabase
        .from("scans")
        .update({ status: "failed", error_message: message })
        .eq("id", scanId);
      throw err;
    }
  }

  // STEP 4: Finding (Broken link checks, health score & snapshot creation)
  if (scan.step === "finding") {
    try {
      // 1. Broken link check batch
      await checkLinksBatch(supabase, site.id, 50);

      // 2. Fetch aggregate metrics for health score
      const { count: totalPagesCount } = await supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id);

      const { count: orphanCount } = await supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("is_orphan", true);

      const { count: within3ClicksCount } = await supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .lte("depth", 3);

      const { data: internalLinks } = await supabase
        .from("page_links")
        .select("id, target_url, anchor_text")
        .eq("site_id", site.id)
        .eq("is_internal", true);

      const { count: totalBrokenCount } = await supabase
        .from("page_links")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("is_broken", true);

      const totalInternal = internalLinks?.length || 0;
      const brokenCount = totalBrokenCount || 0;
      const duplicateAnchors = countDuplicateAnchors(
        (internalLinks || []).map((l) => ({ targetIdOrUrl: l.target_url, anchorText: l.anchor_text }))
      );

      // 3. Generate candidate suggestions for pages
      const { data: sourcePages } = await supabase
        .from("pages")
        .select("id, title, content_text")
        .eq("site_id", site.id)
        .gt("word_count", 50)
        .limit(10);

      if (sourcePages && sourcePages.length > 0) {
        for (const sp of sourcePages) {
          try {
            const paragraphs = (sp.content_text || "")
              .split(/\n+/)
              .filter((p: string) => p.trim().length > 60);
            const samplePara = paragraphs[0] || (sp.content_text || "").slice(0, 300);
            const candidates = await findCandidatesForPage(supabase, site.id, sp.id, sp.title);
            if (candidates.length > 0) {
              const scored = await scoreCandidatesWithGroq(samplePara, candidates, 0.75);
              for (const s of scored) {
                await supabase.from("suggestions").upsert(
                  {
                    site_id: site.id,
                    source_page_id: sp.id,
                    target_page_id: s.target_page_id,
                    anchor_text: s.anchor_text,
                    source_paragraph: samplePara,
                    relevance: s.relevance,
                    status: "pending",
                  },
                  { onConflict: "source_page_id,target_page_id,anchor_text" }
                );
              }
            }
          } catch {
            // Non-blocking suggestion generation
          }
        }
      }

      // 4. Count pending suggestions and applied links
      const { count: pendingSuggestionsCount } = await supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("status", "pending");

      const { count: appliedLinksCount } = await supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("status", "applied");

      // 5. Compute score
      const health = calculateHealthScore({
        totalPages: totalPagesCount || 0,
        orphanPages: orphanCount || 0,
        pagesWithin3Clicks: within3ClicksCount || 0,
        totalInternalLinks: totalInternal,
        duplicateAnchorLinks: duplicateAnchors,
        brokenLinks: brokenCount,
      });

      // 6. Save report_snapshots
      const weekStart = getWeekStartDate();
      await supabase.from("report_snapshots").upsert(
        {
          site_id: site.id,
          week_start: weekStart,
          health_score: health.healthScore,
          pages_scanned: totalPagesCount || 0,
          orphan_count: orphanCount || 0,
          broken_count: brokenCount,
          suggestions_ready: pendingSuggestionsCount || 0,
          links_applied: appliedLinksCount || 0,
          orphan_score: health.orphanScore,
          depth_score: health.depthScore,
          anchor_score: health.anchorScore,
          broken_score: health.brokenScore,
        },
        { onConflict: "site_id,week_start" }
      );

      // 5. Update site and scan
      const now = new Date().toISOString();
      await supabase.from("sites").update({ last_scanned_at: now }).eq("id", site.id);
      await supabase
        .from("scans")
        .update({
          status: "done",
          finished_at: now,
        })
        .eq("id", scanId);

      return {
        scanId,
        status: "done",
        step: "finding",
        processedPages: scan.total_pages,
        totalPages: scan.total_pages,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Final health score failed";
      await supabase
        .from("scans")
        .update({ status: "failed", error_message: message })
        .eq("id", scanId);
      throw err;
    }
  }

  return {
    scanId,
    status: scan.status,
    step: scan.step,
    processedPages: scan.processed_pages,
    totalPages: scan.total_pages,
  };
}
