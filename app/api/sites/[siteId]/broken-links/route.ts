import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
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
      .select("id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (!site) {
      return apiError("NOT_FOUND", "Site not found.", 404);
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    const admin = createAdminClient();

    let query = admin
      .from("page_links")
      .select(`
        id,
        site_id,
        source_page_id,
        target_page_id,
        target_url,
        anchor_text,
        http_status,
        is_broken,
        created_at,
        source_page:source_page_id(id, title, path, url)
      `)
      .eq("site_id", siteId)
      .eq("is_broken", true);

    if (type === "404") {
      query = query.gte("http_status", 400);
    } else if (type === "redirect") {
      query = query.in("http_status", [301, 302, 307, 308]);
    }

    const { data: brokenLinks, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return apiError("INTERNAL", error.message, 500);
    }

    // Deduplicate broken links by source_page_id + target_url + anchor_text
    const seen = new Set<string>();
    const uniqueBrokenLinks = (brokenLinks || []).filter((link) => {
      const key = `${link.source_page_id}:${link.target_url}:${link.anchor_text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return apiSuccess({
      brokenLinks: uniqueBrokenLinks,
      count: uniqueBrokenLinks.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed retrieving broken links.";
    return apiError("INTERNAL", message, 500);
  }
}

