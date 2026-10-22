import { describe, expect, it } from "vitest";

import { toScheduleItems, type ScheduleRow } from "./map";

function row(
  id: string,
  startsAt: string,
  overrides: Partial<NonNullable<ScheduleRow["sale_windows"]>> = {},
): ScheduleRow {
  return {
    sale_windows: {
      id,
      kind: "presale",
      name: "Artist Presale",
      url: null,
      starts_at: startsAt,
      events: {
        name: "Ashe Live",
        url: "https://tickets.example/ashe",
        venues: {
          name: "The Castro Theatre",
          time_zone: "America/Los_Angeles",
        },
        event_artists: [{ artists: { name: "Ashe" } }],
      },
      ...overrides,
    },
  };
}

describe("toScheduleItems", () => {
  const since = "2026-10-22T00:00:00Z";

  it("lists ticked drops in date order", () => {
    const items = toScheduleItems(
      [
        row("later", "2026-10-30T17:00:00Z", {
          kind: "public",
          name: "Public",
        }),
        row("sooner", "2026-10-28T17:00:00Z"),
      ],
      "America/Los_Angeles",
      since,
    );
    expect(items.map((i) => [i.saleWindowId, i.windowName])).toEqual([
      ["sooner", "Artist Presale"],
      ["later", "General on-sale"],
    ]);
    expect(items[0]).toMatchObject({
      artistNames: "Ashe",
      venueName: "The Castro Theatre",
      timeZone: "America/Los_Angeles",
      ticketUrl: "https://tickets.example/ashe",
    });
  });

  it("leaves out drops that opened before the cutoff", () => {
    expect(
      toScheduleItems([row("old", "2026-10-01T17:00:00Z")], "UTC", since),
    ).toEqual([]);
  });

  it("skips rows whose sale window no longer exists", () => {
    expect(toScheduleItems([{ sale_windows: null }], "UTC", since)).toEqual([]);
  });

  it("falls back to the event name when no artist is linked", () => {
    const base = row("x", "2026-10-28T17:00:00Z");
    const [item] = toScheduleItems(
      [
        {
          sale_windows: {
            ...base.sale_windows!,
            events: { ...base.sale_windows!.events, event_artists: [] },
          },
        },
      ],
      "UTC",
      since,
    );
    expect(item.artistNames).toBe("Ashe Live");
  });
});
