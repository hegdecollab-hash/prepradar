"use client";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DISCLAIMER } from "@/lib/config";
import { domainOf } from "@/lib/links";
import { matches, questionIndex, type Filters } from "@/lib/group";
import { DIFFICULTIES, type SearchResult } from "@/lib/schema";
import { getSaved } from "@/lib/storage";
import { useStorageVersion } from "@/lib/use-storage";
import { cn } from "@/lib/utils";
import { ConfidenceTag, GroupCard } from "./company-card";
import { CompanyLogo } from "@/components/company-logo";

const selectCls =
  "h-11 w-full rounded-xl border bg-card px-3 outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15";

function FilterControls({
  result,
  f,
  setF,
  idp,
}: {
  result: SearchResult;
  f: Filters;
  setF: (f: Filters) => void;
  idp: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idp}-company`} className="mb-1.5 block font-semibold">
          Company
        </label>
        <select
          id={`${idp}-company`}
          className={selectCls}
          value={f.company}
          onChange={(e) => setF({ ...f, company: e.target.value })}
        >
          <option value="">All companies</option>
          {result.companies.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idp}-difficulty`} className="mb-1.5 block font-semibold">
          Difficulty
        </label>
        <select
          id={`${idp}-difficulty`}
          className={selectCls}
          value={f.difficulty}
          onChange={(e) => setF({ ...f, difficulty: e.target.value as Filters["difficulty"] })}
        >
          {["Any", ...DIFFICULTIES].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idp}-status`} className="mb-1.5 block font-semibold">
          Status
        </label>
        <select
          id={`${idp}-status`}
          className={selectCls}
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value as Filters["status"] })}
        >
          <option value="all">All questions</option>
          <option value="saved">Saved</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Not solved</option>
        </select>
      </div>
      <button
        type="button"
        className="text-primary min-h-11 underline-offset-4 hover:underline"
        onClick={() => setF({ company: "", difficulty: "Any", status: "all" })}
      >
        Reset filters
      </button>
    </div>
  );
}

export function ResultsView({
  result,
  actions,
  sample = false,
}: {
  result: SearchResult;
  actions?: React.ReactNode;
  sample?: boolean;
}) {
  const [f, setF] = useState<Filters>({ company: "", difficulty: "Any", status: "all" });
  const [mode, setMode] = useState<"company" | "question">("company");
  const v = useStorageVersion();
  const saved = useMemo(() => (v < 0 ? {} : getSaved()), [v]);
  const index = useMemo(() => questionIndex(result), [result]);
  const totalQ = index.size;

  const companies = result.companies
    .filter((c) => !f.company || c.name === f.company)
    .map((c) => ({ ...c, questions: c.questions.filter((q) => matches(q, f, saved)) }))
    .filter((c) => c.questions.length);
  const questions = Array.from(index.values())
    .filter((e) => (!f.company || e.companies.includes(f.company)) && matches(e.q, f, saved))
    .sort((a, b) => b.companies.length - a.companies.length);
  const anyFilter = f.company || f.difficulty !== "Any" || f.status !== "all";
  const shown = mode === "company" ? companies.length : questions.length;

  const searched = new Date(result.searchedAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-muted-foreground font-mono text-[0.8125rem] leading-relaxed">
          <span className="font-display text-foreground text-[1.0625rem] font-semibold tracking-tight">
            {result.topic}
          </span>
          {result.company && (
            <>
              {" "}
              at <span className="text-foreground font-semibold">{result.company}</span>
            </>
          )}
          {" · "}
          {result.companies.length} {result.companies.length === 1 ? "company" : "companies"} · {totalQ} question
          {totalQ === 1 ? "" : "s"} · {sample ? "sample data" : `searched ${searched}`} · {result.model}
        </p>
        <p className="border-gold/40 rounded-xl border bg-[#fffdf9] px-4 py-3 text-[0.9375rem]">{DISCLAIMER}</p>
        {result.notes && <p className="text-muted-foreground text-[0.9375rem]">Note from search: {result.notes}</p>}
        {actions}
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="bg-card sticky top-24 rounded-2xl border p-5">
            <FilterControls result={result} f={f} setF={setF} idp="d" />
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Group results" className="bg-card inline-flex rounded-xl border p-1">
              {(["company", "question"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-10 rounded-lg px-3 text-[0.9375rem]",
                    mode === m
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  By {m}
                </button>
              ))}
            </div>
            <Sheet>
              <SheetTrigger className="bg-card inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 lg:hidden">
                <SlidersHorizontal className="size-4" aria-hidden /> Filters{anyFilter ? " (on)" : ""}
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <SheetHeader className="px-0">
                  <SheetTitle>Filter results</SheetTitle>
                </SheetHeader>
                <FilterControls result={result} f={f} setF={setF} idp="m" />
              </SheetContent>
            </Sheet>
          </div>

          {shown === 0 && anyFilter && (
            <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
              <p className="font-semibold">No questions match these filters.</p>
              <button
                type="button"
                className="text-primary mt-2 min-h-11 hover:underline"
                onClick={() => setF({ company: "", difficulty: "Any", status: "all" })}
              >
                Reset filters
              </button>
            </div>
          )}

          {mode === "company"
            ? companies.map((c, i) => (
                <GroupCard
                  key={c.name}
                  title={c.name}
                  leading={<CompanyLogo name={c.name} />}
                  meta={<ConfidenceTag c={c.confidence} />}
                  questions={c.questions}
                  topic={result.topic}
                  companiesFor={(q) => index.get(q.key)?.companies ?? [c.name]}
                  defaultOpen={i < 3}
                />
              ))
            : questions.map((e) => (
                <GroupCard
                  key={e.q.key}
                  title={e.q.title}
                  questions={[e.q]}
                  topic={result.topic}
                  companiesFor={() => e.companies}
                  showCompanies
                />
              ))}

          {result.sources.length > 0 && (
            <details className="bg-card rounded-2xl border p-4 sm:p-5">
              <summary className="min-h-11 cursor-pointer content-center font-semibold">
                All cited sources ({result.sources.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {result.sources.map((s) => (
                  <li key={s.url} className="text-[0.9375rem] break-words">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-primary hover:underline"
                    >
                      {s.title || domainOf(s.url)}
                    </a>{" "}
                    <span className="text-muted-foreground">({domainOf(s.url)})</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
