# PrepRadar

Company-wise DSA interview questions finder. Enter a DSA topic (optionally a company), the app runs a live web search through OpenRouter, and shows which companies were reported to ask about it, the questions, a LeetCode link for each, and the source behind every question. Save questions to a checklist and track what you solved, all in your browser.

> Questions reported by candidates and prep sources. Verify before relying on them.

## Stack

Next.js 16.4.1 (App Router, Cache Components), strict TypeScript, Tailwind CSS v4, shadcn/ui (Base UI primitives), Formik + Yup, Motion, react-hot-toast, Vitest, Prettier, ESLint. No database, no auth.

## Run locally

```bash
npm ci
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3001
# or production
npm run build && npm run start   # http://localhost:3001
```

Checks: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. CI (`.github/workflows/ci.yml`) runs the same on pushes/PRs to `main`/`develop`.

## Environment

| Variable                   | Required    | Notes                                                                                                                                    |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`       | yes         | Server-only. Never prefix with `NEXT_PUBLIC_`.                                                                                           |
| `OPENROUTER_MODEL`         | yes         | e.g. `openai/gpt-4.1-mini` (used in development). The app never switches models on its own.                                              |
| `OPENROUTER_SEARCH_ENGINE` | no          | `exa` (default here), `native`, `parallel`, `perplexity`. Omitted = OpenRouter's default (native for OpenAI/Google/Anthropic, else Exa). |
| `NEXT_PUBLIC_APP_URL`      | yes in prod | Absolute URL for metadata, sitemap, robots.                                                                                              |
| `NEXT_PUBLIC_APP_NAME`     | no          | Defaults to `PrepRadar`.                                                                                                                 |

## Model and search approach

- **Model:** `openai/gpt-4.1-mini` (verified listed on `https://openrouter.ai/api/v1/models` on 2026-10-15; supports `response_format` + `structured_outputs`; ~$0.40/M input, $1.60/M output tokens).
- **Search:** the OpenRouter **`web` plugin** with `engine: "exa"`, `max_results: 10`. We chose Exa because its `url_citation` annotations include page excerpts (`content`), which the server uses to verify LeetCode slugs. We do **not** also use the `openrouter:web_search` server tool (one approach only).
- **Structured output:** `response_format: json_schema` (strict) with `provider.require_parameters: true`. Verified working together with the web plugin on this model. The server still validates every response with Yup.
- **Calls per search:** 1, plus at most 1 follow-up when a company is named and the first call returned fewer than 3 questions for it (hard cap 2). One retry on transient errors (5xx/timeout/malformed output); 401/402/429 are not retried.
- **Timeouts:** 55 s per provider call; route `maxDuration = 120`.

### Cost

Web search costs money even with cheap models. Exa auto mode is $0.007 per request (up to 10 results) plus token usage. Observed in testing: about **$0.009 per search call** (~4k tokens). A company search can be 2 calls. **Set a spend cap on your OpenRouter key.**

## Server-side verification (the model is not trusted)

- Questions whose `sourceUrls` are not in the returned `url_citation` list are dropped. Companies without remaining questions are dropped.
- LeetCode: a direct `https://leetcode.com/problems/<slug>/` link only when the slug matches `^[a-z0-9-]+$` **and** either the slug appears in the cited sources (URL/title/excerpt), or the slug equals the normalized title and that title appears in the sources. Otherwise a `problemset/?search=<title>` link labeled "Search on LeetCode". The app never fetches LeetCode, so direct links are not verified live.
- Confidence (High/Medium/Low) is computed on the server from question count and distinct source domains, not from the model.
- Dedup by normalized title; caps of 12 companies / 15 questions per company.
- Non-DSA topics: a deterministic vocabulary pre-check (`lib/topic.ts`) returns the "That doesn't look like a DSA topic" state without any paid call. This was added because in testing the model labeled "cooking" as a DSA topic and returned food-ordering system-design questions. The heuristic may reject unusual DSA phrasings; extend the term list as needed. The model's own `isDsaTopic` flag is still honored.

## API

`POST /api/search` with `{ topic, company?, difficulty?, requestId }` → `{ topic, company, difficulty, searchedAt, model, isDsaTopic, companies[], sources[], notes? }`. Errors: `{ code, message, retryable, requestId }`. Responses use `Cache-Control: no-store`.

Abuse protection: same-origin (Origin vs Host) check, 2 KB body cap, strict schema validation (unknown fields rejected), and a best-effort **in-memory** per-IP limiter (10 searches / 10 min). The limiter is per server instance and resets on restart; on serverless it is **not durable and not a security guarantee**. Client-side: one in-flight request per search key, disabled duplicate submits, 7-day browser cache with a visible "Refresh results" button.

Logs contain only request ID, operation, duration, status, model, and token/cost usage.

## Privacy

Your saved questions and progress are stored only in this browser. When you search, your topic and optional company are sent through this app's server route to OpenRouter and the selected model and search providers. We do not store them on our server.

Stored in `localStorage` (keys `prepradar:v1:*`): cached search results (7 days), saved questions, solved status, recent topics. Delete one cached search from the results page, or everything from **Saved → Delete all data on this device**. Search queries are not private.

## Deployment (Vercel)

Import the repo, set the env vars above, deploy. The search route runs on the Node.js runtime (default; the `runtime` segment option is not allowed with `cacheComponents`). Plans with a function limit under 120 s will cap `maxDuration` lower.

## Structure

`app/` routes (`/`, `/search`, `/saved`, `/api/search`), `components/` (ui, search, results, saved, landing), `lib/` (`openrouter.ts` server-only, `prompts.ts`, `schema.ts`, `verify.ts`, `links.ts`, `storage.ts`, `topic.ts`, `ratelimit.ts`), `tests/`.
