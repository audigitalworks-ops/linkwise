import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { sendWeeklyReportEmail } from "@/lib/email/client";
import { calculateHealthScore, countDuplicateAnchors } from "@/lib/scan/health-score";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await context.params;
    if (!siteId) {
      return apiError("INVALID_INPUT", "Site ID is required.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    // Verify site ownership
    const { data: site } = await supabase
      .from("sites")
      .select("id, name, url, user_id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (!site) {
      return apiError("NOT_FOUND", "Site not found or unauthorized.", 404);
    }

    const admin = createAdminClient();

    // Fetch user profile email
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const recipientEmail = profile?.email || user.email;
    if (!recipientEmail) {
      return apiError("INVALID_INPUT", "User email not found.", 400);
    }

    // Gather latest site metrics
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: linksAppliedWeek } = await admin
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("site_id", site.id)
      .eq("action", "link_applied")
      .gte("created_at", sevenDaysAgo);

    const { data: pagesList } = await admin
      .from("pages")
      .select("depth")
      .eq("site_id", site.id);

    const pagesWithin3Clicks = (pagesList || []).filter(
      (p) => p.depth !== null && p.depth <= 3
    ).length;

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

    const emailResult = await sendWeeklyReportEmail({
      recipientEmail,
      recipientName: profile?.full_name || undefined,
      siteName: site.name || site.url,
      siteUrl: site.url,
      healthScore: healthBreakdown.healthScore,
      pagesScanned: pagesScanned || 0,
      orphanCount: orphanCount || 0,
      brokenCount: brokenCount || 0,
      suggestionsReady: suggestionsReady || 0,
      linksApplied: linksAppliedWeek || 0,
    });

    if (!emailResult.success) {
      return apiError("INTERNAL", emailResult.error || "Failed sending email.", 500);
    }

    return apiSuccess({
      sent: true,
      email: recipientEmail,
      messageId: emailResult.id,
      healthScore: healthBreakdown.healthScore,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send report.";
    return apiError("INTERNAL", message, 500);
  }
}

