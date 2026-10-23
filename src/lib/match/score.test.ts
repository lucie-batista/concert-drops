import { describe, expect, it } from "vitest";

import { affinityScore, matchLabel, showScore } from "./score";

describe("affinityScore", () => {
  it("gives the most to artists high in every list", () => {
    // Olivia Rodrigo: #7 lately, #6 over 6 months, #10 over the year, followed.
    expect(
      affinityScore([
        { source: "top_short_term", rank: 7 },
        { source: "top_medium_term", rank: 6 },
        { source: "top_long_term", rank: 10 },
        { source: "followed", rank: null },
      ]),
    ).toBe(89);
  });

  it("scores a #1 in every list plus a follow as 100", () => {
    expect(
      affinityScore([
        { source: "top_short_term", rank: 1 },
        { source: "top_medium_term", rank: 1 },
        { source: "top_long_term", rank: 1 },
        { source: "followed", rank: null },
      ]),
    ).toBe(100);
  });

  it("counts a follow on its own", () => {
    expect(affinityScore([{ source: "followed", rank: null }])).toBe(10);
  });

  it("weights lower ranks less", () => {
    // SIENNA SPIRO: #3 over 6 months, #18 over the year.
    expect(
      affinityScore([
        { source: "top_medium_term", rank: 3 },
        { source: "top_long_term", rank: 18 },
      ]),
    ).toBe(47);
    expect(affinityScore([{ source: "top_short_term", rank: 50 }])).toBe(1);
  });

  it("ignores unknown lists and out-of-range ranks", () => {
    expect(
      affinityScore([
        { source: "top_short_term", rank: null },
        { source: "top_medium_term", rank: 51 },
        { source: "something_new", rank: 1 },
      ]),
    ).toBe(0);
    expect(affinityScore([])).toBe(0);
  });
});

describe("matchLabel", () => {
  it("calls out top and strong matches only", () => {
    expect(matchLabel(89)).toBe("Top match");
    expect(matchLabel(60)).toBe("Top match");
    expect(matchLabel(59)).toBe("Strong match");
    expect(matchLabel(30)).toBe("Strong match");
    expect(matchLabel(29)).toBeNull();
    expect(matchLabel(10)).toBeNull();
  });
});

describe("showScore", () => {
  it("uses the best artist on the bill", () => {
    expect(showScore([{ score: 10 }, { score: 47 }, { score: 13 }])).toBe(47);
    expect(showScore([])).toBe(0);
  });
});
