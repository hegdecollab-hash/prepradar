import type { Difficulty, ResultQuestion, SearchResult } from "./schema";

export type StatusFilter = "all" | "saved" | "solved" | "unsolved";
export interface Filters {
  company: string; // "" = all
  difficulty: "Any" | Difficulty;
  status: StatusFilter;
}

/** Map question key -> companies that reported it, and merged question data. */
export function questionIndex(result: SearchResult) {
  const map = new Map<string, { q: ResultQuestion; companies: string[] }>();
  for (const c of result.companies)
    for (const q of c.questions) {
      const e = map.get(q.key);
      if (e) {
        e.companies.push(c.name);
        e.q = { ...e.q, sourceUrls: Array.from(new Set([...e.q.sourceUrls, ...q.sourceUrls])) };
      } else map.set(q.key, { q, companies: [c.name] });
    }
  return map;
}

export function matches(q: ResultQuestion, f: Filters, saved: Record<string, { solved: boolean }>): boolean {
  if (f.difficulty !== "Any" && q.difficulty !== f.difficulty) return false;
  const s = saved[q.key];
  if (f.status === "saved" && !s) return false;
  if (f.status === "solved" && !s?.solved) return false;
  if (f.status === "unsolved" && s?.solved) return false;
  return true;
}
