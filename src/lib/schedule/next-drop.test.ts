import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "./map";
import { countdownParts, pickNextDrop } from "./next-drop";

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

describe("pickNextDrop", () => {
  const now = Date.parse("2026-10-22T17:00:00Z");
  const items = [
    item("yesterday", "2026-10-21T17:00:00Z"),
    item("tomorrow", "2026-10-23T17:00:00Z"),
    item("next-week", "2026-10-29T17:00:00Z"),
  ];

  it("counts down to the soonest ticked drop ahead", () => {
    expect(pickNextDrop(items, now)).toEqual({
      item: items[1],
      isOpen: false,
    });
  });

  it("keeps a drop that opened in the last hour as open now", () => {
    const justOpened = item("just-opened", "2026-10-22T16:30:00Z");
    expect(pickNextDrop([justOpened, ...items.slice(1)], now)).toEqual({
      item: justOpened,
      isOpen: true,
    });
  });

  it("moves on once a drop has been open for an hour", () => {
    const opened = item("opened", "2026-10-22T16:00:00Z");
    expect(pickNextDrop([opened, items[1]], now)?.item.saleWindowId).toBe(
      "tomorrow",
    );
  });

  it("returns null when nothing ticked is coming up", () => {
    expect(pickNextDrop([items[0]], now)).toBeNull();
    expect(pickNextDrop([], now)).toBeNull();
  });
});

describe("countdownParts", () => {
  it("splits the time left into days, hours, minutes and seconds", () => {
    const ms = ((2 * 24 + 14) * 3600 + 6 * 60 + 9) * 1000 + 500;
    expect(countdownParts(ms)).toEqual({
      days: 2,
      hours: 14,
      minutes: 6,
      seconds: 9,
    });
  });

  it("never goes below zero", () => {
    expect(countdownParts(-5000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
