import { describe, expect, it } from "vitest";

import {
  toPopularShows,
  type PopularDropRow,
  type PopularEventRow,
} from "./shows";

function event(
  id: string,
  popularRank: number | null,
  localDate = "2026-11-20",
): PopularEventRow {
  return {
    id,
    name: `${id} live`,
    url: `https://tickets.example/${id}`,
    status: "onsale",
    starts_at: null,
    local_date: localDate,
    venues: { name: "Chase Center", city: "San Francisco", time_zone: null },
    genre: "Pop",
    subgenre: null,
    image_url: `https://img.example/${id}.jpg`,
    performers: [
      { id: `${id}-headliner`, name: `${id} headliner` },
      { id: `${id}-opener`, name: `${id} opener` },
    ],
    popular_rank: popularRank,
  };
}

function drop(e: PopularEventRow, startsAt: string): PopularDropRow {
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

describe("toPopularShows", () => {
  it("keeps shows with a popular artist and names the bill", () => {
    const { drops } = toPopularShows(
      [
        drop(event("star", 3), "2026-10-25T17:00:00Z"),
        drop(event("local", null), "2026-10-26T17:00:00Z"),
      ],
      [],
      "America/Los_Angeles",
    );
    expect(drops.map((d) => [d.eventId, d.popularRank])).toEqual([["star", 3]]);
    expect(drops[0].artists.map((a) => [a.name, a.imageUrl])).toEqual([
      ["star headliner", "https://img.example/star.jpg"],
      ["star opener", null],
    ]);
  });

  it("stays in date order, scoring the most popular highest", () => {
    const { onSale } = toPopularShows(
      [],
      [
        event("a", 500, "2026-11-01"),
        event("b", 1, "2026-11-02"),
        event("c", 1000, "2026-11-03"),
      ],
      "America/Los_Angeles",
    );
    expect(onSale.map((s) => [s.eventId, s.score])).toEqual([
      ["a", 501],
      ["b", 1000],
      ["c", 1],
    ]);
  });

  it("doesn't list a show under both drops and on sale", () => {
    const star = event("star", 3);
    const { drops, onSale } = toPopularShows(
      [drop(star, "2026-10-25T17:00:00Z")],
      [star],
      "America/Los_Angeles",
    );
    expect(drops).toHaveLength(1);
    expect(onSale).toHaveLength(0);
  });
});
