import { describe, expect, it, vi } from "vitest";

import { createLastfmClient, LastfmError } from "./client";

function artists(from: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Artist ${from + i}`,
    listeners: String(1_000_000 - from - i),
  }));
}

function pages(...bodies: unknown[]) {
  const queue = [...bodies];
  return vi.fn<typeof fetch>(
    async () => new Response(JSON.stringify(queue.shift())),
  );
}

describe("createLastfmClient", () => {
  it("asks Last.fm for a country's top artists", async () => {
    const fetchMock = pages({ topartists: { artist: artists(1, 3) } });
    const client = createLastfmClient({ apiKey: "key", fetch: fetchMock });

    await expect(client.topArtists("united states", 10)).resolves.toEqual([
      { rank: 1, name: "Artist 1", listeners: 999_999 },
      { rank: 2, name: "Artist 2", listeners: 999_998 },
      { rank: 3, name: "Artist 3", listeners: 999_997 },
    ]);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe(
      "https://ws.audioscrobbler.com/2.0/",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      method: "geo.gettopartists",
      country: "united states",
      limit: "500",
      page: "1",
      api_key: "key",
      format: "json",
    });
  });

  it("pages until it has enough, ranking across pages", async () => {
    const fetchMock = pages(
      { topartists: { artist: artists(1, 500) } },
      { topartists: { artist: artists(501, 500) } },
    );
    const client = createLastfmClient({ apiKey: "key", fetch: fetchMock });

    const top = await client.topArtists("united states", 600);
    expect(top).toHaveLength(600);
    expect(top.at(-1)).toMatchObject({ rank: 600, name: "Artist 600" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws Last.fm's message on an error", async () => {
    const client = createLastfmClient({
      apiKey: "bad",
      fetch: pages({ error: 10, message: "Invalid API key" }),
    });

    const error = await client
      .topArtists("united states", 10)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LastfmError);
    expect((error as LastfmError).message).toContain("Invalid API key");
  });
});
