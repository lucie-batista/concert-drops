import { describe, expect, it } from "vitest";

import {
  applyAnswer,
  buildQuiz,
  EMPTY_PROFILE,
  QUIZ_LENGTH,
  type QuizAct,
} from "./quiz";
import type { VibeId } from "./vibes";

function actsOf(vibe: VibeId, count: number): QuizAct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${vibe}-${i}`,
    name: `${vibe} act ${i}`,
    imageUrl: `https://img.example/${vibe}-${i}.jpg`,
    vibe,
    venueName: "The Independent",
  }));
}

const cityActs = [
  ...actsOf("indie", 12),
  ...actsOf("pop", 10),
  ...actsOf("hiphop", 8),
  ...actsOf("electronic", 6),
  ...actsOf("rock", 6),
  ...actsOf("folk", 5),
  ...actsOf("jazz", 2),
];
const venues = ["Chase Center", "The Fillmore", "The Independent", "Crybaby"];

describe("buildQuiz", () => {
  const quiz = buildQuiz(cityActs, venues, "2026-10-23");

  it("asks eight questions, ending with the open one", () => {
    expect(quiz).toHaveLength(QUIZ_LENGTH);
    expect(quiz.map((q) => q.kind)).toEqual([
      "playlist",
      "clash",
      "playlist",
      "venue",
      "clash",
      "playlist",
      "clash",
      "vibes",
    ]);
  });

  it("never shows the same act twice", () => {
    const ids = quiz
      .filter((q) => q.kind === "playlist" || q.kind === "clash")
      .flatMap((q) => q.options.flatMap((o) => o.images));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds playlists of four acts from one vibe each", () => {
    for (const q of quiz.filter((q) => q.kind === "playlist")) {
      expect(q.options).toHaveLength(2);
      for (const option of q.options) {
        expect(option.images).toHaveLength(4);
        expect(option.signal.vibe).toBe(option.id);
      }
      expect(q.options[0].id).not.toBe(q.options[1].id);
    }
  });

  it("pits acts of different vibes against each other", () => {
    for (const q of quiz.filter((q) => q.kind === "clash")) {
      const [a, b] = q.options;
      expect(a.signal.vibe).not.toBe(b.signal.vibe);
      expect(a.signal.performer).toBe(a.id);
    }
  });

  it("describes room sizes with venues from the city", () => {
    const venue = quiz.find((q) => q.kind === "venue")!;
    expect(venue.options.map((o) => [o.label, o.detail])).toEqual([
      ["Small club", "Like Crybaby · about 450 people"],
      ["Theater", "Like The Fillmore · about 1,300 people"],
      ["Arena", "Like Chase Center · about 18,000 people"],
    ]);
  });

  it("offers every vibe playing in the city at the end", () => {
    const more = quiz.at(-1)!;
    expect(more.options.map((o) => o.id).sort()).toEqual(
      ["electronic", "folk", "hiphop", "indie", "jazz", "pop", "rock"].sort(),
    );
  });

  it("is the same for the same seed and changes with it", () => {
    expect(buildQuiz(cityActs, venues, "2026-10-23")).toEqual(quiz);
    expect(buildQuiz(cityActs, venues, "2026-10-24")).not.toEqual(quiz);
  });

  it("skips one act playing several shows", () => {
    const repeats = [...cityActs, ...cityActs];
    const ids = buildQuiz(repeats, venues, "x")
      .filter((q) => q.kind === "clash")
      .flatMap((q) => q.options.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("still works in a city with little to go on", () => {
    const small = buildQuiz(actsOf("rock", 3), [], "x");
    expect(small.map((q) => q.kind)).toEqual(["venue", "vibes"]);
    expect(small[0].options[0].detail).toBe("Under 1,000 people");
  });
});

describe("applyAnswer", () => {
  it("counts vibes, collects acts and keeps the room size", () => {
    let profile = applyAnswer(EMPTY_PROFILE, [
      {
        id: "a",
        label: "A",
        images: [],
        signal: { vibe: "indie", performer: "a" },
      },
    ]);
    profile = applyAnswer(profile, [
      { id: "small", label: "Small", images: [], signal: { size: "small" } },
    ]);
    profile = applyAnswer(profile, [
      { id: "indie", label: "Indie", images: [], signal: { vibe: "indie" } },
      { id: "pop", label: "Pop", images: [], signal: { vibe: "pop" } },
    ]);
    expect(profile).toEqual({
      vibes: { indie: 2, pop: 1 },
      performers: ["a"],
      size: "small",
    });
    expect(EMPTY_PROFILE).toEqual({ vibes: {}, performers: [], size: null });
  });
});
