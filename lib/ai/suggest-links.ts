import Groq from "groq-sdk";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";

export const GroqSuggestionSchema = z.object({
  target_page_id: z.string(),
  anchor_text: z.string(),
  relevance: z.number().min(0).max(1),
  reason: z.string().optional(),
});

export const GroqResponseSchema = z.object({
  suggestions: z.array(GroqSuggestionSchema),
});

export type ValidatedSuggestion = z.infer<typeof GroqSuggestionSchema>;

export interface CandidateTarget {
  id: string;
  title: string;
  url: string;
  path: string;
  excerpt?: string;
}

/**
 * Finds up to 5 candidate target pages for a given source paragraph or title
 * using Postgres full-text search on `search_vector`.
 */
export async function findCandidatesForPage(
  supabase: SupabaseClient,
  siteId: string,
  sourcePageId: string,
  searchQuery: string
): Promise<CandidateTarget[]> {
  const queryTerms = searchQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 8)
    .join(" | ");

  if (!queryTerms) return [];

  // Exclude targets that already have an internal link from this source page
  const { data: existingLinks } = await supabase
    .from("page_links")
    .select("target_page_id")
    .eq("source_page_id", sourcePageId)
    .not("target_page_id", "is", null);

  const excludedIds = new Set((existingLinks || []).map((l) => l.target_page_id));
  excludedIds.add(sourcePageId);

  const { data: candidates } = await supabase
    .from("pages")
    .select("id, title, url, path, excerpt")
    .eq("site_id", siteId)
    .neq("id", sourcePageId)
    .textSearch("search_vector", queryTerms, { type: "websearch" })
    .limit(10);

  const filtered = (candidates || [])
    .filter((c) => !excludedIds.has(c.id))
    .slice(0, 5);

  return filtered.map((c) => ({
    id: c.id,
    title: c.title,
    url: c.url,
    path: c.path,
    excerpt: c.excerpt || "",
  }));
}

/**
 * Scores and extracts the best anchor text and candidate using Groq with strict JSON output and Zod validation.
 */
export async function scoreCandidatesWithGroq(
  sourceParagraph: string,
  candidates: CandidateTarget[],
  minRelevance = 0.75
): Promise<ValidatedSuggestion[]> {
  if (candidates.length === 0 || !sourceParagraph.trim()) {
    return [];
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Fallback if GROQ_API_KEY is not configured (heuristic matching)
  if (!apiKey) {
    const valid: ValidatedSuggestion[] = [];
    for (const cand of candidates) {
      // Find candidate title or keyword inside sourceParagraph
      const words = cand.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      for (const w of words) {
        const idx = sourceParagraph.toLowerCase().indexOf(w);
        if (idx !== -1) {
          const matched = sourceParagraph.substring(idx, idx + w.length);
          valid.push({
            target_page_id: cand.id,
            anchor_text: matched,
            relevance: 0.85,
            reason: `Heuristic match on keyword "${matched}"`,
          });
          break;
        }
      }
      if (valid.length > 0) break;
    }
    return valid;
  }

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const prompt = `You are an SEO internal linking specialist.
Analyze this source paragraph from a blog post and the 5 candidate target articles from the same website.
Select the single best contextual internal link opportunity.

Source Paragraph:
"${sourceParagraph}"

Candidate Target Articles:
${candidates.map((c, i) => `${i + 1}. ID: ${c.id} | Title: "${c.title}" | Excerpt: "${c.excerpt}"`).join("\n")}

STRICT RULES:
1. anchor_text MUST appear EXACTLY (verbatim) inside the source paragraph. Do not invent words.
2. target_page_id MUST be one of the provided candidate IDs.
3. relevance MUST be a number between 0.0 and 1.0.
4. If no candidate is relevant or no natural anchor exists, return an empty suggestions array.

Respond in JSON format only:
{
  "suggestions": [
    {
      "target_page_id": "ID",
      "anchor_text": "exact phrase in paragraph",
      "relevance": 0.88,
      "reason": "why this link is contextually helpful"
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an internal linking AI that outputs strictly valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model,
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const parsedJson = JSON.parse(rawContent);
    const parsed = GroqResponseSchema.safeParse(parsedJson);

    if (!parsed.success) {
      console.warn("Groq output schema validation failed:", parsed.error);
      return [];
    }

    const candidateIdSet = new Set(candidates.map((c) => c.id));
    const lowerPara = sourceParagraph.toLowerCase();

    // Verify constraints
    const verified = parsed.data.suggestions.filter((s) => {
      // 1. Must be in candidate list
      if (!candidateIdSet.has(s.target_page_id)) return false;
      // 2. Must meet min relevance
      if (s.relevance < minRelevance) return false;
      // 3. Anchor text must exist verbatim in paragraph
      if (!lowerPara.includes(s.anchor_text.toLowerCase())) return false;
      return true;
    });

    return verified;
  } catch (err: unknown) {
    console.error("Groq suggestion generation failed:", err);
    return [];
  }
}

