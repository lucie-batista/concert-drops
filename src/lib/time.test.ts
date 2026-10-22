import { describe, expect, it } from "vitest";

import { formatInTimeZone } from "./time";

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
