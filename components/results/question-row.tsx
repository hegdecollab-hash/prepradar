"use client";

import { LeetCodeIcon } from "./leetcode-icon";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { domainOf } from "@/lib/links";
import type { Difficulty, ResultQuestion } from "@/lib/schema";
import { getSaved, removeSaved, setSolved, StorageError, upsertSaved } from "@/lib/storage";
import { useStorageVersion } from "@/lib/use-storage";
import { cn } from "@/lib/utils";

const diffStyle: Record<Difficulty, string> = {
  Easy: "bg-[#e7f4ec] text-[#1f6a43]",
  Medium: "bg-[#fbf1dc] text-[#7a4f00]",
  Hard: "bg-[#fbe6e4] text-[#9b1c13]",
};

export function DifficultyBadge({ d }: { d?: Difficulty }) {
  if (!d) return null;
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-mono text-[0.75rem] font-medium tracking-wide uppercase",
        diffStyle[d],
      )}
    >
      {d}
    </span>
  );
}

function reportError(e: unknown) {
  toast.error(e instanceof StorageError ? e.message : "Could not update your checklist.", { id: "storage-error" });
}

const actionBtn =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-[0.9375rem] transition-colors hover:bg-muted sm:min-h-9";

export function QuestionRow({ q, topic, companies }: { q: ResultQuestion; topic: string; companies: string[] }) {
  const v = useStorageVersion();
  const saved = useMemo(() => (v < 0 ? undefined : getSaved()[q.key]), [v, q.key]);

  const save = (solved: boolean) =>
    upsertSaved({
      key: q.key,
      title: q.title,
      topic,
      companies,
      difficulty: q.difficulty,
      pattern: q.pattern,
      link: q.link,
      sourceUrls: q.sourceUrls,
      solved,
      savedAt: Date.now(),
    });

  const toggleSave = () => {
    try {
      if (saved) {
        removeSaved(q.key);
        toast.success("Removed from saved", { id: `save-${q.key}` });
      } else {
        save(false);
        toast.success("Saved", { id: `save-${q.key}` });
      }
    } catch (e) {
      reportError(e);
    }
  };
  const toggleSolved = () => {
    try {
      if (!saved) save(true);
      else setSolved(q.key, !saved.solved);
      toast.success(saved?.solved ? "Marked unsolved" : "Marked solved", { id: `solve-${q.key}` });
    } catch (e) {
      reportError(e);
    }
  };

  return (
    <li className="py-4 first:pt-2 last:pb-1">
      <div className="flex flex-wrap items-center gap-2">
        <h4
          className={cn(
            "min-w-0 font-semibold break-words",
            saved?.solved && "text-muted-foreground line-through decoration-1",
          )}
        >
          {q.title}
        </h4>
        <DifficultyBadge d={q.difficulty} />
        {q.pattern && (
          <span className="text-muted-foreground font-mono text-[0.75rem] before:mr-1 before:content-['#']">
            {q.pattern}
          </span>
        )}
        {q.reportedYear && <span className="text-muted-foreground font-mono text-[0.75rem]">{q.reportedYear}</span>}
      </div>
      {companies.length > 1 && <p className="text-muted-foreground mt-1 text-sm">Asked at: {companies.join(", ")}</p>}
      <p className="text-muted-foreground mt-1.5 text-sm">
        Reported at:{" "}
        {q.sourceUrls.map((u, i) => (
          <span key={u}>
            {i > 0 && ", "}
            <a
              href={u}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary break-all underline-offset-4 hover:underline"
            >
              {domainOf(u)}
            </a>
          </span>
        ))}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={q.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[0.9375rem] font-semibold sm:min-h-9"
        >
          <LeetCodeIcon className="size-4" />
          {q.link.kind === "direct" ? "Open on LeetCode" : "Search on LeetCode"}
        </a>
        <button type="button" onClick={toggleSave} aria-pressed={!!saved} className={actionBtn} disabled={v < 0}>
          {saved ? (
            <BookmarkCheck className="text-primary size-4" aria-hidden />
          ) : (
            <Bookmark className="size-4" aria-hidden />
          )}
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={toggleSolved}
          aria-pressed={!!saved?.solved}
          className={cn(actionBtn, saved?.solved && "border-success/40 text-success")}
          disabled={v < 0}
        >
          <Check className="size-4" aria-hidden />
          {saved?.solved ? "Solved" : "Mark solved"}
        </button>
      </div>
    </li>
  );
}
