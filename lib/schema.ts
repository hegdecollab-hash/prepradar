import * as Yup from "yup";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type DifficultyFilter = "Any" | Difficulty;
export type Confidence = "High" | "Medium" | "Low";

export interface SearchInput {
  topic: string;
  company?: string;
  difficulty?: DifficultyFilter;
  requestId: string;
}

export interface QuestionLink {
  url: string;
  kind: "direct" | "search";
}

export interface ResultQuestion {
  key: string;
  title: string;
  leetcodeSlug?: string;
  difficulty?: Difficulty;
  pattern?: string;
  sourceUrls: string[];
  reportedYear?: number;
  link: QuestionLink;
}

export interface ResultCompany {
  name: string;
  confidence: Confidence;
  questions: ResultQuestion[];
}

export interface SearchResult {
  topic: string;
  company: string | null;
  difficulty: DifficultyFilter;
  searchedAt: string;
  model: string;
  isDsaTopic: boolean;
  companies: ResultCompany[];
  sources: { url: string; title: string }[];
  notes?: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  requestId: string;
}

const noControl = (v: string | undefined) => !v || !/[\u0000-\u001f\u007f]/.test(v);

export const searchFormSchema = Yup.object({
  topic: Yup.string()
    .trim()
    .required("Enter a DSA topic.")
    .min(2, "Topic must be at least 2 characters.")
    .max(80, "Topic must be 80 characters or fewer.")
    .test("chars", "Topic contains invalid characters.", noControl),
  company: Yup.string()
    .trim()
    .max(60, "Company must be 60 characters or fewer.")
    .test("chars", "Company contains invalid characters.", noControl),
  difficulty: Yup.mixed<DifficultyFilter>()
    .oneOf(["Any", ...DIFFICULTIES])
    .default("Any"),
});

export const apiInputSchema = searchFormSchema
  .shape({
    requestId: Yup.string()
      .required()
      .matches(/^[A-Za-z0-9-]{8,64}$/, "Invalid request ID."),
  })
  .test("known-keys", "Unexpected field.", function () {
    const raw = this.originalValue as Record<string, unknown> | undefined;
    const allowed = ["topic", "company", "difficulty", "requestId"];
    return !raw || Object.keys(raw).every((k) => allowed.includes(k));
  });

export const normalizeSpaces = (s: string) => s.trim().replace(/\s+/g, " ");
export const normalizeKey = (s: string) => normalizeSpaces(s).toLowerCase();
export const normalizeTitle = (s: string) =>
  s
    .toLowerCase()
    .replace(/^\s*\d+\s*[.)-]\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export const cacheKey = (topic: string, company?: string | null, difficulty: DifficultyFilter = "Any") =>
  `${normalizeKey(topic)}|${normalizeKey(company ?? "")}|${difficulty}`;

/** JSON schema the model must follow (OpenAI strict mode compatible). */
export const modelJsonSchema = {
  name: "dsa_company_questions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["isDsaTopic", "companies", "notes"],
    properties: {
      isDsaTopic: { type: "boolean" },
      notes: { type: ["string", "null"] },
      companies: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "questions"],
          properties: {
            name: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "leetcodeSlug", "difficulty", "pattern", "sourceUrls", "reportedYear"],
                properties: {
                  title: { type: "string" },
                  leetcodeSlug: { type: ["string", "null"] },
                  difficulty: { type: ["string", "null"], enum: ["Easy", "Medium", "Hard", null] },
                  pattern: { type: ["string", "null"] },
                  sourceUrls: { type: "array", items: { type: "string" } },
                  reportedYear: { type: ["integer", "null"] },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

/** Runtime validation of the model's JSON (never trust it). */
export const modelOutputSchema = Yup.object({
  isDsaTopic: Yup.boolean().required(),
  notes: Yup.string().nullable().defined(),
  companies: Yup.array()
    .required()
    .of(
      Yup.object({
        name: Yup.string().trim().required().max(80),
        questions: Yup.array()
          .required()
          .of(
            Yup.object({
              title: Yup.string().trim().required().max(200),
              leetcodeSlug: Yup.string().nullable().defined(),
              difficulty: Yup.mixed<Difficulty>()
                .oneOf([...DIFFICULTIES])
                .nullable()
                .defined(),
              pattern: Yup.string().nullable().defined().max(60),
              sourceUrls: Yup.array().of(Yup.string().required()).required(),
              reportedYear: Yup.number().integer().nullable().defined(),
            }),
          ),
      }),
    ),
});
export type ModelOutput = Yup.InferType<typeof modelOutputSchema>;
