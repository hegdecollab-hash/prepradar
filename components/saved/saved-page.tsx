"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Check, Download, ExternalLink, Search as SearchIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/results/question-row";
import { PRIVACY_NOTICE } from "@/lib/config";
import { domainOf } from "@/lib/links";
import {
  clearSaved,
  deleteAllData,
  getSaved,
  isStorageAvailable,
  removeSaved,
  setSolved,
  StorageError,
  toCsv,
  type SavedQuestion,
} from "@/lib/storage";
import { useStorageVersion } from "@/lib/use-storage";
import { cn } from "@/lib/utils";

function run(fn: () => void, ok?: string, id?: string) {
  try {
    fn();
    if (ok) toast.success(ok, { id: id ?? ok });
  } catch (e) {
    toast.error(e instanceof StorageError ? e.message : "Could not update browser storage.", { id: "storage-error" });
  }
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SavedPage() {
  const v = useStorageVersion();
  const available = useMemo(() => (v < 0 ? true : isStorageAvailable()), [v]);
  const items = useMemo(() => (v < 0 ? [] : Object.values(getSaved()).sort((a, b) => b.savedAt - a.savedAt)), [v]);
  const [confirm, setConfirm] = useState<"" | "clear" | "all">("");

  const byTopic = useMemo(() => {
    const m = new Map<string, SavedQuestion[]>();
    for (const q of items) {
      const k = q.topic.toLowerCase();
      m.set(k, [...(m.get(k) ?? []), q]);
    }
    return Array.from(m.values());
  }, [items]);

  const solved = items.filter((q) => q.solved).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="kicker text-muted-foreground">Your checklist</p>
      <h1 className="text-hero mt-2 font-[750]">Saved</h1>
      <p className="text-muted-foreground mt-2">{PRIVACY_NOTICE}</p>

      {!available && (
        <p role="alert" className="border-destructive/30 bg-card mt-6 rounded-2xl border p-5">
          Browser storage is unavailable (private mode or blocked), so saved questions can&apos;t be kept on this
          device.
        </p>
      )}

      {v >= 0 && available && items.length === 0 && (
        <div className="bg-card mt-8 rounded-2xl border border-dashed p-10 text-center">
          <p className="font-semibold">No saved questions yet.</p>
          <p className="text-muted-foreground mt-2">Run a search and tap Save on the questions you want to practice.</p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground mt-4 inline-flex min-h-11 items-center rounded-xl px-5 font-semibold"
          >
            Find questions
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="mr-auto font-mono text-[0.875rem]">
              <span className="font-display text-[2rem] font-bold tracking-tight">{solved}</span>
              <span className="text-muted-foreground"> / {items.length} solved</span>
            </p>
            <Button
              variant="outline"
              className="h-11 rounded-xl px-4"
              onClick={() => download("prepradar-checklist.csv", toCsv(items), "text/csv;charset=utf-8")}
            >
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
            <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => setConfirm("clear")}>
              Clear saved list
            </Button>
          </div>
          <div
            className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Overall progress"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={solved}
          >
            <div
              className="bg-primary h-full rounded-full transition-[width]"
              style={{ width: `${(solved / items.length) * 100}%` }}
            />
          </div>

          <div className="mt-8 space-y-6">
            {byTopic.map((group) => {
              const done = group.filter((q) => q.solved).length;
              return (
                <section key={group[0].topic} className="bg-card rounded-2xl border p-4 sm:p-5">
                  <h2 className="flex flex-wrap items-baseline justify-between gap-2 text-[1.25rem] font-semibold capitalize">
                    {group[0].topic}
                    <span className="text-muted-foreground text-sm font-normal normal-case">
                      {done} / {group.length} solved
                    </span>
                  </h2>
                  <ul className="mt-2 divide-y">
                    {group.map((q) => (
                      <li key={q.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 size-5 shrink-0 accent-[#4549b8]"
                            checked={q.solved}
                            onChange={() =>
                              run(
                                () => setSolved(q.key, !q.solved),
                                q.solved ? "Marked unsolved" : "Marked solved",
                                `solve-${q.key}`,
                              )
                            }
                          />
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "font-semibold break-words",
                                q.solved && "text-muted-foreground line-through",
                              )}
                            >
                              {q.title}
                            </span>{" "}
                            <DifficultyBadge d={q.difficulty} />
                            <span className="text-muted-foreground mt-1 block text-sm">
                              {q.companies.join(", ")}
                              {q.sourceUrls[0] && <> · source: {domainOf(q.sourceUrls[0])}</>}
                            </span>
                          </span>
                        </label>
                        <div className="flex gap-2 pl-8 sm:pl-0">
                          <a
                            href={q.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:bg-muted inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[0.9375rem]"
                          >
                            {q.link.kind === "direct" ? (
                              <ExternalLink className="size-4" aria-hidden />
                            ) : (
                              <SearchIcon className="size-4" aria-hidden />
                            )}
                            LeetCode
                          </a>
                          <button
                            type="button"
                            aria-label={`Remove ${q.title}`}
                            className="hover:bg-muted inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border"
                            onClick={() => run(() => removeSaved(q.key), "Removed from saved", `save-${q.key}`)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}

      <section className="bg-card mt-12 rounded-2xl border p-5">
        <h2 className="font-semibold">Data on this device</h2>
        <p className="text-muted-foreground mt-1">
          Removes cached searches, saved questions, solved status and recent topics from this browser.
        </p>
        <Button
          variant="destructive"
          className="mt-4 h-11 rounded-xl px-4"
          onClick={() => setConfirm("all")}
          disabled={!available}
        >
          Delete all data on this device
        </Button>
      </section>

      {confirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4"
        >
          <div className="bg-card w-full max-w-sm rounded-2xl border p-6 shadow-lg">
            <h2 id="confirm-title" className="font-semibold">
              {confirm === "all" ? "Delete all data on this device?" : "Clear your saved list?"}
            </h2>
            <p className="text-muted-foreground mt-2">This can&apos;t be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="h-11 rounded-xl px-4" autoFocus onClick={() => setConfirm("")}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="h-11 rounded-xl px-4"
                onClick={() => {
                  run(
                    confirm === "all" ? deleteAllData : clearSaved,
                    confirm === "all" ? "All data deleted" : "Saved list cleared",
                  );
                  setConfirm("");
                }}
              >
                <Check className="size-4" aria-hidden /> Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
