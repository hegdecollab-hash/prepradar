import type { ApiError, DifficultyFilter, SearchResult } from "./schema";

export class SearchFailure extends Error {
  constructor(public info: ApiError) {
    super(info.message);
  }
}

/** One in-flight request per search key; repeated calls share the same promise. */
const inflight = new Map<string, { promise: Promise<SearchResult>; controller: AbortController }>();

export function runSearch(key: string, input: { topic: string; company?: string; difficulty: DifficultyFilter }) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const controller = new AbortController();
  const requestId = crypto.randomUUID();
  const promise = (async () => {
    let res: Response;
    try {
      res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestId }),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      if (controller.signal.aborted)
        throw new SearchFailure({ code: "cancelled", message: "Search cancelled.", retryable: true, requestId });
      throw new SearchFailure({
        code: navigator.onLine ? "network" : "offline",
        message: navigator.onLine
          ? "Couldn't reach PrepRadar. Check your connection and try again."
          : "You're offline. Reconnect and try again.",
        retryable: true,
        requestId,
      });
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new SearchFailure({
        code: "bad_response",
        message: `We received an unexpected response (${res.status}). Try again.`,
        retryable: true,
        requestId,
      });
    }
    if (!res.ok) {
      const b = body as Partial<ApiError>;
      throw new SearchFailure({
        code: b.code ?? "error",
        message: b.message ?? `The search didn't complete (${res.status}). Try again.`,
        retryable: !!b.retryable,
        requestId: b.requestId ?? requestId,
      });
    }
    return body as SearchResult;
  })().finally(() => inflight.delete(key));
  const entry = { promise, controller };
  inflight.set(key, entry);
  return entry;
}

export function cancelSearch(key: string) {
  inflight.get(key)?.controller.abort();
}
