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

    // Verify site belongs to user
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
    const status = searchParams.get("status") || "pending";
    const minRelevance = parseFloat(searchParams.get("minRelevance") || "0");
    const query = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const offset = (page - 1) * pageSize;

    const admin = createAdminClient();

    let dbQuery = admin
      .from("suggestions")
      .select(
        `
        id,
        site_id,
        source_page_id,
        target_page_id,
        anchor_text,
        source_paragraph,
        relevance,
        status,
        applied_at,
        created_at,
        source_page:source_page_id(id, title, path, url),
        target_page:target_page_id(id, title, path, url)
      `,
        { count: "exact" }
      )
      .eq("site_id", siteId);

    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status);
    }

    if (minRelevance > 0) {
      dbQuery = dbQuery.gte("relevance", minRelevance);
    }

    if (query) {
      dbQuery = dbQuery.ilike("anchor_text", `%${query}%`);
    }

    dbQuery = dbQuery
      .order("relevance", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      return apiError("INTERNAL", error.message, 500);
    }

    return apiSuccess({
      suggestions: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed retrieving suggestions.";
    return apiError("INTERNAL", message, 500);
  }
}

