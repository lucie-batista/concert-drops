import { describe, expect, it } from "vitest";

import { matchLabel } from "@/lib/match/score";

import type { TasteProfile } from "./profile";
import { tasteScore, type ShowTraits } from "./score";

const profile: TasteProfile = {
  vibes: { indie: 4, pop: 2 },
  performers: ["picked-act"],
  size: "small",
};

const show = (traits: Partial<ShowTraits>): ShowTraits => ({
  vibe: null,
  size: null,
  performerIds: [],
  ...traits,
});

describe("tasteScore", () => {
  it("ranks their favorite vibe in the right size room highest", () => {
    expect(tasteScore(profile, show({ vibe: "indie", size: "small" }))).toBe(
      85,
    );
    expect(matchLabel(85)).toBe("Top match");
  });

  it("scales other vibes by how often they were picked", () => {
    expect(tasteScore(profile, show({ vibe: "pop", size: "small" }))).toBe(55);
    expect(tasteScore(profile, show({ vibe: "rock", size: "small" }))).toBe(25);
  });

  it("gives partial size points for the next size over or an unknown room", () => {
    expect(tasteScore(profile, show({ vibe: "indie", size: "mid" }))).toBe(70);
    expect(tasteScore(profile, show({ vibe: "indie" }))).toBe(70);
    expect(tasteScore(profile, show({ vibe: "indie", size: "big" }))).toBe(60);
  });

  it("boosts acts they chose, capped at 100", () => {
    expect(tasteScore(profile, show({ performerIds: ["picked-act"] }))).toBe(
      50,
    );
    expect(
      tasteScore(
        profile,
        show({ vibe: "indie", size: "small", performerIds: ["picked-act"] }),
      ),
    ).toBe(100);
  });

  it("works with only some answers", () => {
    const sizeOnly: TasteProfile = { vibes: {}, performers: [], size: "big" };
    expect(tasteScore(sizeOnly, show({ vibe: "pop", size: "big" }))).toBe(25);
    const vibeOnly: TasteProfile = {
      vibes: { pop: 1 },
      performers: [],
      size: null,
    };
    expect(tasteScore(vibeOnly, show({ vibe: "pop", size: "big" }))).toBe(60);
  });
});
