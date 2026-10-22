import { describe, expect, it, vi } from "vitest";

import gnashSearch from "./__fixtures__/attractions-gnash.json";
import eventsFixture from "./__fixtures__/events-sf.json";
import { createTicketmasterClient, TicketmasterError } from "./client";

const API_KEY = "test-key-123";

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
      apiKey: API_KEY,
      fetch: fakeFetch({ page: { totalElements: 0 } }),
    });
    await expect(client.searchAttractions("nobody")).resolves.toEqual([]);
  });

  it("throws a TicketmasterError without leaking the API key", async () => {
    const client = createTicketmasterClient({
      apiKey: API_KEY,
      fetch: fakeFetch({ fault: "rate limit" }, 429),
    });

    const error = await client.searchAttractions("gnash").catch((e) => e);

    expect(error).toBeInstanceOf(TicketmasterError);
    expect(error.status).toBe(429);
    expect(error.message).not.toContain(API_KEY);
  });
});
