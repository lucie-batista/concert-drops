import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/lib/schedule/map";

import { buildCalendar, escapeText, fold } from "./ics";

const item: ScheduleItem = {
  saleWindowId: "26534ec7-e1b1-4d3c-bfcc-ff80fe5d326b",
  kind: "public",
  windowName: "General on-sale",
  startsAt: "2026-10-23T17:00:00Z",
  artistNames: "SIENNA SPIRO",
  venueName: "The Fillmore",
  timeZone: "America/Los_Angeles",
  ticketUrl: "https://tickets.example/sienna",
  signUpUrl: null,
};

const stampedAt = new Date("2026-10-22T20:15:30.123Z");

describe("buildCalendar", () => {
  it("writes one event per drop with a 15 minute reminder", () => {
    const ics = buildCalendar([item], stampedAt);
    expect(ics.split("\r\n")).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//concert-drops//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:26534ec7-e1b1-4d3c-bfcc-ff80fe5d326b@concert-drops",
      "DTSTAMP:20261022T201530Z",
      "DTSTART:20261023T170000Z",
      "DURATION:PT30M",
      "SUMMARY:SIENNA SPIRO · General on-sale",
      "LOCATION:The Fillmore",
      "DESCRIPTION:Tickets: https://tickets.example/sienna",
      "URL:https://tickets.example/sienna",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:SIENNA SPIRO · General on-sale",
      "TRIGGER:-PT15M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ]);
  });

  it("lists sign up and ticket links in the notes", () => {
    const ics = buildCalendar(
      [{ ...item, signUpUrl: "https://signup.example/a" }],
      stampedAt,
    );
    expect(ics).toContain(
      "DESCRIPTION:Sign up: https://signup.example/a\\nTickets: https://tickets.ex",
    );
  });

  it("leaves out missing venue and links", () => {
    const ics = buildCalendar(
      [{ ...item, venueName: null, ticketUrl: null }],
      stampedAt,
    );
    expect(ics).not.toContain("LOCATION");
    expect(ics).not.toContain("URL:");
    expect(ics).not.toContain("DESCRIPTION:Tickets");
  });

  it("writes an empty calendar when nothing is scheduled", () => {
    expect(buildCalendar([], stampedAt)).not.toContain("VEVENT");
  });
});

describe("escapeText", () => {
  it("escapes characters that mean something in iCalendar", () => {
    expect(escapeText("Tyler, The Creator; live\\n\nnext line")).toBe(
      "Tyler\\, The Creator\\; live\\\\n\\nnext line",
    );
  });
});

describe("fold", () => {
  it("leaves short lines alone", () => {
    expect(fold("SUMMARY:Ashe")).toBe("SUMMARY:Ashe");
  });

  it("wraps long lines at 75 bytes", () => {
    const folded = fold("DESCRIPTION:" + "a".repeat(150));
    const lines = folded.split("\r\n");
    expect(lines[0]).toHaveLength(75);
    expect(lines.slice(1).every((l) => l.startsWith(" "))).toBe(true);
    expect(lines.every((l) => l.length <= 75)).toBe(true);
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join("")).toBe(
      "DESCRIPTION:" + "a".repeat(150),
    );
  });

  it("never splits a multi-byte character", () => {
    const line = "SUMMARY:" + "é".repeat(60);
    const lines = fold(line).split("\r\n");
    const encoder = new TextEncoder();
    expect(lines.every((l) => encoder.encode(l).length <= 75)).toBe(true);
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join("")).toBe(line);
  });
});
