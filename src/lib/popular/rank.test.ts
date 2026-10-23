import { describe, expect, it } from "vitest";

import { bestPopularRank, popularRanks } from "./rank";

const ranks = popularRanks([
  { rank: 1, name: "Taylor Swift" },
  { rank: 2, name: "Beyoncé" },
  { rank: 3, name: "Tyler, the Creator" },
  { rank: 4, name: "Mumford & Sons" },
  { rank: 5, name: "Taylor Swift" },
]);

describe("bestPopularRank", () => {
  it("matches names whatever their case, accents or punctuation", () => {
    expect(bestPopularRank([{ name: "BEYONCE" }], ranks)).toBe(2);
    expect(bestPopularRank([{ name: "Tyler The Creator" }], ranks)).toBe(3);
    expect(bestPopularRank([{ name: "Mumford and Sons" }], ranks)).toBe(4);
  });

  it("takes the best rank on the bill", () => {
    expect(
      bestPopularRank(
        [{ name: "Mumford & Sons" }, { name: "Opener" }, { name: "Beyoncé" }],
        ranks,
      ),
    ).toBe(2);
  });

  it("keeps an artist's first (best) rank if listed twice", () => {
    expect(bestPopularRank([{ name: "Taylor Swift" }], ranks)).toBe(1);
  });

  it("is null when nobody on the bill is popular", () => {
    expect(bestPopularRank([{ name: "Local Band" }], ranks)).toBeNull();
    expect(bestPopularRank([], ranks)).toBeNull();
  });
});
