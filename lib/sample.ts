import type { SearchResult } from "./schema";

/** Static, clearly labeled SAMPLE. Not a live result; company names and sources are placeholders. */
export const SAMPLE_RESULT: SearchResult = {
  topic: "Sliding window",
  company: null,
  difficulty: "Any",
  searchedAt: "2026-01-01T00:00:00.000Z",
  model: "no model call",
  isDsaTopic: true,
  notes: "This is a static sample to show the layout. Run a search for real, sourced results.",
  sources: [
    { url: "https://example.com/sample-interview-experience", title: "Sample interview write-up" },
    { url: "https://example.org/sample-prep-list", title: "Sample prep list" },
  ],
  companies: [
    {
      name: "Example Company A",
      confidence: "High",
      questions: [
        {
          key: "longest substring without repeating characters",
          title: "Longest Substring Without Repeating Characters",
          leetcodeSlug: "longest-substring-without-repeating-characters",
          difficulty: "Medium",
          pattern: "Variable window",
          sourceUrls: ["https://example.com/sample-interview-experience"],
          link: {
            url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
            kind: "direct",
          },
        },
        {
          key: "minimum window substring",
          title: "Minimum Window Substring",
          difficulty: "Hard",
          pattern: "Variable window",
          sourceUrls: ["https://example.org/sample-prep-list"],
          link: { url: "https://leetcode.com/problemset/?search=Minimum%20Window%20Substring", kind: "search" },
        },
      ],
    },
    {
      name: "Example Company B",
      confidence: "Low",
      questions: [
        {
          key: "sliding window maximum",
          title: "Sliding Window Maximum",
          difficulty: "Hard",
          pattern: "Monotonic deque",
          sourceUrls: ["https://example.org/sample-prep-list"],
          link: { url: "https://leetcode.com/problemset/?search=Sliding%20Window%20Maximum", kind: "search" },
        },
      ],
    },
  ],
};
