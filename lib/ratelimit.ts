/** Best-effort in-memory per-IP limiter. NOT durable across serverless instances. */
const hits = new Map<string, number[]>();
export const WINDOW_MS = 10 * 60_000;
export const MAX_PER_WINDOW = 10;

export function rateLimit(ip: string, now = Date.now()): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return true;
}
