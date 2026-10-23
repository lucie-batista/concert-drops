import { describe, expect, it } from "vitest";

import { normalizeVenueName, sizeFromCapacity, venueSize } from "./venue-size";

describe("venueSize", () => {
  it("uses a known capacity when the venue has one", () => {
    expect(venueSize("Anywhere", 250)).toBe("small");
    expect(venueSize("Anywhere", 18000)).toBe("big");
  });

  it("knows Bay Area venues by name", () => {
    expect(venueSize("Chase Center")).toBe("big");
    expect(venueSize("The Masonic")).toBe("mid");
    expect(venueSize("The Fillmore")).toBe("mid");
    expect(venueSize("Brick & Mortar Music Hall")).toBe("small");
    expect(venueSize("Brick and Mortar Music Hall")).toBe("small");
    expect(venueSize("Greek Theatre-U.C. Berkeley")).toBe("big");
    expect(venueSize("Bimbo's 365 Club")).toBe("small");
  });

  it("guesses from the name elsewhere", () => {
    expect(venueSize("Madison Square Garden Arena")).toBe("big");
    expect(venueSize("Hollywood Bowl Amphitheater")).toBe("big");
    expect(venueSize("Baby's All Right Bar")).toBe("small");
    expect(venueSize("The Blue Room")).toBe("small");
  });

  it("returns null without a clue", () => {
    expect(venueSize("Pier 48")).toBeNull();
    expect(venueSize(null)).toBeNull();
  });
});

describe("sizeFromCapacity", () => {
  it("splits at 1,000 and 5,000", () => {
    expect(sizeFromCapacity(999)).toBe("small");
    expect(sizeFromCapacity(1000)).toBe("mid");
    expect(sizeFromCapacity(4999)).toBe("mid");
    expect(sizeFromCapacity(5000)).toBe("big");
  });
});

describe("normalizeVenueName", () => {
  it("ignores case, accents, apostrophes and punctuation", () => {
    expect(normalizeVenueName("Feinstein's at The Nikko")).toBe(
      "feinsteins at the nikko",
    );
    expect(normalizeVenueName("Café Du Nord")).toBe("cafe du nord");
    expect(normalizeVenueName("Fox Theater - Oakland")).toBe(
      "fox theater oakland",
    );
  });
});
