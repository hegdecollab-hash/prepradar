import type { Difficulty, QuestionLink, SearchResult } from "./schema";

const PREFIX = "prepradar:v1:";
export const KEYS = { cache: `${PREFIX}cache`, saved: `${PREFIX}saved`, recent: `${PREFIX}recent` } as const;
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type StorageErrorKind = "unavailable" | "quota" | "corrupt";
export class StorageError extends Error {
  constructor(
    public kind: StorageErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export interface CachedSearch {
  key: string;
  savedAt: number;
  result: SearchResult;
}

export interface SavedQuestion {
  key: string;
  title: string;
  topic: string;
  companies: string[];
  difficulty?: Difficulty;
  pattern?: string;
  link: QuestionLink;
  sourceUrls: string[];
  solved: boolean;
  savedAt: number;
}

function store(): Storage {
  try {
    const s = window.localStorage;
    const t = `${PREFIX}__t`;
    s.setItem(t, "1");
    s.removeItem(t);
    return s;
  } catch {
    throw new StorageError(
      "unavailable",
      "Browser storage is unavailable (private mode or blocked). Saving is disabled.",
    );
  }
}

export function isStorageAvailable(): boolean {
  try {
    store();
    return true;
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();
let version = 0;
export const getVersion = () => version;
export function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIX)) {
      version++;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

/** Defensive read: returns fallback on missing; corrupt values are reset and reported. */
export function readJson<T>(key: string, fallback: T, guard: (v: unknown) => v is T): T {
  let raw: string | null;
  try {
    raw = store().getItem(key);
  } catch {
    return fallback;
  }
  if (raw == null) return fallback;
  try {
    const v = JSON.parse(raw) as unknown;
    if (guard(v)) return v;
  } catch {
    /* fall through */
  }
  try {
    store().removeItem(key);
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeJson(key: string, value: unknown): void {
  const s = store();
  try {
    s.setItem(key, JSON.stringify(value));
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED")
      throw new StorageError("quota", "Browser storage is full. Delete cached searches to free up space.");
    throw new StorageError("unavailable", "Couldn't save to browser storage.");
  }
  emit();
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isCacheMap = (v: unknown): v is Record<string, CachedSearch> =>
  isObj(v) &&
  Object.values(v).every(
    (c) =>
      isObj(c) &&
      typeof c.savedAt === "number" &&
      isObj(c.result) &&
      Array.isArray((c.result as { companies?: unknown }).companies),
  );
const isSavedMap = (v: unknown): v is Record<string, SavedQuestion> =>
  isObj(v) &&
  Object.values(v).every(
    (q) => isObj(q) && typeof q.title === "string" && typeof q.solved === "boolean" && isObj(q.link),
  );
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

// ---- cached searches
export function getCacheMap() {
  return readJson(KEYS.cache, {} as Record<string, CachedSearch>, isCacheMap);
}
export function getCached(key: string, now = Date.now()): CachedSearch | null {
  const c = getCacheMap()[key];
  return c && now - c.savedAt < CACHE_TTL_MS ? c : null;
}
export function putCached(key: string, result: SearchResult, now = Date.now()) {
  const map = getCacheMap();
  for (const [k, v] of Object.entries(map)) if (now - v.savedAt >= CACHE_TTL_MS) delete map[k];
  map[key] = { key, savedAt: now, result };
  try {
    writeJson(KEYS.cache, map);
  } catch (e) {
    if (e instanceof StorageError && e.kind === "quota") {
      // evict oldest half then retry once
      const sorted = Object.values(map).sort((a, b) => a.savedAt - b.savedAt);
      sorted.slice(0, Math.ceil(sorted.length / 2)).forEach((c) => c.key !== key && delete map[c.key]);
      writeJson(KEYS.cache, map);
    } else throw e;
  }
}
export function deleteCached(key: string) {
  const map = getCacheMap();
  delete map[key];
  writeJson(KEYS.cache, map);
}

// ---- saved checklist
export function getSaved() {
  return readJson(KEYS.saved, {} as Record<string, SavedQuestion>, isSavedMap);
}
export function upsertSaved(q: SavedQuestion) {
  const map = getSaved();
  const prev = map[q.key];
  map[q.key] = prev
    ? { ...prev, companies: Array.from(new Set([...prev.companies, ...q.companies])), solved: q.solved }
    : q;
  writeJson(KEYS.saved, map);
}
export function removeSaved(key: string) {
  const map = getSaved();
  delete map[key];
  writeJson(KEYS.saved, map);
}
export function setSolved(key: string, solved: boolean) {
  const map = getSaved();
  if (!map[key]) return;
  map[key] = { ...map[key], solved };
  writeJson(KEYS.saved, map);
}
export function clearSaved() {
  writeJson(KEYS.saved, {});
}

// ---- recent topics
export function getRecent() {
  return readJson(KEYS.recent, [] as string[], isStrArr);
}
export function pushRecent(topic: string) {
  const list = [topic, ...getRecent().filter((t) => t.toLowerCase() !== topic.toLowerCase())].slice(0, 8);
  writeJson(KEYS.recent, list);
}

export function deleteAllData() {
  const s = store();
  Object.values(KEYS).forEach((k) => s.removeItem(k));
  emit();
}

export function toCsv(items: SavedQuestion[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Title", "Topic", "Companies", "Difficulty", "Pattern", "Solved", "LeetCode", "Sources"]];
  for (const q of items)
    rows.push([
      q.title,
      q.topic,
      q.companies.join("; "),
      q.difficulty ?? "",
      q.pattern ?? "",
      q.solved ? "yes" : "no",
      q.link.url,
      q.sourceUrls.join(" "),
    ]);
  return rows.map((r) => r.map((c) => esc(/^[=+\-@]/.test(c) ? `'${c}` : c)).join(",")).join("\n");
}
