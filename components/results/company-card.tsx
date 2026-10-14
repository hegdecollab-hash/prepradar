"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { Confidence, ResultQuestion } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { QuestionRow } from "./question-row";

const confStyle: Record<Confidence, string> = {
  High: "bg-accent text-accent-foreground",
  Medium: "bg-[#fbf1dc] text-[#7a4f00]",
  Low: "bg-muted text-muted-foreground",
};

export function ConfidenceTag({ c }: { c: Confidence }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-mono text-[0.75rem] font-medium tracking-wide uppercase",
        confStyle[c],
      )}
      title="Based on the number of questions and distinct source sites"
    >
      {c} confidence
    </span>
  );
}

export function GroupCard({
  title,
  leading,
  showCompanies = false,
  meta,
  questions,
  topic,
  companiesFor,
  defaultOpen = true,
}: {
  title: string;
  leading?: React.ReactNode;
  showCompanies?: boolean;
  meta?: React.ReactNode;
  questions: ResultQuestion[];
  topic: string;
  companiesFor: (q: ResultQuestion) => string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <section className="bg-card rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-3 text-left sm:px-5"
        >
          {leading}
          <span className="font-display min-w-[9rem] flex-1 text-[1.125rem] font-semibold tracking-tight break-words">
            {title}
          </span>
          <span className="text-muted-foreground font-mono text-[0.75rem]">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </span>
          {meta}
          <ChevronDown
            className={cn("text-muted-foreground size-5 shrink-0 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ul className="divide-y border-t px-4 sm:px-5">
              {questions.map((q) => (
                <QuestionRow
                  key={q.key}
                  q={q}
                  topic={topic}
                  companies={companiesFor(q)}
                  showCompanies={showCompanies}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
