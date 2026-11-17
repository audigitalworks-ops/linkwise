import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";
import { sendWeeklyReportEmail } from "@/lib/email/client";
import { calculateHealthScore, countDuplicateAnchors } from "@/lib/scan/health-score";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify CRON_SECRET authorization header
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      if (process.env.NODE_ENV === "production") {
        return apiError("INTERNAL", "CRON_SECRET is not configured on server.", 500);
      }
    } else {
      const expectedToken = `Bearer ${cronSecret}`;
      if (authHeader !== expectedToken) {
        return apiError("UNAUTHENTICATED", "Unauthorized cron invocation.", 401);
      }
    }

    const admin = createAdminClient();

    // 2. Fetch all connected sites
    const { data: sites, error: sitesErr } = await admin
      .from("sites")
      .select("id, user_id, name, url, scan_frequency, connected")
      .eq("connected", true);

    if (sitesErr) {
      return apiError("INTERNAL", `Failed fetching sites: ${sitesErr.message}`, 500);
    }

    if (!sites || sites.length === 0) {
      return apiSuccess({
        message: "No connected sites found.",
        processedSites: 0,
        emailsSent: 0,
      });
    }

    // Compute current week start (Monday) in YYYY-MM-DD format
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - distanceToMonday);
    const weekStart = monday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let processedCount = 0;
    let emailsSentCount = 0;
    let skippedCount = 0;

    for (const site of sites) {
      // Check user's subscription plan
      const { data: sub } = await admin
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", site.user_id)
        .single();

      const userPlan = (sub?.plan as PlanType) || "free";
      const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

      // Only Pro and Agency plans receive automated weekly reports
      if (!limits.canUseEmailReport) {
        skippedCount++;
        continue;
      }

      // Fetch user email from profile
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", site.user_id)
        .single();

      if (!profile?.email) {
        skippedCount++;
        continue;
      }

      // Gather current site metrics
      const { count: pagesScanned } = await admin
        .from("pages")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id);

      const { count: orphanCount } = await admin
        .from("pages")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("is_orphan", true);

      const { count: brokenCount } = await admin
        .from("page_links")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("is_broken", true);

      const { count: suggestionsReady } = await admin
        .from("suggestions")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("status", "pending");

      const { count: linksAppliedWeek } = await admin
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("action", "link_applied")
        .gte("created_at", sevenDaysAgo);

      // Check pages for depth score (depth <= 3)
      const { data: pagesList } = await admin
        .from("pages")
        .select("depth")
        .eq("site_id", site.id);

      const pagesWithin3Clicks = (pagesList || []).filter(
        (p) => p.depth !== null && p.depth <= 3
      ).length;

      // Check links for anchor score
      const { data: linksList } = await admin
        .from("page_links")
        .select("anchor_text, target_page_id")
        .eq("site_id", site.id)
        .eq("is_internal", true);

      const duplicateAnchorLinks = countDuplicateAnchors(
        (linksList || []).map((l) => ({
          targetIdOrUrl: l.target_page_id || "",
          anchorText: l.anchor_text || "",
        }))
      );

      const healthBreakdown = calculateHealthScore({
        totalPages: pagesScanned || 0,
        orphanPages: orphanCount || 0,
        pagesWithin3Clicks,
        totalInternalLinks: (linksList || []).length,
        duplicateAnchorLinks,
        brokenLinks: brokenCount || 0,
      });

      // Upsert snapshot for this week
      await admin.from("report_snapshots").upsert(
        {
          site_id: site.id,
          week_start: weekStart,
          health_score: healthBreakdown.healthScore,
          pages_scanned: pagesScanned || 0,
          orphan_count: orphanCount || 0,
          broken_count: brokenCount || 0,
          suggestions_ready: suggestionsReady || 0,
          links_applied: linksAppliedWeek || 0,
          orphan_score: healthBreakdown.orphanScore,
          depth_score: healthBreakdown.depthScore,
          anchor_score: healthBreakdown.anchorScore,
          broken_score: healthBreakdown.brokenScore,
        },
        { onConflict: "site_id, week_start" }
      );

      // Send the email via Resend
      const emailResult = await sendWeeklyReportEmail({
        recipientEmail: profile.email,
        recipientName: profile.full_name || undefined,
        siteName: site.name || site.url,
        siteUrl: site.url,
        healthScore: healthBreakdown.healthScore,
        pagesScanned: pagesScanned || 0,
        orphanCount: orphanCount || 0,
        brokenCount: brokenCount || 0,
        suggestionsReady: suggestionsReady || 0,
        linksApplied: linksAppliedWeek || 0,
      });

      if (emailResult.success) {
        emailsSentCount++;
      }
      processedCount++;
    }

    return apiSuccess({
      weekStart,
      processedSites: processedCount,
      emailsSent: emailsSentCount,
      skippedSites: skippedCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error executing weekly report cron";
    return apiError("INTERNAL", message, 500);
  }
}
