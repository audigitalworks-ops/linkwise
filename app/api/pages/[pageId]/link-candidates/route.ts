import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";
import { findLinkCandidatesForOrphan } from "@/lib/scan/orphans";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await context.params;
    if (!pageId) {
      return apiError("INVALID_INPUT", "Page ID is required.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    const admin = createAdminClient();

    // Verify page exists and belongs to a site owned by user
    const { data: page, error: pageErr } = await admin
      .from("pages")
      .select("id, site_id, title, site:site_id(user_id)")
      .eq("id", pageId)
      .single();

    if (pageErr || !page || !page.site) {
      return apiError("NOT_FOUND", "Page not found.", 404);
    }

    const siteOwnerId = (page.site as unknown as { user_id: string }).user_id;
    if (siteOwnerId !== user.id) {
      return apiError("FORBIDDEN", "You do not own this site.", 403);
    }

    const rawCandidates = await findLinkCandidatesForOrphan(admin, page.site_id, page.id);
    const candidates = rawCandidates.map((c) => ({
      sourcePageId: c.id,
      sourceTitle: c.title,
      sourceUrl: c.url,
      sourcePath: c.path,
      suggestedAnchor: page.title.toLowerCase(),
      relevance: c.relevanceScore,
    }));

    return apiSuccess({
      candidates,
      targetTitle: page.title,
      siteId: page.site_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed finding link candidates.";
    return apiError("INTERNAL", message, 500);
  }
}

