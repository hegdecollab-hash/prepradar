import "server-only";
import { modelJsonSchema, modelOutputSchema, type ModelOutput } from "./schema";
import { SYSTEM_PROMPT } from "./prompts";
import type { Citation } from "./verify";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
export const CALL_TIMEOUT_MS = 55_000;

export class UpstreamError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean,
    public status = 502,
  ) {
    super(message);
  }
}

export interface CallResult {
  output: ModelOutput;
  citations: Citation[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
}

export function getConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  const engine = process.env.OPENROUTER_SEARCH_ENGINE?.trim() || undefined;
  if (!apiKey || !model) {
    throw new UpstreamError("config_missing", "Search is not configured on this server yet.", false, 503);
  }
  return { apiKey, model, engine };
}

interface RawAnnotation {
  type?: string;
  url_citation?: { url?: string; title?: string; content?: string };
}

export function parseCompletion(json: unknown): CallResult {
  const j = json as {
    choices?: { finish_reason?: string; message?: { content?: string | null; annotations?: RawAnnotation[] } }[];
    usage?: CallResult["usage"];
    error?: { message?: string };
  };
  const choice = j?.choices?.[0];
  if (!choice?.message) throw new UpstreamError("bad_response", "The model returned no answer. Try again.", true);
  if (choice.finish_reason === "length")
    throw new UpstreamError("truncated", "The model's answer was cut off. Try a narrower topic.", true);
  const content = choice.message.content;
  if (!content || !content.trim()) throw new UpstreamError("bad_response", "The model returned an empty answer.", true);
  let parsed: unknown;
  try {
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new UpstreamError("malformed_output", "The model returned malformed data. Try again.", true);
  }
  let output: ModelOutput;
  try {
    output = modelOutputSchema.validateSync(parsed, { abortEarly: true, stripUnknown: true });
  } catch {
    throw new UpstreamError("schema_violation", "The model's answer did not match the expected format.", true);
  }
  const citations: Citation[] = (choice.message.annotations ?? [])
    .filter((a) => a?.type === "url_citation" && typeof a.url_citation?.url === "string")
    .map((a) => ({
      url: a.url_citation!.url!,
      title: (a.url_citation!.title ?? "").slice(0, 300),
      content: (a.url_citation!.content ?? "").slice(0, 20_000),
    }));
  return { output, citations, usage: j.usage };
}

function mapStatus(status: number): UpstreamError {
  if (status === 401 || status === 403)
    return new UpstreamError("provider_auth", "The search provider rejected this server's credentials.", false, 502);
  if (status === 402)
    return new UpstreamError("insufficient_credits", "The search provider account is out of credits.", false, 502);
  if (status === 429)
    return new UpstreamError("provider_rate_limited", "The search provider is busy. Try again in a minute.", true, 503);
  if (status === 400 || status === 404)
    return new UpstreamError(
      "provider_rejected",
      "The search provider rejected the request (model or settings).",
      false,
      502,
    );
  return new UpstreamError("provider_error", "The search provider had a temporary problem. Try again.", true, 502);
}

async function once(userPrompt: string, signal: AbortSignal): Promise<CallResult> {
  const { apiKey, model, engine } = getConfig();
  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    plugins: [{ id: "web", max_results: 10, ...(engine ? { engine } : {}) }],
    response_format: { type: "json_schema", json_schema: modelJsonSchema },
    provider: { require_parameters: true },
    temperature: 0.1,
    max_tokens: 6000,
  };
  const timeout = AbortSignal.timeout(CALL_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "PrepRadar",
        ...(process.env.NEXT_PUBLIC_APP_URL ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.any([signal, timeout]),
      cache: "no-store",
    });
  } catch {
    if (signal.aborted) throw new UpstreamError("cancelled", "Search cancelled.", false, 499);
    if (timeout.aborted) throw new UpstreamError("timeout", "The search took too long. Try again.", true, 504);
    throw new UpstreamError("network", "Could not reach the search provider.", true, 502);
  }
  if (!res.ok) throw mapStatus(res.status);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new UpstreamError("malformed_output", "The search provider returned unreadable data.", true);
  }
  return parseCompletion(json);
}

/** One OpenRouter call with at most one retry on transient errors. */
export async function callOpenRouter(userPrompt: string, signal: AbortSignal): Promise<CallResult> {
  try {
    return await once(userPrompt, signal);
  } catch (e) {
    if (e instanceof UpstreamError && e.retryable && e.code !== "provider_rate_limited" && !signal.aborted) {
      return once(userPrompt, signal);
    }
    throw e;
  }
}
