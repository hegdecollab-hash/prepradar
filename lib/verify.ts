import { buildLeetcodeLink, domainOf, normalizeUrl } from "./links";
import {
  normalizeSpaces,
  normalizeTitle,
  type Confidence,
  type DifficultyFilter,
  type ModelOutput,
  type ResultCompany,
  type ResultQuestion,
  type SearchResult,
} from "./schema";

export interface Citation {
  url: string;
  title: string;
  content?: string;
}

export const MAX_COMPANIES = 12;
export const MAX_QUESTIONS = 15;

export function computeConfidence(questions: ResultQuestion[]): Confidence {
  const domains = new Set(questions.flatMap((q) => q.sourceUrls.map(domainOf)));
  const urls = new Set(questions.flatMap((q) => q.sourceUrls));
  if (questions.length >= 3 || domains.size >= 2) return "High";
  if (questions.length === 2 || (urls.size === 1 && questions.length > 1)) return "Medium";
  return "Low";
}

/** Deduplicate citations by normalized URL, merging content. */
export function collectCitations(citations: Citation[]): Map<string, Citation> {
  const map = new Map<string, Citation>();
  for (const c of citations) {
    const key = normalizeUrl(c.url);
    if (!key) continue;
    const prev = map.get(key);
    if (prev) {
      prev.content = [prev.content, c.content].filter(Boolean).join("\n");
      if (!prev.title && c.title) prev.title = c.title;
    } else map.set(key, { url: c.url, title: c.title || domainOf(c.url), content: c.content });
  }
  return map;
}

export function verifyResult(args: {
  output: ModelOutput;
  citations: Citation[];
  topic: string;
  company: string | null;
  difficulty: DifficultyFilter;
  model: string;
  now?: Date;
}): SearchResult {
  const { output, topic, company, difficulty, model } = args;
  const cited = collectCitations(args.citations);
  const companiesByName = new Map<string, ResultCompany>();

  if (output.isDsaTopic) {
    for (const c of output.companies ?? []) {
      const name = normalizeSpaces(c.name);
      if (!name) continue;
      const nameKey = name.toLowerCase();
      const entry = companiesByName.get(nameKey) ?? { name, confidence: "Low" as Confidence, questions: [] };
      for (const q of c.questions ?? []) {
        const sources = Array.from(
          new Set(
            q.sourceUrls
              .map((u) => normalizeUrl(u))
              .filter((u): u is string => !!u && cited.has(u))
              .map((u) => cited.get(u)!.url),
          ),
        );
        if (sources.length === 0) continue; // drop unsourced questions
        const title = normalizeSpaces(q.title);
        const key = normalizeTitle(title);
        if (!key) continue;
        if (difficulty !== "Any" && q.difficulty && q.difficulty !== difficulty) continue;
        const evidence = sources
          .map((u) => {
            const ci = cited.get(normalizeUrl(u)!)!;
            return `${ci.url}\n${ci.title}\n${ci.content ?? ""}`;
          })
          .join("\n");
        const existing = entry.questions.find((x) => x.key === key);
        if (existing) {
          existing.sourceUrls = Array.from(new Set([...existing.sourceUrls, ...sources]));
          continue;
        }
        if (entry.questions.length >= MAX_QUESTIONS) continue;
        const slug = q.leetcodeSlug?.trim().toLowerCase() || undefined;
        const link = buildLeetcodeLink(title, slug, evidence);
        const year = q.reportedYear ?? undefined;
        entry.questions.push({
          key,
          title,
          leetcodeSlug: link.kind === "direct" ? slug : undefined,
          difficulty: q.difficulty ?? undefined,
          pattern: q.pattern ? normalizeSpaces(q.pattern).slice(0, 60) : undefined,
          sourceUrls: sources,
          reportedYear: year && year >= 2000 && year <= 2100 ? year : undefined,
          link,
        });
      }
      if (entry.questions.length) companiesByName.set(nameKey, entry);
    }
  }

  const latestYear = (c: ResultCompany) => Math.max(0, ...c.questions.map((q) => q.reportedYear ?? 0));
  const companies = Array.from(companiesByName.values())
    .map((c) => ({ ...c, confidence: computeConfidence(c.questions) }))
    .sort((a, b) => b.questions.length - a.questions.length || latestYear(b) - latestYear(a))
    .slice(0, MAX_COMPANIES);

  const used = new Set(companies.flatMap((c) => c.questions.flatMap((q) => q.sourceUrls)));
  const sources = Array.from(cited.values())
    .filter((c) => used.has(c.url))
    .map((c) => ({ url: c.url, title: c.title }));

  const notes = output.notes ? normalizeSpaces(output.notes).slice(0, 500) : undefined;
  return {
    topic,
    company,
    difficulty,
    searchedAt: (args.now ?? new Date()).toISOString(),
    model,
    isDsaTopic: output.isDsaTopic,
    companies,
    sources,
    notes,
  };
}
