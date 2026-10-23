import { describe, expect, it } from "vitest";

import type { TasteProfile } from "./profile";
import { rankForTaste, type CityDropRow, type CityEventRow } from "./results";

function event(
  id: string,
  genre: string,
  venue: string,
  localDate = "2026-11-20",
): CityEventRow {
  return {
    id,
    name: `${id} live`,
    url: `https://tickets.example/${id}`,
    status: "onsale",
    starts_at: null,
    local_date: localDate,
    venues: { name: venue, city: "San Francisco", time_zone: null },
    genre,
    subgenre: null,
    image_url: `https://img.example/${id}.jpg`,
    performers: [
      { id: `${id}-headliner`, name: `${id} headliner` },
      { id: `${id}-opener`, name: `${id} opener` },
    ],
  };
}

function drop(e: CityEventRow, startsAt: string): CityDropRow {
  return {
    id: `${e.id}-presale`,
    kind: "presale",
    name: "Artist Presale",
    description: null,
    url: null,
    starts_at: startsAt,
    ends_at: null,
    events: e,
  };
}

const profile: TasteProfile = {
  vibes: { indie: 3, pop: 1 },
  performers: [],
  size: "small",
};

describe("rankForTaste", () => {
  const indieClub = event("indie-club", "Alternative", "The Independent");
  const popArena = event("pop-arena", "Pop", "Chase Center");
  const metal = event("metal", "Metal", "The Chapel");

  it("scores drops by taste and gives the headliner the photo", () => {
    const { drops } = rankForTaste(
      profile,
      [drop(indieClub, "2026-10-25T17:00:00Z")],
      [],
      "America/Los_Angeles",
    );
    expect(drops).toHaveLength(1);
    expect(drops[0].score).toBe(85);
    expect(drops[0].artists.map((a) => [a.name, a.imageUrl])).toEqual([
      ["indie-club headliner", "https://img.example/indie-club.jpg"],
      ["indie-club opener", null],
    ]);
  });

  it("keeps date order and leaves out shows with nothing in common", () => {
    const { onSale } = rankForTaste(
      { ...profile, size: null },
      [],
      [
        event("a-pop", "Pop", "Chase Center", "2026-11-01"),
        event("b-metal", "Metal", "The Chapel", "2026-11-02"),
        event("c-indie", "Alternative", "Crybaby", "2026-11-03"),
      ],
      "America/Los_Angeles",
    );
    expect(onSale.map((s) => [s.eventId, s.score])).toEqual([
      ["a-pop", 20],
      ["c-indie", 60],
    ]);
  });

  it("only keeps strong matches when there are enough", () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      event(`indie-${i}`, "Alternative", "The Independent"),
    );
    const { onSale } = rankForTaste(
      profile,
      [],
      [...many, popArena, metal],
      "America/Los_Angeles",
    );
    expect(onSale.map((s) => s.eventId)).toEqual(many.map((e) => e.id));
  });

  it("doesn't list a show under both drops and on sale", () => {
    const { drops, onSale } = rankForTaste(
      profile,
      [drop(indieClub, "2026-10-25T17:00:00Z")],
      [indieClub],
      "America/Los_Angeles",
    );
    expect(drops).toHaveLength(1);
    expect(onSale).toHaveLength(0);
  });
});
