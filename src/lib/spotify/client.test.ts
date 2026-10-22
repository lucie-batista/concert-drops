import { describe, expect, it, vi } from "vitest";

import {
  createSpotifyClient,
  SpotifyError,
  SpotifyReauthRequiredError,
} from "./client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

function clientWith(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const r of responses) fetchMock.mockResolvedValueOnce(r);
  const client = createSpotifyClient({
    clientId: "id",
    clientSecret: "secret",
    fetch: fetchMock,
  });
  return { client, fetchMock };
}

describe("refreshAccessToken", () => {
  it("posts the refresh token with the app's credentials", async () => {
    const { client, fetchMock } = clientWith(
      json({ access_token: "access", expires_in: 3600 }),
    );

    const token = await client.refreshAccessToken("refresh-123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://accounts.spotify.com/api/token");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa("id:secret")}`,
    );
    expect(String(init?.body)).toBe(
      "grant_type=refresh_token&refresh_token=refresh-123",
    );
    expect(token.access_token).toBe("access");
  });

  it("asks for a new login when the refresh token is rejected", async () => {
    const { client } = clientWith(json({ error: "invalid_grant" }, 400));
    await expect(client.refreshAccessToken("old")).rejects.toBeInstanceOf(
      SpotifyReauthRequiredError,
    );
  });
});

describe("getTopArtists", () => {
  it("requests 50 artists for the time range", async () => {
    const { client, fetchMock } = clientWith(
      json({ items: [{ id: "a", name: "A" }] }),
    );

    const artists = await client.getTopArtists("access", "short_term");

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
    );
    expect(
      (fetchMock.mock.calls[0][1]?.headers as Record<string, string>)
        .Authorization,
    ).toBe("Bearer access");
    expect(artists).toEqual([{ id: "a", name: "A" }]);
  });

  it("raises SpotifyError for other failures", async () => {
    const { client } = clientWith(json({}, 503));
    const error = await client
      .getTopArtists("access", "long_term")
      .catch((e) => e);
    expect(error).toBeInstanceOf(SpotifyError);
    expect(error.status).toBe(503);
  });
});

describe("getFollowedArtists", () => {
  it("follows cursor pages until the end", async () => {
    const { client, fetchMock } = clientWith(
      json({
        artists: {
          items: [{ id: "a", name: "A" }],
          cursors: { after: "a" },
          next: "https://api.spotify.com/v1/me/following?after=a",
        },
      }),
      json({
        artists: {
          items: [{ id: "b", name: "B" }],
          cursors: { after: null },
          next: null,
        },
      }),
    );

    const artists = await client.getFollowedArtists("access");

    expect(artists.map((a) => a.id)).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("after=a");
  });
});
