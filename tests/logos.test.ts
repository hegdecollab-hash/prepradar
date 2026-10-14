import { describe, expect, it } from "vitest";
import { getCompanyLogo } from "@/lib/company-logos";

describe("getCompanyLogo", () => {
  it("matches common names and aliases", () => {
    for (const n of [
      "Google",
      "Meta",
      "Facebook",
      "Apple Inc.",
      "Uber",
      "Goldman Sachs",
      "Twitter",
      "Atlassian",
      "Airbnb",
      "Netflix",
    ])
      expect(getCompanyLogo(n), n).not.toBeNull();
  });
  it("returns null (monogram) for unknown or unavailable brands", () => {
    for (const n of ["Amazon", "Microsoft", "Docusign", "Some Startup"]) expect(getCompanyLogo(n), n).toBeNull();
  });
  it("darkens too-light brand colors", () => {
    expect(getCompanyLogo("Snapchat")?.color).toBe("#1f1f23");
  });
});
