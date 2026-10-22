import { describe, expect, it, vi } from "vitest";

import gnashSearch from "./__fixtures__/attractions-gnash.json";
import eventsFixture from "./__fixtures__/events-sf.json";
import { createTicketmasterClient, TicketmasterError } from "./client";

const API_KEY = "test-key-123";
// No pacing or retry waits in tests.
const FAST = { minIntervalMs: 0, retryDelayMs: 0 };

function fakeFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(body), { status }),
  );
}

function requestedUrl(fetchMock: ReturnType<typeof fakeFetch>): URL {
  return new URL(String(fetchMock.mock.calls[0][0]));
}

describe("createTicketmasterClient", () => {
  it("searches music attractions by keyword", async () => {
    const fetchMock = fakeFetch(gnashSearch);
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    const attractions = await client.searchAttractions("gnash");

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/discovery/v2/attractions.json");
    expect(url.searchParams.get("keyword")).toBe("gnash");
    expect(url.searchParams.get("classificationName")).toBe("music");
    expect(url.searchParams.get("apikey")).toBe(API_KEY);
    expect(attractions).toHaveLength(4);
  });

  it("finds events near a point and normalizes them", async () => {
    const fetchMock = fakeFetch(eventsFixture);
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    const events = await client.findEvents({
      attractionId: "K8vZ917f5O0",
      latitude: 37.7749,
      longitude: -122.4194,
      radiusMiles: 25,
    });

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/discovery/v2/events.json");
    expect(url.searchParams.get("attractionId")).toBe("K8vZ917f5O0");
    expect(url.searchParams.get("geoPoint")).toMatch(/^9q8yy/);
    expect(url.searchParams.get("radius")).toBe("25");
    expect(url.searchParams.get("unit")).toBe("miles");
    expect(events.map((e) => e.id)).toContain("G5vYZ_A5NTXU-");
    expect(events[0].saleWindows.length).toBeGreaterThan(0);
  });

  it("returns an empty list when nothing matches", async () => {
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fakeFetch({ page: { totalElements: 0 } }),
    });
    await expect(client.searchAttractions("nobody")).resolves.toEqual([]);
  });

  it("throws a TicketmasterError without leaking the API key", async () => {
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fakeFetch({ fault: "rate limit" }, 429),
    });

    const error = await client.searchAttractions("gnash").catch((e) => e);

    expect(error).toBeInstanceOf(TicketmasterError);
    expect(error.status).toBe(429);
    expect(error.message).not.toContain(API_KEY);
  });
});

describe("sweepMusicEvents", () => {
  const sweep = {
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMiles: 25,
    from: new Date("2026-10-22T00:00:00Z"),
    to: new Date("2027-10-22T00:00:00Z"),
  };

  const event = (id: string) => ({
    id,
    name: `Event ${id}`,
    dates: { start: { localDate: "2026-11-01" } },
  });

  /** Responds with `total` results per date window, `perPage` events per page. */
  function windowedFetch(totalFor: (from: string, to: string) => number) {
    return vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      const from = url.searchParams.get("startDateTime")!;
      const to = url.searchParams.get("endDateTime")!;
      const page = Number(url.searchParams.get("page"));
      const total = totalFor(from, to);
      const size = Number(url.searchParams.get("size"));
      const count = Math.max(0, Math.min(size, total - page * size));
      const events = Array.from({ length: count }, (_, i) =>
        event(`${from}-${page * size + i}`),
      );
      return new Response(
        JSON.stringify({
          _embedded: { events },
          page: {
            size,
            totalElements: total,
            totalPages: Math.ceil(total / size),
            number: page,
          },
        }),
      );
    });
  }

  it("pages through a city with fewer than 1,000 events", async () => {
    const fetchMock = windowedFetch(() => 450);
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    const events = await client.sweepMusicEvents(sweep);

    expect(events).toHaveLength(450);
    expect(fetchMock).toHaveBeenCalledTimes(3); // pages of 200, 200, 50
    const url = requestedUrl(fetchMock);
    expect(url.searchParams.get("classificationName")).toBe("music");
    expect(url.searchParams.get("startDateTime")).toBe("2026-10-22T00:00:00Z");
    expect(url.searchParams.get("endDateTime")).toBe("2027-10-22T00:00:00Z");
  });

  it("splits the date range when a search has over 1,000 results", async () => {
    // The full year has 1,500 events; each half has 750.
    const fetchMock = windowedFetch((from, to) =>
      from === "2026-10-22T00:00:00Z" && to === "2027-10-22T00:00:00Z"
        ? 1500
        : 750,
    );
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    const events = await client.sweepMusicEvents(sweep);

    expect(events).toHaveLength(1500);
    // 1 probe of the full range, then 4 pages for each half.
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(client.requestCount).toBe(9);
  });

  it("removes events that appear in two windows", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            _embedded: { events: [event("same"), event("same")] },
            page: { size: 200, totalElements: 2, totalPages: 1, number: 0 },
          }),
        ),
    );
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    expect(await client.sweepMusicEvents(sweep)).toHaveLength(1);
  });

  it("retries when Ticketmaster asks it to slow down", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            _embedded: { events: [event("a")] },
            page: { size: 200, totalElements: 1, totalPages: 1, number: 0 },
          }),
        ),
      );
    const client = createTicketmasterClient({
      ...FAST,
      apiKey: API_KEY,
      fetch: fetchMock,
    });

    expect(await client.sweepMusicEvents(sweep)).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
