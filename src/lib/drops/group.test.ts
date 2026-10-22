import { describe, expect, it } from "vitest";

import { groupDropsByShow, type DropRow } from "./group";

function row(
  id: string,
  eventId: string,
  startsAt: string,
  overrides: Partial<DropRow> = {},
): DropRow {
  return {
    id,
    kind: "presale",
    name: `Window ${id}`,
    description: null,
    url: null,
    starts_at: startsAt,
    ends_at: null,
    events: {
      id: eventId,
      name: `Show ${eventId}`,
      url: `https://tickets.example/${eventId}`,
      status: "offsale",
      starts_at: "2027-02-27T04:00:00Z",
      local_date: "2027-02-26",
      venues: {
        name: "The Castro Theatre",
        city: "San Francisco",
        time_zone: "America/Los_Angeles",
      },
      event_artists: [
        { artists: { id: "a1", name: "Ashe", image_url: "https://img/ashe" } },
      ],
    },
    ...overrides,
  };
}

describe("groupDropsByShow", () => {
  it("puts every window of a show on one card, soonest first", () => {
    const shows = groupDropsByShow(
      [
        row("w2", "ashe", "2026-10-28T21:00:00Z"),
        row("w1", "ashe", "2026-10-28T17:00:00Z"),
        row("w3", "ashe", "2026-10-30T17:00:00Z", { kind: "public" }),
      ],
      "America/Los_Angeles",
    );

    expect(shows).toHaveLength(1);
    expect(shows[0].windows.map((w) => w.id)).toEqual(["w1", "w2", "w3"]);
    expect(shows[0].windows[2].kind).toBe("public");
    expect(shows[0]).toMatchObject({
      eventName: "Show ashe",
      venueName: "The Castro Theatre",
      timeZone: "America/Los_Angeles",
      artists: [{ id: "a1", name: "Ashe", imageUrl: "https://img/ashe" }],
    });
  });

  it("orders shows by their soonest drop", () => {
    const shows = groupDropsByShow(
      [
        row("late", "pixies", "2026-10-29T17:00:00Z"),
        row("early", "sienna", "2026-10-23T17:00:00Z"),
      ],
      "America/Los_Angeles",
    );
    expect(shows.map((s) => s.eventId)).toEqual(["sienna", "pixies"]);
  });

  it("falls back to the city's time zone when the venue has none", () => {
    const base = row("w", "e", "2026-10-23T17:00:00Z");
    const [show] = groupDropsByShow(
      [{ ...base, events: { ...base.events, venues: null } }],
      "America/New_York",
    );
    expect(show.timeZone).toBe("America/New_York");
    expect(show.venueName).toBeNull();
  });

  it("skips artist links whose artist row is missing", () => {
    const base = row("w", "e", "2026-10-23T17:00:00Z");
    const [show] = groupDropsByShow(
      [
        {
          ...base,
          events: { ...base.events, event_artists: [{ artists: null }] },
        },
      ],
      "America/Los_Angeles",
    );
    expect(show.artists).toEqual([]);
  });

  it("returns nothing for no rows", () => {
    expect(groupDropsByShow([], "America/Los_Angeles")).toEqual([]);
  });
});
