import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/lib/schedule/map";

import { dropsForSlot, HOME_TIME_ZONE, slotAt } from "./plan";

function item(id: string, startsAt: string): ScheduleItem {
  return {
    saleWindowId: id,
    kind: "presale",
    windowName: "Artist Presale",
    startsAt,
    artistNames: "Ashe",
    venueName: "The Castro Theatre",
    timeZone: "America/Los_Angeles",
    ticketUrl: null,
    signUpUrl: null,
  };
}

describe("slotAt", () => {
  it("sends the evening reminder at 9 PM Pacific in summer and winter", () => {
    // 04:30 UTC is 9:30 PM PDT; 05:30 UTC is 9:30 PM PST.
    expect(slotAt(new Date("2026-10-23T04:30:00Z"), HOME_TIME_ZONE)).toBe(
      "evening",
    );
    expect(slotAt(new Date("2026-10-23T05:30:00Z"), HOME_TIME_ZONE)).toBeNull();
    expect(slotAt(new Date("2026-12-01T05:30:00Z"), HOME_TIME_ZONE)).toBe(
      "evening",
    );
    expect(slotAt(new Date("2026-12-01T04:30:00Z"), HOME_TIME_ZONE)).toBeNull();
  });

  it("sends the morning reminder at 7 AM Pacific", () => {
    expect(slotAt(new Date("2026-10-23T14:10:00Z"), HOME_TIME_ZONE)).toBe(
      "morning",
    );
    expect(slotAt(new Date("2026-12-01T15:10:00Z"), HOME_TIME_ZONE)).toBe(
      "morning",
    );
  });

  it("sends nothing at other hours", () => {
    expect(slotAt(new Date("2026-10-23T13:00:00Z"), HOME_TIME_ZONE)).toBeNull();
    expect(slotAt(new Date("2026-10-23T20:00:00Z"), HOME_TIME_ZONE)).toBeNull();
  });
});

describe("dropsForSlot", () => {
  const items = [
    item("today-early", "2026-10-23T14:00:00Z"), // Fri 7:00 AM PT
    item("today", "2026-10-23T17:00:00Z"), // Fri 10:00 AM PT
    item("tonight", "2026-10-24T06:30:00Z"), // Fri 11:30 PM PT
    item("tomorrow", "2026-10-24T17:00:00Z"), // Sat 10:00 AM PT
    item("later", "2026-10-28T17:00:00Z"),
  ];

  it("covers tomorrow's drops in the evening", () => {
    const thursdayNight = new Date("2026-10-23T04:20:00Z"); // Thu 9:20 PM PT
    expect(
      dropsForSlot("evening", items, thursdayNight, HOME_TIME_ZONE).map(
        (i) => i.saleWindowId,
      ),
    ).toEqual(["today-early", "today", "tonight"]);
  });

  it("covers the rest of today's drops in the morning", () => {
    const fridayMorning = new Date("2026-10-23T14:20:00Z"); // Fri 7:20 AM PT
    expect(
      dropsForSlot("morning", items, fridayMorning, HOME_TIME_ZONE).map(
        (i) => i.saleWindowId,
      ),
    ).toEqual(["today", "tonight"]);
  });

  it("rolls over months", () => {
    const halloweenNight = new Date("2026-11-01T04:20:00Z"); // Sat Oct 31, 9:20 PM PT
    expect(
      dropsForSlot(
        "evening",
        [item("nov-1", "2026-11-01T17:00:00Z")],
        halloweenNight,
        HOME_TIME_ZONE,
      ),
    ).toHaveLength(1);
  });
});
