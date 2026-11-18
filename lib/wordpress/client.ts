import { URL } from "node:url";

export interface WordPressConnectionConfig {
  url: string;
  username: string;
  appPasswordDecrypted: string;
}

export interface WordPressPostItem {
  id: number;
  date: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  type: "post" | "page";
  link: string;
  title: { rendered: string; raw?: string };
  content: { rendered: string; raw?: string };
  excerpt: { rendered: string };
}

/**
 * Validates that a target URL is public, uses HTTPS, and does not target
 * localhost or private networks (SSRF prevention).
 */
export function validateWordPressUrl(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error("Invalid WordPress site URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("WordPress site URL must use HTTPS.");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block loopback and local targets
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private or local addresses are not permitted.");
  }

  // Block IPv4 private ranges (RFC 1918 & link-local)
  const ipParts = hostname.split(".").map(Number);
  if (ipParts.length === 4 && ipParts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    const [p0, p1] = ipParts;
    // 10.0.0.0/8
    if (p0 === 10) throw new Error("Private IP ranges are blocked.");
    // 127.0.0.0/8
    if (p0 === 127) throw new Error("Loopback IP addresses are blocked.");
    // 172.16.0.0/12
    if (p0 === 172 && p1 >= 16 && p1 <= 31) throw new Error("Private IP ranges are blocked.");
    // 192.168.0.0/16
    if (p0 === 192 && p1 === 168) throw new Error("Private IP ranges are blocked.");
    // 169.254.0.0/16 (AWS/cloud metadata and link-local)
    if (p0 === 169 && p1 === 254) throw new Error("Link-local and metadata addresses are blocked.");
    // 0.0.0.0/8
    if (p0 === 0) throw new Error("Invalid IP address.");
  }

  return parsed;
}

export class WordPressClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: WordPressConnectionConfig) {
    const validUrl = validateWordPressUrl(config.url);
    // Strip trailing slashes
    this.baseUrl = validUrl.origin + validUrl.pathname.replace(/\/+$/, "");
    const credentials = `${config.username}:${config.appPasswordDecrypted.replace(/\s+/g, "")}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T; headers: Headers }> {
    const fullUrl = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const res = await fetch(fullUrl, {
      ...options,
      signal: options.signal || AbortSignal.timeout(15000),
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("WP_AUTH_FAILED: Invalid WordPress username or Application Password.");
      }
      throw new Error(`WP_UNREACHABLE: WordPress API returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as T;
    return { data, headers: res.headers };
  }

  /**
   * Tests the REST connection and reads total published posts and pages.
   */
  async testConnection(): Promise<{ pagesFound: number }> {
    try {
      const [postsRes, pagesRes] = await Promise.all([
        this.request<WordPressPostItem[]>("/posts?per_page=1&status=publish"),
        this.request<WordPressPostItem[]>("/pages?per_page=1&status=publish"),
      ]);

      const totalPosts = parseInt(postsRes.headers.get("x-wp-total") || "0", 10);
      const totalPages = parseInt(pagesRes.headers.get("x-wp-total") || "0", 10);

      return { pagesFound: totalPosts + totalPages };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(msg);
    }
  }

  /**
   * Fetches published posts.
   */
  async getPosts(page = 1, perPage = 100): Promise<WordPressPostItem[]> {
    const res = await this.request<WordPressPostItem[]>(
      `/posts?page=${page}&per_page=${perPage}&status=publish&_fields=id,date,slug,type,link,title,content,excerpt`
    );
    return res.data;
  }

  /**
   * Fetches published pages.
   */
  async getPages(page = 1, perPage = 100): Promise<WordPressPostItem[]> {
    const res = await this.request<WordPressPostItem[]>(
      `/pages?page=${page}&per_page=${perPage}&status=publish&_fields=id,date,slug,type,link,title,content,excerpt`
    );
    return res.data;
  }

  /**
   * Fetches a single post or page with raw edit context.
   */
  async getPost(postId: number, type: "post" | "page" = "post"): Promise<WordPressPostItem> {
    const endpoint = type === "page" ? `/pages/${postId}?context=edit` : `/posts/${postId}?context=edit`;
    const res = await this.request<WordPressPostItem>(endpoint);
    return res.data;
  }

  /**
   * Updates post content with edit context (used only by Apply link flow).
   */
  async updatePost(postId: number, content: string, type: "post" | "page" = "post"): Promise<WordPressPostItem> {
    const endpoint = type === "page" ? `/pages/${postId}?context=edit` : `/posts/${postId}?context=edit`;
    const res = await this.request<WordPressPostItem>(endpoint, {
      method: "POST", // WordPress REST supports POST or PATCH
      body: JSON.stringify({ content }),
    });
    return res.data;
  }
}

