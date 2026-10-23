import { describe, expect, it } from "vitest";

import { vibeLabel, vibeOf } from "./vibes";

describe("vibeOf", () => {
  it("groups Ticketmaster genres into vibes", () => {
    expect(vibeOf("Hip-Hop/Rap", "Trap")).toBe("hiphop");
    expect(vibeOf("R&B", null)).toBe("hiphop");
    expect(vibeOf("Country", "Country")).toBe("folk");
    expect(vibeOf("Dance/Electronic", "Amapiano")).toBe("electronic");
  });

  it("lets the subgenre win over the genre", () => {
    expect(vibeOf("Rock", "Pop")).toBe("pop");
    expect(vibeOf("Rock", "Indie Rock")).toBe("indie");
    expect(vibeOf("Rock", "Hard Rock")).toBe("rock");
  });

  it("falls back to the genre for unfamiliar subgenres", () => {
    expect(vibeOf("Jazz", "Bebop")).toBe("jazz");
  });

  it("returns null when there's no clue", () => {
    expect(vibeOf(null, null)).toBeNull();
    expect(vibeOf("Miscellaneous", null)).toBeNull();
  });
});

describe("vibeLabel", () => {
  it("names a vibe", () => {
    expect(vibeLabel("hiphop")).toBe("Hip-hop & R&B");
  });
});
