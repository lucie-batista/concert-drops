import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/lib/schedule/map";

import { escapeHtml, reminderEmail } from "./email";

const ashe: ScheduleItem = {
  saleWindowId: "a",
  kind: "presale",
  windowName: "Artist Presale",
  startsAt: "2026-10-24T17:00:00Z",
  artistNames: "Ashe",
  venueName: "The Castro Theatre",
  timeZone: "America/Los_Angeles",
  ticketUrl: "https://tickets.example/ashe",
  signUpUrl: "https://signup.example/ashe",
};

const options = {
  timeZone: "America/Los_Angeles",
  siteUrl: "https://concert-drops.vercel.app",
};

describe("reminderEmail", () => {
  it("names a single drop and its time in the subject", () => {
    expect(reminderEmail("evening", [ashe], options).subject).toBe(
      "Tomorrow: Ashe · Artist Presale at 10:00 AM PT",
    );
    expect(reminderEmail("morning", [ashe], options).subject).toBe(
      "Today: Ashe · Artist Presale at 10:00 AM PT",
    );
  });

  it("gives the date for upcoming drops", () => {
    const { subject, text } = reminderEmail("upcoming", [ashe], options);
    expect(subject).toBe(
      "Coming up: Ashe · Artist Presale on Sat, Oct 24 · 10:00 AM PT",
    );
    expect(text).toContain("Sat, Oct 24 · 10:00 AM PT — Ashe");
  });

  it("counts several drops and gives the first time", () => {
    const later = {
      ...ashe,
      saleWindowId: "b",
      startsAt: "2026-10-24T19:00:00Z",
    };
    expect(reminderEmail("evening", [ashe, later], options).subject).toBe(
      "Tomorrow: 2 drops, first at 10:00 AM PT",
    );
  });

  it("lists each drop with its links in plain text", () => {
    expect(reminderEmail("morning", [ashe], options).text).toBe(
      [
        "Today on your drop schedule:",
        "",
        "10:00 AM PT — Ashe · Artist Presale",
        "The Castro Theatre",
        "Sign up: https://signup.example/ashe",
        "Tickets: https://tickets.example/ashe",
        "",
        "All drops: https://concert-drops.vercel.app",
      ].join("\n"),
    );
  });

  it("links the buttons and skips missing ones", () => {
    const { html } = reminderEmail(
      "morning",
      [{ ...ashe, signUpUrl: null }],
      options,
    );
    expect(html).toContain('href="https://tickets.example/ashe"');
    expect(html).toContain(">Tickets</a>");
    expect(html).not.toContain(">Sign up</a>");
  });

  it("escapes names from Ticketmaster", () => {
    const { html } = reminderEmail(
      "morning",
      [{ ...ashe, artistNames: "Tom & Jerry <live>" }],
      options,
    );
    expect(html).toContain("Tom &amp; Jerry &lt;live&gt;");
  });
});

describe("escapeHtml", () => {
  it("escapes quotes in links", () => {
    expect(escapeHtml(`a"b'c`)).toBe("a&quot;b&#39;c");
  });
});
