import * as cheerio from "cheerio";

export interface WrapAnchorOptions {
  htmlContent: string;
  anchorText: string;
  targetUrl: string;
}

export interface WrapAnchorResult {
  updatedHtml: string;
  replaced: boolean;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps the first exact, unlinked match of the anchor text with an <a> tag.
 * Preserves the original HTML structure and never modifies text inside existing <a> tags,
 * script tags, style tags, or tag attributes.
 */
export function wrapAnchorInHtml(options: WrapAnchorOptions): WrapAnchorResult {
  const { htmlContent, anchorText, targetUrl } = options;

  if (!htmlContent || !anchorText || !targetUrl) {
    return { updatedHtml: htmlContent, replaced: false };
  }

  const trimmedAnchor = anchorText.trim();
  if (!trimmedAnchor) {
    return { updatedHtml: htmlContent, replaced: false };
  }

  // Load with cheerio (without wrapping in html/body tags when possible)
  const $ = cheerio.load(htmlContent, { xml: false }, false);
  let replaced = false;

  interface DomNode {
    type?: string;
    data?: string;
    parent?: { tagName?: string } | null;
    children?: DomNode[];
  }

  // Traverse text nodes across the document
  function traverse(node: DomNode) {
    if (replaced) return;

    // Do not modify inside existing links, scripts, or styles
    const parentName = node.parent?.tagName?.toLowerCase();
    if (parentName === "a" || parentName === "script" || parentName === "style") {
      return;
    }

    if (node.type === "text" && node.data) {
      const text = node.data;
      const regex = new RegExp(`(^|\\b|\\s)(${escapeRegex(trimmedAnchor)})(\\b|\\s|$)`, "i");
      const match = text.match(regex);

      if (match && match.index !== undefined) {
        // match[1] is prefix, match[2] is matched anchor
        const prefix = match[1];
        const matchedText = match[2];

        const matchStart = match.index;
        const anchorStart = matchStart + prefix.length;
        const anchorEnd = anchorStart + matchedText.length;

        const before = text.substring(0, anchorStart);
        const after = text.substring(anchorEnd);

        // Sanitize targetUrl to prevent HTML/attribute injection and javascript: URIs
        const trimmedUrl = targetUrl.trim();
        if (/^javascript:/i.test(trimmedUrl) || /^data:/i.test(trimmedUrl)) {
          return;
        }
        const safeUrl = trimmedUrl.replace(/"/g, "&quot;").replace(/[<>]/g, "");

        // Build replacement nodes
        const linkHtml = `<a href="${safeUrl}">${matchedText}</a>`;
        $(node as unknown as Parameters<typeof $>[0]).replaceWith(`${before}${linkHtml}${after}`);
        replaced = true;
        return;
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of [...node.children]) {
        traverse(child);
        if (replaced) break;
      }
    }
  }

  $.root().each((_, el) => {
    traverse(el as unknown as DomNode);
  });

  return {
    updatedHtml: $.html(),
    replaced,
  };
}
