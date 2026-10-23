import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScheduleItem } from "@/lib/schedule/map";

const schedule = vi.hoisted(() => ({ items: [] as ScheduleItem[] }));
vi.mock("@/lib/schedule/queries", () => ({
  getSchedule: async () => ({ items: schedule.items, scheduledIds: [] }),
}));

const { GET } = await import("./route");

function item(id: string, startsAt: string, artistNames = "Ashe") {
  return {
    saleWindowId: id,
    kind: "presale",
    windowName: "Artist Presale",
    startsAt,
    artistNames,
    venueName: "The Castro Theatre",
    timeZone: "America/Los_Angeles",
    ticketUrl: null,
    signUpUrl: null,
  } satisfies ScheduleItem;
}

function get(query = "") {
  return GET(new NextRequest(`http://localhost/calendar.ics${query}`));
}

describe("GET /calendar.ics", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-22T20:00:00Z") });
    schedule.items = [
      item("opened", "2026-10-22T17:00:00Z"),
      item("soon", "2026-10-23T17:00:00Z", "SIENNA SPIRO"),
      item("later", "2026-10-28T17:00:00Z"),
    ];
  });
  afterEach(() => vi.useRealTimers());

  it("gives every upcoming scheduled drop", async () => {
    const res = await get();
    const ics = await res.text();
    expect(res.headers.get("content-type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="concert-drops.ics"',
    );
    expect(ics).toContain("UID:soon@concert-drops");
    expect(ics).toContain("UID:later@concert-drops");
    expect(ics).not.toContain("UID:opened@concert-drops");
  });

  it("gives one drop by id, named after it", async () => {
    const res = await get("?drop=soon");
    const ics = await res.text();
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="sienna-spiro-artist-presale.ics"',
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("UID:soon@concert-drops");
  });

  it("returns 404 for a drop that isn't on the schedule", async () => {
    expect((await get("?drop=nope")).status).toBe(404);
  });
});
