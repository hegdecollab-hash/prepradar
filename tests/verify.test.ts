import { describe, expect, it } from "vitest";
import { verifyResult, computeConfidence } from "@/lib/verify";
import { buildLeetcodeLink } from "@/lib/links";
import type { ModelOutput } from "@/lib/schema";

const cites = [
  {
    url: "https://leetcode.com/discuss/interview-experience/123",
    title: "Google onsite",
    content: "Asked longest-substring-without-repeating-characters and Minimum Window Substring",
  },
  {
    url: "https://www.geeksforgeeks.org/amazon-exp/",
    title: "Amazon SDE",
    content: "Sliding window maximum was asked",
  },
];
const q = (o: Partial<ModelOutput["companies"][number]["questions"][number]>) => ({
  title: "X",
  leetcodeSlug: null,
  difficulty: null,
  pattern: null,
  sourceUrls: [],
  reportedYear: null,
  ...o,
});
const base = { topic: "sliding window", company: null, difficulty: "Any" as const, model: "m" };

describe("verifyResult", () => {
  it("drops questions whose sources are not cited and keeps cited ones", () => {
    const r = verifyResult({
      ...base,
      citations: cites,
      output: {
        isDsaTopic: true,
        notes: null,
        companies: [
          {
            name: "Google",
            questions: [
              q({
                title: "Longest Substring Without Repeating Characters",
                leetcodeSlug: "longest-substring-without-repeating-characters",
                sourceUrls: ["https://leetcode.com/discuss/interview-experience/123/"],
              }),
              q({ title: "Made Up", sourceUrls: ["https://evil.example/fake"] }),
            ],
          },
          { name: "Nowhere", questions: [q({ title: "Ghost", sourceUrls: [] })] },
        ],
      },
    });
    expect(r.companies).toHaveLength(1);
    expect(r.companies[0].questions.map((x) => x.title)).toEqual(["Longest Substring Without Repeating Characters"]);
    expect(r.companies[0].questions[0].link.kind).toBe("direct");
    expect(r.sources).toHaveLength(1);
  });

  it("turns unsupported slugs into search links", () => {
    const r = verifyResult({
      ...base,
      citations: cites,
      output: {
        isDsaTopic: true,
        notes: null,
        companies: [
          {
            name: "Amazon",
            questions: [
              q({ title: "Fruit Into Baskets", leetcodeSlug: "fruit-into-baskets", sourceUrls: [cites[1].url] }),
              q({ title: "Sliding Window Maximum", leetcodeSlug: "../../evil", sourceUrls: [cites[1].url] }),
            ],
          },
        ],
      },
    });
    for (const x of r.companies[0].questions) expect(x.link.kind).toBe("search");
    expect(r.companies[0].questions[0].link.url).toBe("https://leetcode.com/problemset/?search=Fruit%20Into%20Baskets");
    expect(r.companies[0].questions[0].leetcodeSlug).toBeUndefined();
  });

  it("links directly when slug matches a title present in sources", () => {
    expect(
      buildLeetcodeLink("Sliding Window Maximum", "sliding-window-maximum", "sliding window maximum was asked").kind,
    ).toBe("direct");
    expect(buildLeetcodeLink("Sliding Window Maximum", "two-sum", "sliding window maximum was asked").kind).toBe(
      "search",
    );
  });

  it("returns empty for non-DSA topics even if model lists companies", () => {
    const r = verifyResult({
      ...base,
      citations: cites,
      output: {
        isDsaTopic: false,
        notes: null,
        companies: [{ name: "G", questions: [q({ title: "A", sourceUrls: [cites[0].url] })] }],
      },
    });
    expect(r.isDsaTopic).toBe(false);
    expect(r.companies).toEqual([]);
  });

  it("dedupes titles, caps sizes and sorts by count", () => {
    const many = Array.from({ length: 20 }, (_, i) => q({ title: `Problem ${i}`, sourceUrls: [cites[0].url] }));
    const r = verifyResult({
      ...base,
      citations: cites,
      output: {
        isDsaTopic: true,
        notes: null,
        companies: [
          { name: "Small", questions: [q({ title: "A", sourceUrls: [cites[1].url] })] },
          { name: "Big", questions: [...many, q({ title: "problem 1", sourceUrls: [cites[1].url] })] },
          ...Array.from({ length: 15 }, (_, i) => ({
            name: `C${i}`,
            questions: [q({ title: "A", sourceUrls: [cites[0].url] })],
          })),
        ],
      },
    });
    expect(r.companies[0].name).toBe("Big");
    expect(r.companies[0].questions).toHaveLength(15);
    expect(r.companies[0].questions[1].sourceUrls).toHaveLength(2);
    expect(r.companies.length).toBe(12);
  });

  it("filters by requested difficulty", () => {
    const r = verifyResult({
      ...base,
      difficulty: "Hard",
      citations: cites,
      output: {
        isDsaTopic: true,
        notes: null,
        companies: [
          {
            name: "G",
            questions: [
              q({ title: "Easy one", difficulty: "Easy", sourceUrls: [cites[0].url] }),
              q({ title: "Hard one", difficulty: "Hard", sourceUrls: [cites[0].url] }),
            ],
          },
        ],
      },
    });
    expect(r.companies[0].questions.map((x) => x.title)).toEqual(["Hard one"]);
  });
});

describe("computeConfidence", () => {
  const mk = (urls: string[][]) =>
    urls.map((u, i) => ({ key: `${i}`, title: `${i}`, sourceUrls: u, link: { url: "", kind: "search" as const } }));
  it("High for 3+ questions or 2+ domains", () => {
    expect(computeConfidence(mk([["https://a.com/1"], ["https://a.com/1"], ["https://a.com/1"]]))).toBe("High");
    expect(computeConfidence(mk([["https://a.com/1", "https://b.com/1"]]))).toBe("High");
  });
  it("Medium for 2 questions; Low for 1", () => {
    expect(computeConfidence(mk([["https://a.com/1"], ["https://a.com/2"]]))).toBe("Medium");
    expect(computeConfidence(mk([["https://a.com/1"]]))).toBe("Low");
  });
});
