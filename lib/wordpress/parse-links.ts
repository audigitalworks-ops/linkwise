import * as cheerio from "cheerio";
import { URL } from "node:url";

export interface ParsedLink {
  targetUrl: string;
  targetPath: string;
  anchorText: string;
  isInternal: boolean;
}

export interface ParsedContent {
  plainText: string;
  wordCount: number;
  links: ParsedLink[];
}

/**
 * Normalizes a URL or path to a clean relative path (e.g. /my-post/).
 */
export function normalizePath(href: string, baseDomain: string): { path: string; isInternal: boolean } {
  try {
    // Relative link
    if (href.startsWith("/")) {
      const clean = href.split("#")[0].split("?")[0];
      return { path: clean.endsWith("/") ? clean : `${clean}/`, isInternal: true };
    }

    if (href.startsWith("http://") || href.startsWith("https://")) {
      const parsed = new URL(href);
      const isInternal =
        parsed.hostname.toLowerCase() === baseDomain.toLowerCase() ||
        parsed.hostname.toLowerCase().endsWith(`.${baseDomain.toLowerCase()}`);

      const clean = parsed.pathname.split("#")[0].split("?")[0];
      const normalizedPath = clean.endsWith("/") ? clean : `${clean}/`;
      return { path: normalizedPath, isInternal };
    }

    return { path: href, isInternal: false };
  } catch {
    return { path: href, isInternal: false };
  }
}

/**
 * Extracts links and plain text from WordPress HTML content using cheerio.
 */
export function parseWordPressHtml(htmlContent: string, siteUrl: string): ParsedContent {
  const $ = cheerio.load(htmlContent || "");

  let baseDomain = "";
  try {
    baseDomain = new URL(siteUrl).hostname.replace("www.", "");
  } catch {
    baseDomain = siteUrl.replace("https://", "").replace("http://", "").split("/")[0];
  }

  const links: ParsedLink[] = [];

  $("a").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href");
    const anchorText = $a.text().trim();

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }

    const { path, isInternal } = normalizePath(href, baseDomain);

    links.push({
      targetUrl: href,
      targetPath: path,
      anchorText,
      isInternal,
    });
  });

  // Extract clean plain text for full-text search indexing and word counting
  const plainText = $.text().replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    plainText,
    wordCount,
    links,
  };
}

