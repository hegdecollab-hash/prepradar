import type { QuestionLink } from "./schema";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const leetcodeSearchUrl = (title: string) =>
  `https://leetcode.com/problemset/?search=${encodeURIComponent(title)}`;

/** Normalize a URL for comparison (drop hash, trailing slash, utm params, lowercase host). */
export function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.hash = "";
    [...u.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => u.searchParams.delete(k));
    const s = `${u.protocol}//${u.host.toLowerCase().replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}${u.search}`;
    return s;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Build the LeetCode link. A direct link only when the slug is well-formed AND the slug
 * or the normalized title appears in the cited evidence text. Otherwise a search link.
 */
export function buildLeetcodeLink(title: string, slug: string | null | undefined, evidence: string): QuestionLink {
  const ev = evidence.toLowerCase();
  if (slug && SLUG_RE.test(slug) && slug.length <= 100) {
    const titleFromSlug = slug.replace(/-/g, " ");
    const normTitle = title
      .toLowerCase()
      .replace(/^\s*\d+\s*[.)-]\s*/, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const evNorm = ev.replace(/[^a-z0-9]+/g, " ");
    const slugMatchesTitle = normTitle === titleFromSlug;
    if (ev.includes(slug) || (slugMatchesTitle && evNorm.includes(normTitle))) {
      return { url: `https://leetcode.com/problems/${slug}/`, kind: "direct" };
    }
  }
  return { url: leetcodeSearchUrl(title), kind: "search" };
}
