import { beforeEach, describe, expect, it, vi } from "vitest";

class MemStorage {
  m = new Map<string, string>();
  quota = Infinity;
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (v.length > this.quota) {
      const e = new Error("full");
      e.name = "QuotaExceededError";
      throw e;
    }
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

let mem: MemStorage;
beforeEach(() => {
  mem = new MemStorage();
  vi.stubGlobal("window", { localStorage: mem, addEventListener() {}, removeEventListener() {} });
});

const S = await import("@/lib/storage");
const q = {
  key: "two sum",
  title: "Two Sum",
  topic: "arrays",
  companies: ["A"],
  link: { url: "u", kind: "search" as const },
  sourceUrls: ["s"],
  solved: false,
  savedAt: 1,
};

describe("storage", () => {
  it("saves, marks solved, and survives re-read", () => {
    S.upsertSaved(q);
    S.setSolved("two sum", true);
    expect(S.getSaved()["two sum"].solved).toBe(true);
  });
  it("recovers from corrupt data", () => {
    mem.setItem(S.KEYS.saved, "{bad json");
    expect(S.getSaved()).toEqual({});
    mem.setItem(S.KEYS.saved, JSON.stringify({ x: { nope: 1 } }));
    expect(S.getSaved()).toEqual({});
  });
  it("reports quota errors", () => {
    mem.quota = 5;
    expect(() => S.upsertSaved(q)).toThrowError(S.StorageError);
  });
  it("reports unavailable storage", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("denied");
      },
    });
    expect(S.isStorageAvailable()).toBe(false);
    expect(() => S.upsertSaved(q)).toThrow(/unavailable/);
  });
  it("expires cache after 7 days and deletes all data", () => {
    const r = { companies: [] } as never;
    S.putCached("k", r, 0);
    expect(S.getCached("k", 1000)).not.toBeNull();
    expect(S.getCached("k", S.CACHE_TTL_MS + 1)).toBeNull();
    S.pushRecent("graphs");
    S.deleteAllData();
    expect(mem.m.size).toBe(0);
  });
  it("exports CSV with escaping and formula guard", () => {
    const csv = S.toCsv([{ ...q, title: '=HYPERLINK("x")' }]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
