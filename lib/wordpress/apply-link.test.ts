import { describe, it, expect } from "vitest";
import { wrapAnchorInHtml } from "./apply-link";

describe("wrapAnchorInHtml", () => {
  it("wraps the first exact occurrence of anchor text with an <a> tag", () => {
    const html = "<p>For healthy plants, our organic compost is essential for soil vitality.</p>";
    const result = wrapAnchorInHtml({
      htmlContent: html,
      anchorText: "organic compost",
      targetUrl: "https://greenleafgardening.com/organic-compost-guide/",
    });

    expect(result.replaced).toBe(true);
    expect(result.updatedHtml).toBe(
      '<p>For healthy plants, our <a href="https://greenleafgardening.com/organic-compost-guide/">organic compost</a> is essential for soil vitality.</p>'
    );
  });

  it("preserves casing of matched anchor text", () => {
    const html = "<p>Learn about Organic Compost and its seasonal uses.</p>";
    const result = wrapAnchorInHtml({
      htmlContent: html,
      anchorText: "organic compost",
      targetUrl: "https://greenleafgardening.com/guide/",
    });

    expect(result.replaced).toBe(true);
    expect(result.updatedHtml).toContain(
      '<a href="https://greenleafgardening.com/guide/">Organic Compost</a>'
    );
  });

  it("does not wrap anchor text that is already inside an existing link", () => {
    const html =
      '<p>Check out our <a href="https://old-link.com">organic compost</a> today, or make your own organic compost at home.</p>';
    const result = wrapAnchorInHtml({
      htmlContent: html,
      anchorText: "organic compost",
      targetUrl: "https://greenleafgardening.com/new-guide/",
    });

    expect(result.replaced).toBe(true);
    // The first one should NOT be touched, the second one (unlinked) should be wrapped!
    expect(result.updatedHtml).toContain('<a href="https://old-link.com">organic compost</a>');
    expect(result.updatedHtml).toContain(
      'make your own <a href="https://greenleafgardening.com/new-guide/">organic compost</a> at home'
    );
  });

  it("does not modify html if anchor text is not present", () => {
    const html = "<p>Watering trees in summer requires drip irrigation.</p>";
    const result = wrapAnchorInHtml({
      htmlContent: html,
      anchorText: "organic compost",
      targetUrl: "https://greenleafgardening.com/guide/",
    });

    expect(result.replaced).toBe(false);
    expect(result.updatedHtml).toBe(html);
  });

  it("handles anchors with special regex characters safely", () => {
    const html = "<p>Visit our SEO & Gardening (v1.0) workshop.</p>";
    const result = wrapAnchorInHtml({
      htmlContent: html,
      anchorText: "SEO & Gardening (v1.0)",
      targetUrl: "https://greenleafgardening.com/workshop/",
    });

    expect(result.replaced).toBe(true);
    expect(result.updatedHtml).toContain(
      '<a href="https://greenleafgardening.com/workshop/">SEO &amp; Gardening (v1.0)</a>'
    );
  });
});

