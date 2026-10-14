"use client";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, type FieldProps } from "formik";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_CHIPS, TOPIC_CHIPS } from "@/lib/config";
import { DIFFICULTIES, normalizeSpaces, searchFormSchema, type DifficultyFilter } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface Values {
  topic: string;
  company: string;
  difficulty: DifficultyFilter;
}

export function buildSearchHref(v: Values) {
  const p = new URLSearchParams({ topic: normalizeSpaces(v.topic) });
  if (v.company.trim()) p.set("company", normalizeSpaces(v.company));
  if (v.difficulty !== "Any") p.set("difficulty", v.difficulty);
  return `/search?${p.toString()}`;
}

const chip =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-[0.9375rem] transition-colors hover:border-primary/50 hover:text-primary sm:min-h-9 sm:px-3";

export function SearchForm({ initial, compact = false }: { initial?: Partial<Values>; compact?: boolean }) {
  const router = useRouter();
  return (
    <Formik<Values>
      initialValues={{
        topic: initial?.topic ?? "",
        company: initial?.company ?? "",
        difficulty: initial?.difficulty ?? "Any",
      }}
      validationSchema={searchFormSchema}
      onSubmit={(v, { setSubmitting }) => {
        router.push(buildSearchHref(v));
        setSubmitting(false);
      }}
      enableReinitialize
    >
      {({ values, setFieldValue, errors, touched, isSubmitting }) => (
        <Form noValidate className="w-full space-y-5" aria-label="Search DSA questions">
          <Field name="topic">
            {({ field }: FieldProps) => (
              <div>
                <label htmlFor="topic" className="mb-2 block font-semibold">
                  DSA topic
                </label>
                <div className="relative">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                    aria-hidden
                  />
                  <input
                    {...field}
                    id="topic"
                    autoComplete="off"
                    maxLength={120}
                    placeholder="e.g. sliding window"
                    aria-invalid={!!(touched.topic && errors.topic)}
                    aria-describedby={touched.topic && errors.topic ? "topic-error" : undefined}
                    className={cn(
                      "bg-card placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-primary/15 h-14 w-full rounded-xl border pr-4 pl-12 text-[1.0625rem] shadow-sm transition-shadow outline-none focus-visible:ring-4",
                      touched.topic && errors.topic && "border-destructive",
                    )}
                  />
                </div>
                {touched.topic && errors.topic && (
                  <p id="topic-error" role="alert" className="text-destructive mt-2">
                    {errors.topic}
                  </p>
                )}
                {!compact && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Topic suggestions">
                    {TOPIC_CHIPS.map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          aria-pressed={values.topic.toLowerCase() === t.toLowerCase()}
                          onClick={() => setFieldValue("topic", t)}
                          className={cn(
                            chip,
                            values.topic.toLowerCase() === t.toLowerCase()
                              ? "border-primary bg-accent text-accent-foreground"
                              : "bg-card",
                          )}
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field name="company">
              {({ field }: FieldProps) => (
                <div>
                  <label htmlFor="company" className="mb-2 block font-semibold">
                    Company <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    {...field}
                    id="company"
                    list="company-suggestions"
                    autoComplete="off"
                    maxLength={80}
                    placeholder="Any company"
                    aria-invalid={!!(touched.company && errors.company)}
                    aria-describedby={touched.company && errors.company ? "company-error" : undefined}
                    className="bg-card focus-visible:border-primary focus-visible:ring-primary/15 h-12 w-full rounded-xl border px-4 outline-none focus-visible:ring-4"
                  />
                  <datalist id="company-suggestions">
                    {COMPANY_CHIPS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {touched.company && errors.company && (
                    <p id="company-error" role="alert" className="text-destructive mt-2">
                      {errors.company}
                    </p>
                  )}
                </div>
              )}
            </Field>
            <div>
              <label htmlFor="difficulty" className="mb-2 block font-semibold">
                Difficulty
              </label>
              <Field
                as="select"
                id="difficulty"
                name="difficulty"
                className="bg-card focus-visible:border-primary focus-visible:ring-primary/15 h-12 w-full rounded-xl border px-4 outline-none focus-visible:ring-4 sm:w-40"
              >
                {["Any", ...DIFFICULTIES].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Field>
            </div>
          </div>
          {!compact && (
            <ul className="-mt-2 flex flex-wrap gap-2" aria-label="Company suggestions">
              {COMPANY_CHIPS.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    aria-pressed={values.company === c}
                    onClick={() => setFieldValue("company", values.company === c ? "" : c)}
                    className={cn(
                      chip,
                      values.company === c ? "border-primary bg-accent text-accent-foreground" : "bg-card",
                    )}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl px-6 text-base font-semibold sm:w-auto"
          >
            Find questions
          </Button>
        </Form>
      )}
    </Formik>
  );
}
