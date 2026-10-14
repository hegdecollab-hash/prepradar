"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/search-form";
import { cacheKey, searchFormSchema, type DifficultyFilter, type SearchResult } from "@/lib/schema";
import { cancelSearch, runSearch, SearchFailure } from "@/lib/search-client";
import { deleteCached, getCached, isStorageAvailable, pushRecent, putCached, StorageError } from "@/lib/storage";
import { ResultsView } from "./results-view";

type State =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "loading"; slow: boolean }
  | { kind: "error"; message: string; code: string; retryable: boolean; requestId: string }
  | { kind: "done"; result: SearchResult; cachedAt?: number };

function Skeleton({ slow, onCancel }: { slow: boolean; onCancel: () => void }) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <p>
          {slow
            ? "Still searching. Web search plus analysis can take up to a minute."
            : "Searching the web, this can take up to a minute."}
        </p>
        <Button variant="outline" className="h-11 rounded-xl px-4" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-card animate-pulse rounded-2xl border p-5"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="bg-muted h-5 w-40 rounded" />
          <div className="mt-4 space-y-3">
            <div className="bg-muted h-4 w-3/4 rounded" />
            <div className="bg-muted h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchPage() {
  const params = useSearchParams();
  const topicParam = params.get("topic") ?? "";
  const companyParam = params.get("company") ?? "";
  const diffParam = (params.get("difficulty") ?? "Any") as DifficultyFilter;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [online, setOnline] = useState(true);
  const keyRef = useRef("");

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const start = useCallback(
    (force: boolean) => {
      let input: { topic: string; company?: string; difficulty: DifficultyFilter };
      try {
        input = searchFormSchema.validateSync({
          topic: topicParam,
          company: companyParam,
          difficulty: diffParam,
        }) as typeof input;
      } catch (e) {
        setState({ kind: "invalid", message: (e as Error).message });
        return () => {};
      }
      const key = cacheKey(input.topic, input.company, input.difficulty);
      keyRef.current = key;
      if (!force) {
        const hit = isStorageAvailable() ? getCached(key) : null;
        if (hit) {
          setState({ kind: "done", result: hit.result, cachedAt: hit.savedAt });
          return () => {};
        }
      }
      if (!navigator.onLine) {
        setState({
          kind: "error",
          code: "offline",
          message: "You're offline. Reconnect and try again.",
          retryable: true,
          requestId: "-",
        });
        return () => {};
      }
      let alive = true;
      setState({ kind: "loading", slow: false });
      const slowTimer = setTimeout(
        () => alive && setState((s) => (s.kind === "loading" ? { kind: "loading", slow: true } : s)),
        20_000,
      );
      runSearch(key, { topic: input.topic, company: input.company || undefined, difficulty: input.difficulty })
        .promise.then((result) => {
          if (!alive) return;
          try {
            putCached(key, result);
            pushRecent(result.topic);
          } catch (e) {
            if (e instanceof StorageError) toast.error(e.message, { id: "storage-error" });
          }
          setState({ kind: "done", result });
        })
        .catch((e: unknown) => {
          if (!alive) return;
          const info =
            e instanceof SearchFailure
              ? e.info
              : { code: "error", message: "Search failed.", retryable: true, requestId: "-" };
          setState({ kind: "error", ...info });
        })
        .finally(() => clearTimeout(slowTimer));
      return () => {
        alive = false;
        clearTimeout(slowTimer);
      };
    },
    [topicParam, companyParam, diffParam],
  );

  useEffect(() => {
    // Deferred so React StrictMode's mount/unmount/mount doesn't fire two requests.
    let cleanup = () => {};
    const id = setTimeout(() => {
      cleanup = start(false);
    }, 0);
    return () => {
      clearTimeout(id);
      cleanup();
    };
  }, [start]);

  const cancel = () => {
    cancelSearch(keyRef.current);
  };

  const initial = {
    topic: topicParam,
    company: companyParam,
    difficulty: ["Easy", "Medium", "Hard"].includes(diffParam) ? diffParam : ("Any" as DifficultyFilter),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-section font-semibold">Results</h1>
      <details className="bg-card mt-4 rounded-2xl border p-4 sm:p-5" open={state.kind === "invalid"}>
        <summary className="min-h-11 cursor-pointer content-center font-semibold">Edit search</summary>
        <div className="mt-4">
          <SearchForm initial={initial} compact />
        </div>
      </details>

      {!online && (
        <p role="status" className="bg-card mt-4 flex items-center gap-2 rounded-xl border px-4 py-3">
          <WifiOff className="size-4" aria-hidden /> You&apos;re offline. Cached results still work; new searches need a
          connection.
        </p>
      )}

      <div className="mt-6">
        {state.kind === "invalid" && (
          <p role="alert" className="border-destructive/30 bg-card text-destructive rounded-2xl border p-5">
            {state.message}
          </p>
        )}
        {state.kind === "loading" && <Skeleton slow={state.slow} onCancel={cancel} />}
        {state.kind === "error" && (
          <div role="alert" className="border-destructive/30 bg-card rounded-2xl border p-6">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="text-destructive size-5" aria-hidden />
              {state.code === "cancelled" ? "Search cancelled" : "Search failed"}
            </p>
            <p className="text-muted-foreground mt-2">{state.message}</p>
            {state.requestId !== "-" && (
              <p className="text-muted-foreground mt-1 text-sm">Request ID: {state.requestId}</p>
            )}
            {state.retryable && (
              <Button className="mt-4 h-11 rounded-xl px-4" onClick={() => start(true)}>
                Try again
              </Button>
            )}
          </div>
        )}
        {state.kind === "done" && !state.result.isDsaTopic && (
          <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">That doesn&apos;t look like a DSA topic.</p>
            <p className="text-muted-foreground mt-2">
              Try something like &ldquo;sliding window&rdquo;, &ldquo;graphs&rdquo; or &ldquo;dynamic
              programming&rdquo;.
            </p>
          </div>
        )}
        {state.kind === "done" && state.result.isDsaTopic && state.result.companies.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">No sourced questions found for this search.</p>
            <p className="text-muted-foreground mt-2">
              We only show questions tied to a cited source. Try a broader topic, remove the company filter, or refresh
              later.
            </p>
            {state.result.notes && (
              <p className="text-muted-foreground mt-2 text-sm">Note from search: {state.result.notes}</p>
            )}
            <Button variant="outline" className="mt-4 h-11 rounded-xl px-4" onClick={() => start(true)}>
              <RefreshCw className="size-4" aria-hidden /> Refresh results
            </Button>
          </div>
        )}
        {state.kind === "done" && state.result.isDsaTopic && state.result.companies.length > 0 && (
          <ResultsView
            result={state.result}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {state.cachedAt && (
                  <span className="text-muted-foreground text-sm">
                    Cached in this browser {new Date(state.cachedAt).toLocaleString()}.
                  </span>
                )}
                <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => start(true)}>
                  <RefreshCw className="size-4" aria-hidden /> Refresh results
                </Button>
                {state.cachedAt && (
                  <Button
                    variant="ghost"
                    className="h-11 rounded-xl px-4"
                    onClick={() => {
                      try {
                        deleteCached(keyRef.current);
                        toast.success("Cached search deleted", { id: "cache-del" });
                        setState((s) => (s.kind === "done" ? { ...s, cachedAt: undefined } : s));
                      } catch (e) {
                        toast.error(e instanceof StorageError ? e.message : "Could not delete.", {
                          id: "storage-error",
                        });
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden /> Delete cached search
                  </Button>
                )}
              </div>
            }
          />
        )}
        {state.kind === "idle" && <Skeleton slow={false} onCancel={cancel} />}
      </div>
      <p className="text-muted-foreground mt-8 text-sm">
        Looking for your checklist?{" "}
        <Link className="text-primary hover:underline" href="/saved">
          Saved questions
        </Link>
      </p>
    </div>
  );
}
