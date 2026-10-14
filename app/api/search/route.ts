import { NextResponse, type NextRequest } from "next/server";
import { ValidationError } from "yup";
import { callOpenRouter, getConfig, UpstreamError, type CallResult } from "@/lib/openrouter";
import { buildFollowupPrompt, buildUserPrompt } from "@/lib/prompts";
import { rateLimit } from "@/lib/ratelimit";
import { apiInputSchema, normalizeSpaces, type ApiError, type DifficultyFilter } from "@/lib/schema";
import { looksLikeDsaTopic } from "@/lib/topic";
import { verifyResult } from "@/lib/verify";

// Node.js runtime is the default (the `runtime` segment option is incompatible with cacheComponents).
export const maxDuration = 120;

const MAX_BODY = 2048;
const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function err(status: number, code: string, message: string, retryable: boolean, requestId: string) {
  const body: ApiError = { code, message, retryable, requestId };
  return NextResponse.json(body, { status, headers: HEADERS });
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function log(entry: Record<string, unknown>) {
  console.info(JSON.stringify({ op: "search", ...entry }));
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  let requestId = "unknown";
  if (!sameOrigin(req)) return err(403, "forbidden_origin", "Requests must come from this site.", false, requestId);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return err(413, "body_too_large", "Request is too large.", false, requestId);
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return err(400, "invalid_json", "Request body must be JSON.", false, requestId);
  }
  if (data && typeof data === "object" && typeof (data as { requestId?: unknown }).requestId === "string") {
    requestId = String((data as { requestId: string }).requestId).slice(0, 64);
  }
  let input: { topic: string; company?: string; difficulty: DifficultyFilter; requestId: string };
  try {
    input = (await apiInputSchema.validate(data, { abortEarly: true })) as typeof input;
  } catch (e) {
    const msg = e instanceof ValidationError ? e.message : "Invalid request.";
    return err(400, "invalid_input", msg, false, requestId);
  }
  requestId = input.requestId;

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!rateLimit(ip))
    return err(429, "rate_limited", "Too many searches. Wait a few minutes and try again.", true, requestId);

  let model = "";
  try {
    model = getConfig().model;
  } catch (e) {
    const u = e as UpstreamError;
    return err(u.status, u.code, u.message, u.retryable, requestId);
  }

  const topic = normalizeSpaces(input.topic);
  const company = input.company ? normalizeSpaces(input.company) : null;
  const difficulty = input.difficulty ?? "Any";

  if (!looksLikeDsaTopic(topic)) {
    log({ requestId, status: 200, ms: Date.now() - started, model, calls: 0, note: "non_dsa_topic" });
    const body = {
      topic,
      company,
      difficulty,
      searchedAt: new Date().toISOString(),
      model,
      isDsaTopic: false,
      companies: [],
      sources: [],
    };
    return NextResponse.json(body, { headers: HEADERS });
  }

  try {
    const calls: CallResult[] = [];
    calls.push(await callOpenRouter(buildUserPrompt(topic, company, difficulty), req.signal));
    // Optional 2nd call (hard cap 2): company named but first pass returned little for it.
    if (company && calls[0].output.isDsaTopic) {
      const first = verifyResult({
        output: calls[0].output,
        citations: calls[0].citations,
        topic,
        company,
        difficulty,
        model,
      });
      const forCompany = first.companies.find((c) => c.name.toLowerCase().includes(company.toLowerCase()));
      if (!forCompany || forCompany.questions.length < 3) {
        try {
          calls.push(await callOpenRouter(buildFollowupPrompt(topic, company), req.signal));
        } catch (e) {
          if (e instanceof UpstreamError && e.code === "cancelled") throw e;
          // Keep first-pass results if the follow-up fails.
        }
      }
    }
    const merged = {
      isDsaTopic: calls[0].output.isDsaTopic,
      notes:
        calls
          .map((c) => c.output.notes)
          .filter(Boolean)
          .join(" ") || null,
      companies: calls.flatMap((c) => c.output.companies),
    };
    let result = verifyResult({
      output: merged,
      citations: calls.flatMap((c) => c.citations),
      topic,
      company,
      difficulty,
      model,
    });
    if (company) {
      const want = company.toLowerCase();
      result = {
        ...result,
        companies: result.companies.filter(
          (c) => c.name.toLowerCase().includes(want) || want.includes(c.name.toLowerCase()),
        ),
      };
      const used = new Set(result.companies.flatMap((c) => c.questions.flatMap((q) => q.sourceUrls)));
      result.sources = result.sources.filter((s) => used.has(s.url));
    }
    log({
      requestId,
      status: 200,
      ms: Date.now() - started,
      model,
      calls: calls.length,
      usage: calls.map((c) => ({ tokens: c.usage?.total_tokens ?? null, cost: c.usage?.cost ?? null })),
    });
    return NextResponse.json(result, { headers: HEADERS });
  } catch (e) {
    const u =
      e instanceof UpstreamError ? e : new UpstreamError("internal", "Something went wrong on our side.", true, 500);
    log({ requestId, status: u.status, code: u.code, ms: Date.now() - started, model });
    return err(u.status, u.code, u.message, u.retryable, requestId);
  }
}
