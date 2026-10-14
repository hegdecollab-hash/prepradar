import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseCompletion, UpstreamError } from "@/lib/openrouter";
import { POST } from "@/app/api/search/route";
import { NextRequest } from "next/server";

const goodContent = JSON.stringify({
  isDsaTopic: true,
  notes: null,
  companies: [
    {
      name: "Google",
      questions: [
        {
          title: "Minimum Window Substring",
          leetcodeSlug: "minimum-window-substring",
          difficulty: "Hard",
          pattern: "Variable window",
          sourceUrls: ["https://leetcode.com/discuss/1"],
          reportedYear: 2025,
        },
      ],
    },
  ],
});
const completion = (content: string, finish = "stop") => ({
  choices: [
    {
      finish_reason: finish,
      message: {
        content,
        annotations: [
          {
            type: "url_citation",
            url_citation: {
              url: "https://leetcode.com/discuss/1",
              title: "Google exp",
              content: "minimum window substring",
            },
          },
        ],
      },
    },
  ],
  usage: { total_tokens: 10 },
});

describe("parseCompletion", () => {
  it("parses content and citations", () => {
    const r = parseCompletion(completion(goodContent));
    expect(r.citations).toHaveLength(1);
    expect(r.output.companies[0].name).toBe("Google");
  });
  it("rejects malformed, truncated, empty and schema-violating output", () => {
    const code = (j: unknown) => {
      try {
        parseCompletion(j);
      } catch (e) {
        return (e as UpstreamError).code;
      }
    };
    expect(code(completion("{not json"))).toBe("malformed_output");
    expect(code(completion(goodContent, "length"))).toBe("truncated");
    expect(code({ choices: [] })).toBe("bad_response");
    expect(code(completion(JSON.stringify({ companies: "x" })))).toBe("schema_violation");
  });
});

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3001/api/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3001",
      host: "localhost:3001",
      "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const valid = { topic: "sliding window", requestId: "req-12345678" };

describe("POST /api/search", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test/model";
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects cross-origin, oversize and invalid input without calling the provider", async () => {
    expect((await POST(req(valid, { origin: "https://evil.com" }))).status).toBe(403);
    expect((await POST(req({ ...valid, topic: "x".repeat(3000) }))).status).toBe(413);
    expect((await POST(req("{oops"))).status).toBe(400);
    const r = await POST(req({ topic: " ", requestId: "req-12345678" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ code: "invalid_input", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports missing config", async () => {
    delete process.env.OPENROUTER_MODEL;
    const r = await POST(req(valid));
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe("config_missing");
  });

  it("returns verified results with no-store and sends web plugin + key only server-side", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(completion(goodContent)), { status: 200 }));
    const r = await POST(req(valid));
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const body = await r.json();
    expect(body.companies[0].questions[0].link.kind).toBe("direct");
    expect(JSON.stringify(body)).not.toContain("test-key");
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.plugins[0].id).toBe("web");
    expect(sent.model).toBe("test/model");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "provider_auth"],
    [402, "insufficient_credits"],
    [429, "provider_rate_limited"],
  ])("maps provider %i to %s without retry", async (status, code) => {
    fetchMock.mockResolvedValue(new Response("{}", { status }));
    const r = await POST(req(valid));
    expect((await r.json()).code).toBe(code);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx once then fails honestly", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
    const r = await POST(req(valid));
    expect(await r.json()).toMatchObject({ code: "provider_error", retryable: true, requestId: "req-12345678" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps at 2 provider calls when a company is named", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify(completion(JSON.stringify({ isDsaTopic: true, notes: null, companies: [] }))), {
          status: 200,
        }),
    );
    const r = await POST(req({ ...valid, company: "Google" }));
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("non-DSA topic", () => {
  it("returns isDsaTopic false without a paid call", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    process.env.OPENROUTER_API_KEY = "k";
    process.env.OPENROUTER_MODEL = "m";
    const r = await POST(req({ topic: "cooking", requestId: "req-87654321" }));
    expect(await r.json()).toMatchObject({ isDsaTopic: false, companies: [] });
    expect(f).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
