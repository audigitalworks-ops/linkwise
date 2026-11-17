import { SupabaseClient } from "@supabase/supabase-js";
import { validateWordPressUrl } from "@/lib/wordpress/client";

export interface LinkCheckResult {
  linkId: string;
  url: string;
  status: number | null;
  isBroken: boolean;
}

/**
 * Checks a single URL's HTTP status safely.
 * Disallows private/loopback IPs to prevent SSRF.
 */
async function checkUrl(url: string): Promise<{ status: number | null; isBroken: boolean }> {
  try {
    try {
      validateWordPressUrl(url);
    } catch {
      return { status: 400, isBroken: true };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "LinkwiseBot/1.0 (+https://linkwise.io/bot)",
        },
      });

      // If HEAD is not allowed (405) or forbidden (403), fallback to GET with range
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent": "LinkwiseBot/1.0 (+https://linkwise.io/bot)",
            Range: "bytes=0-100",
          },
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    const isBroken = res.status >= 400;
    return {
      status: res.status,
      isBroken,
    };
  } catch {
    return {
      status: null,
      isBroken: true,
    };
  }
}

/**
 * Checks a batch of links with a maximum concurrency of 5.
 */
export async function checkLinksBatch(
  supabase: SupabaseClient,
  siteId: string,
  limit = 50
): Promise<{ checkedCount: number; brokenCount: number }> {
  // Fetch unchecked page_links for this site
  const { data: links, error } = await supabase
    .from("page_links")
    .select("id, target_url, http_status")
    .eq("site_id", siteId)
    .is("http_status", null)
    .limit(limit);

  if (error || !links || links.length === 0) {
    return { checkedCount: 0, brokenCount: 0 };
  }

  const concurrency = 5;
  let brokenCount = 0;

  for (let i = 0; i < links.length; i += concurrency) {
    const slice = links.slice(i, i + concurrency);
    const results = await Promise.all(
      slice.map(async (link) => {
        const { status, isBroken } = await checkUrl(link.target_url);
        return {
          id: link.id,
          status,
          isBroken,
        };
      })
    );

    for (const res of results) {
      if (res.isBroken) brokenCount++;
      await supabase
        .from("page_links")
        .update({
          http_status: res.status,
          is_broken: res.isBroken,
        })
        .eq("id", res.id);
    }
  }

  return {
    checkedCount: links.length,
    brokenCount,
  };
}
