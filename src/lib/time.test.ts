import { describe, expect, it } from "vitest";

import {
  formatInTimeZone,
  formatShowDate,
  localDateIn,
  tileParts,
  zoneLabel,
} from "./time";

describe("formatInTimeZone", () => {
  // 10:00 AM in San Francisco on Oct 23, 2026 (daylight time, UTC-7).
  const sfPresale = "2026-10-23T17:00:00Z";

  it("formats a drop in the venue's time zone", () => {
    expect(formatInTimeZone(sfPresale, "America/Los_Angeles")).toBe(
      "Fri, Oct 23 · 10:00 AM PT",
    );
  });

  it("shows the same drop in a New York viewer's time zone", () => {
    expect(formatInTimeZone(sfPresale, "America/New_York")).toBe(
      "Fri, Oct 23 · 1:00 PM ET",
    );
  });

  it("handles standard time and a different calendar day across zones", () => {
    // 8:00 PM in San Francisco on Feb 14, 2027 is 11:00 PM the same night in New York
    // and already Feb 15 in UTC.
    const show = "2027-02-15T04:00:00Z";
    expect(formatInTimeZone(show, "America/Los_Angeles")).toBe(
      "Sun, Feb 14 · 8:00 PM PT",
    );
    expect(formatInTimeZone(show, "America/New_York")).toBe(
      "Sun, Feb 14 · 11:00 PM ET",
    );
  });

  it("accepts Date objects", () => {
    expect(formatInTimeZone(new Date(sfPresale), "America/Los_Angeles")).toBe(
      "Fri, Oct 23 · 10:00 AM PT",
    );
  });
});

describe("tileParts", () => {
  it("splits a drop time into tile pieces in the given zone", () => {
    expect(tileParts("2026-10-23T17:00:00Z", "America/Los_Angeles")).toEqual({
      weekday: "Fri",
      day: "23",
      month: "Oct",
      time: "10:00 AM",
      zone: "PT",
    });
  });

  it("can land on a different day in another zone", () => {
    // 11 PM Friday in San Francisco is already Saturday in New York.
    expect(tileParts("2026-10-24T06:00:00Z", "America/New_York")).toMatchObject(
      { weekday: "Sat", day: "24", time: "2:00 AM", zone: "ET" },
    );
  });
});

describe("formatShowDate", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("omits the year for this year's shows", () => {
    expect(formatShowDate("2026-11-15", now)).toBe("Sun, Nov 15");
  });

  it("includes the year for later years", () => {
    expect(formatShowDate("2027-09-07", now)).toBe("Tue, Sep 7, 2027");
  });
});

describe("zoneLabel", () => {
  it("uses the short generic name", () => {
    expect(
      zoneLabel(new Date("2026-10-23T17:00:00Z"), "America/Los_Angeles"),
    ).toBe("PT");
  });
});

describe("localDateIn", () => {
  it("gives the calendar date in the zone", () => {
    // 11 PM Oct 22 in San Francisco is already Oct 23 in UTC.
    const instant = "2026-10-23T06:00:00Z";
    expect(localDateIn("America/Los_Angeles", instant)).toBe("2026-10-22");
    expect(localDateIn("UTC", instant)).toBe("2026-10-23");
  });
});
