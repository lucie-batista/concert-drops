import { describe, expect, it } from "vitest";

import eventsFixture from "./__fixtures__/events-sf.json";
import { normalizeEvent, normalizeEvents } from "./normalize";
import type { TmEvent } from "./types";

const events = eventsFixture._embedded.events as TmEvent[];
const byId = (id: string) => events.find((e) => e.id === id)!;

describe("normalizeEvent", () => {
  it("keeps every presale plus the general on-sale, in start order", () => {
    const gnash = normalizeEvent(byId("G5vYZ_A5NTXU-"));

    expect(gnash.saleWindows.map((w) => [w.kind, w.name])).toEqual([
      // Ticketmaster lists these out of order: Mastercard starts a minute before Artist.
      ["presale", "Mastercard Presale"],
      ["presale", "Artist Presale"],
      ["presale", "LIVE NATION PRESALE"],
      ["presale", "Venue Presale"],
      ["presale", "Spotify Presale"],
      ["presale", "Mastercard Preferred Tickets"],
      ["public", "General on-sale"],
    ]);
    const startTimes = gnash.saleWindows.map((w) => w.startsAt);
    expect(startTimes).toEqual([...startTimes].sort());
  });

  it("keeps presale sign-up links and descriptions", () => {
    const liveNation = normalizeEvent(byId("G5vYZ_A5NTXU-")).saleWindows.find(
      (w) => w.name === "LIVE NATION PRESALE",
    );
    expect(liveNation?.url).toBe("https://www.livenation.com/allaccess");
    expect(liveNation?.description).toMatch(/All Access/);
  });

  it("reads the venue, time zone and status", () => {
    const gnash = normalizeEvent(byId("G5vYZ_A5NTXU-"));
    expect(gnash).toMatchObject({
      status: "rescheduled",
      startsAt: "2026-10-22T03:00:00Z",
      localDate: "2026-10-21",
      timeZone: "America/Los_Angeles",
      attractionIds: ["K8vZ917f5O0"],
    });
    expect(gnash.venue).toMatchObject({
      name: "Cafe Du Nord",
      city: "San Francisco",
      stateCode: "CA",
      latitude: 37.7665858,
      longitude: -122.4302987,
    });
  });

  it("lists every artist on a co-headlined show", () => {
    const malcolmTodd = normalizeEvent(byId("G5vYZ_GFHHYVA"));
    expect(malcolmTodd.attractionIds).toHaveLength(2);
    expect(malcolmTodd.venue?.name).toBe("Fox Theater - Oakland");
  });

  it("handles a cancelled show with no artists or presales", () => {
    const cancelled = normalizeEvent(byId("rZ7HnEZ1Af-3aS"));
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.attractionIds).toEqual([]);
    expect(cancelled.saleWindows.every((w) => w.kind === "public")).toBe(true);
  });

  it("leaves the start time empty when the time is TBA", () => {
    const tba: TmEvent = {
      ...byId("G5vYZ_A5NTXU-"),
      dates: {
        start: {
          localDate: "2027-03-01",
          dateTime: "2027-03-01T08:00:00Z",
          timeTBA: true,
        },
      },
    };
    expect(normalizeEvent(tba)).toMatchObject({
      startsAt: null,
      localDate: "2027-03-01",
    });
  });

  it("skips sale windows without a start time", () => {
    const noStart: TmEvent = {
      ...byId("G5vYZ_A5NTXU-"),
      sales: { public: { startTBD: true }, presales: [{ name: "Fan Club" }] },
    };
    expect(normalizeEvent(noStart).saleWindows).toEqual([]);
  });
});

describe("normalizeEvents", () => {
  it("drops Ticketmaster test events", () => {
    const withTest = [...events, { ...events[0], id: "test-1", test: true }];
    expect(normalizeEvents(withTest).map((e) => e.id)).not.toContain("test-1");
    expect(normalizeEvents(withTest)).toHaveLength(events.length);
  });
});
