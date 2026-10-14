import Link from "next/link";
import { SearchForm } from "@/components/search/search-form";
import { ResultsView } from "@/components/results/results-view";
import { FadeIn } from "@/components/landing/fade-in";
import { PRIVACY_NOTICE } from "@/lib/config";
import { SAMPLE_RESULT } from "@/lib/sample";

const steps = [
  { t: "Enter a topic", d: "Type a DSA topic like sliding window. Add a company if you want to narrow it down." },
  {
    t: "We search the live web",
    d: "The app asks a web-search-enabled model, through OpenRouter, for interview reports and prep lists on that topic.",
  },
  {
    t: "Check the evidence",
    d: "Every question shows the source it came from and a LeetCode link. Unsourced questions are dropped.",
  },
  { t: "Track your prep", d: "Save questions to a checklist in this browser and mark them solved as you go." },
];

const faqs = [
  {
    q: "Where does the data come from?",
    a: "Each search runs a live web search through OpenRouter. The model may only report questions that appear in the returned search results, and every question links to the page it came from. Nothing comes from a private database.",
  },
  {
    q: "How accurate is it?",
    a: "Questions reported by candidates and prep sources. Verify before relying on them. Interview reports are anecdotal and can be outdated. We drop questions that are not tied to a cited source, and confidence tags reflect how many questions and distinct sources back each company.",
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
      <section id="find" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <FadeIn>
          <h1 className="text-hero font-semibold tracking-tight text-balance">Know what companies actually ask.</h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-pretty">
            Enter a DSA topic. See which companies asked about it, the questions reported, and a LeetCode link for each.
          </p>
        </FadeIn>
        <div className="bg-card mt-8 rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.04)] sm:p-6">
          <SearchForm />
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          <Link
            href="#example"
            className="text-primary inline-flex min-h-11 items-center font-semibold hover:underline"
          >
            See an example
          </Link>
          {" · "}Searches are sent to OpenRouter. Saved progress stays in this browser.
        </p>
      </section>

      <section id="example" className="scroll-mt-20 border-y bg-[#f6f5f1] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <p className="border-gold/50 inline-flex rounded-full border bg-[#fffdf9] px-3 py-1 text-sm font-semibold">
              Sample preview · static, not a live result
            </p>
            <h2 className="text-section mt-4 font-semibold">What a result looks like</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Placeholder companies and sources, so you can see the layout before you search.
            </p>
          </FadeIn>
          <div className="mt-8">
            <ResultsView result={SAMPLE_RESULT} sample />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <FadeIn>
          <h2 className="text-section font-semibold">The problem</h2>
          <p className="text-muted-foreground mt-3">
            DSA prep is blind. You grind hundreds of problems without knowing which companies ask about a topic, or
            which questions candidates actually reported.
          </p>
        </FadeIn>
        <FadeIn>
          <h2 className="text-section font-semibold">The approach</h2>
          <p className="text-muted-foreground mt-3">
            PrepRadar searches public interview reports for one topic at a time, groups questions by company, and shows
            the source behind every question so you can judge it yourself.
          </p>
        </FadeIn>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-section font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="bg-card rounded-2xl border p-5">
              <span className="text-primary text-sm font-semibold">Step {i + 1}</span>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="text-muted-foreground mt-2">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-section font-semibold">FAQs</h2>
        <div className="bg-card mt-6 divide-y rounded-2xl border">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex min-h-14 cursor-pointer items-center font-semibold">{f.q}</summary>
              <p className="text-muted-foreground pb-5">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-4 pb-20 text-center sm:px-6">
        <h2 className="text-section font-semibold">Pick a topic and start.</h2>
        <p className="text-muted-foreground mt-2">One topic, real sources, a checklist you control.</p>
        <Link
          href="/#find"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex min-h-12 items-center rounded-xl px-6 font-semibold"
        >
          Find questions
        </Link>
      </section>
    </div>
  );
}
