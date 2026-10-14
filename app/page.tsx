import Link from "next/link";
import { SearchForm } from "@/components/search/search-form";
import { FadeIn } from "@/components/landing/fade-in";
import { PRIVACY_NOTICE } from "@/lib/config";

const steps = [
  { t: "Enter a topic", d: "Type a DSA topic, like sliding window. Add a company to narrow the results." },
  {
    t: "Search the live web",
    d: "PrepRadar asks a web-search model, via OpenRouter, for interview reports and prep lists on that topic.",
  },
  {
    t: "Check the evidence",
    d: "Every question links to its source and to LeetCode. Questions without a source are removed.",
  },
  { t: "Track your prep", d: "Save questions to a checklist in this browser and mark them solved as you practice." },
];

const faqs = [
  {
    q: "Where does the data come from?",
    a: "Each search runs a live web search through OpenRouter. The model may only report questions that appear in the returned search results, and every question links to the page it came from. Nothing comes from a private database.",
  },
  {
    q: "How accurate is it?",
    a: "Interview reports are anecdotal and can be out of date, so verify questions before you rely on them. We drop questions that are not tied to a cited source, and confidence tags reflect how many questions and distinct sources back each company.",
  },
  {
    q: "Why do some links open a LeetCode search?",
    a: "We only link directly to a LeetCode problem when the problem's slug or exact title appears in the cited sources. Otherwise we open a LeetCode search for the title, so you never land on a guessed problem.",
  },
  {
    q: "What is stored in my browser?",
    a: PRIVACY_NOTICE + " Cached searches expire after 7 days. You can delete everything from the Saved page.",
  },
  {
    q: "What about LeetCode Premium company tags?",
    a: "PrepRadar does not use or reproduce LeetCode Premium company tags. It only reads public pages returned by web search. If you have Premium, its company lists are a useful cross-check.",
  },
  {
    q: "Does it cost anything? Are there limits?",
    a: "Each search makes one or two paid model calls with web search on the app owner's OpenRouter account, so searches are rate limited per visitor and identical searches are cached in your browser for 7 days. Use Refresh results only when you need fresh data.",
  },
];

export default function Home() {
  return (
    <div>
      <section id="find" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <FadeIn className="lg:pt-6">
            <p className="kicker text-primary">DSA interview research · live web</p>
            <h1 className="text-hero mt-5 font-[750] text-balance">
              See what companies <span className="text-primary">actually</span> ask.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-md text-[1.125rem] leading-relaxed text-pretty">
              Search any DSA topic to see which companies ask it, the questions candidates reported, and a LeetCode
              link for each.
            </p>
            <dl className="mt-10 hidden max-w-md grid-cols-3 gap-6 border-t pt-5 lg:grid">
              {[
                ["Sources", "on every question"],
                ["Links", "direct or search"],
                ["Storage", "this browser only"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="kicker text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-[0.9375rem]">{v}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>
          <div>
            <div className="bg-card rounded-2xl border p-4 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(31,31,35,0.12)] sm:p-6">
              <SearchForm prefillFromUrl />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              Searches run through OpenRouter. Your progress stays in this browser.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <FadeIn className="lg:col-span-5">
            <p className="kicker text-muted-foreground">01 · The problem</p>
            <p className="font-display mt-4 text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.1] font-semibold tracking-tight text-balance">
              DSA prep is blind.
            </p>
            <p className="text-muted-foreground mt-4 max-w-md">
              You grind hundreds of problems without knowing which companies ask about a topic, or which questions
              candidates actually reported.
            </p>
          </FadeIn>
          <FadeIn className="lg:col-span-6 lg:col-start-7 lg:pt-24">
            <p className="kicker text-muted-foreground">02 · The approach</p>
            <p className="font-display mt-4 text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.1] font-semibold tracking-tight text-balance">
              One topic. Real reports. <span className="text-primary">Receipts</span> on every question.
            </p>
            <p className="text-muted-foreground mt-4 max-w-md">
              PrepRadar searches public interview reports for one topic at a time, groups questions by company, and
              shows the source behind every question so you can judge it yourself.
            </p>
          </FadeIn>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:pb-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker text-muted-foreground">03</p>
            <h2 className="text-section mt-3 font-semibold lg:sticky lg:top-24">How it works</h2>
          </div>
          <ol className="lg:col-span-8">
            {steps.map((s, i) => (
              <li
                key={s.t}
                className="grid grid-cols-[3.5rem_1fr] gap-4 border-t py-6 last:border-b sm:grid-cols-[5rem_1fr]"
              >
                <span className="text-primary font-mono text-[0.875rem]">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[1.25rem] font-semibold">{s.t}</h3>
                  <p className="text-muted-foreground mt-1.5 max-w-xl">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-4">
            <p className="kicker text-background/60">04</p>
            <h2 className="text-section mt-3 font-semibold">Questions people ask</h2>
          </div>
          <div className="divide-background/15 border-background/15 divide-y border-y lg:col-span-8">
            {faqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[1.0625rem] font-semibold">
                  {f.q}
                  <span className="text-background/60 font-mono text-sm group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="text-background/75 max-w-2xl pb-6">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-hero max-w-3xl font-[750] text-balance">Pick a topic. Start practicing.</h2>
          <Link
            href="/#find"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-12 items-center rounded-xl px-6 font-semibold"
          >
            Find questions
          </Link>
        </div>
        <p className="text-muted-foreground mt-4">One topic. Real sources. A checklist you control.</p>
      </section>
    </div>
  );
}
