import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("UNAUTHENTICATED", "You must be signed in.", 401);
    }

    const body = await req.json();
    const { siteId, sourcePageId, targetPageId, anchorText, relevance, sourceParagraph } = body;

    if (!siteId || !sourcePageId || !targetPageId || !anchorText) {
      return apiError("INVALID_INPUT", "Missing required link fields.", 400);
    }

    const admin = createAdminClient();

    // Verify site ownership
    const { data: site } = await admin
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("user_id", user.id)
      .single();

    if (!site) {
      return apiError("FORBIDDEN", "Site not found or access denied.", 403);
    }

    // Retrieve source page to extract actual paragraph context for the suggestion
    const { data: sourcePage } = await admin
      .from("pages")
      .select("id, title, content_text")
      .eq("id", sourcePageId)
      .single();

    let paragraph = typeof sourceParagraph === "string" ? sourceParagraph.trim() : "";
    if (!paragraph && sourcePage?.content_text) {
      const paragraphs = sourcePage.content_text
        .split(/\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 20);

      // Try to find a paragraph containing the anchor text
      const matchingPara = paragraphs.find((p: string) =>
        p.toLowerCase().includes(anchorText.toLowerCase())
      );

      paragraph = matchingPara || paragraphs[0] || sourcePage.content_text.slice(0, 300);
    }

    if (!paragraph) {
      paragraph = `Learn more about ${anchorText} in our latest article.`;
    }

    // Insert or update suggestion
    const { data: suggestion, error: sugErr } = await admin
      .from("suggestions")
      .upsert(
        {
          site_id: siteId,
          source_page_id: sourcePageId,
          target_page_id: targetPageId,
          anchor_text: anchorText.trim(),
          source_paragraph: paragraph,
          relevance: Number(relevance) || 0.9,
          status: "pending",
        },
        { onConflict: "source_page_id,target_page_id,anchor_text" }
      )
      .select("id")
      .single();

    if (sugErr) {
      return apiError("INTERNAL", sugErr.message, 500);
    }

    return apiSuccess({
      suggestionId: suggestion?.id,
      status: "created",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed creating suggestion.";
    return apiError("INTERNAL", message, 500);
  }
}

