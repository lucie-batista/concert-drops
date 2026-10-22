import type {
  SpotifyArtist,
  SpotifyFollowedArtistsResponse,
  SpotifyTimeRange,
  SpotifyTokenResponse,
  SpotifyTopArtistsResponse,
} from "./types";

const API_URL = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export class SpotifyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SpotifyError";
  }
}

/** The saved login no longer works (expired or revoked); the owner must log in again. */
export class SpotifyReauthRequiredError extends SpotifyError {
  constructor(status: number) {
    super("Spotify access expired or was revoked. Log in again.", status);
    this.name = "SpotifyReauthRequiredError";
  }
}

export function createSpotifyClient(options: {
  clientId: string;
  clientSecret: string;
  fetch?: typeof fetch;
}) {
  const { clientId, clientSecret, fetch: fetchImpl = fetch } = options;

  async function get<T>(accessToken: string, path: string): Promise<T> {
    const response = await fetchImpl(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401) {
      throw new SpotifyReauthRequiredError(401);
    }
    if (!response.ok) {
      throw new SpotifyError(
        `Spotify ${path.split("?")[0]} failed with status ${response.status}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  return {
    /** Trades the saved refresh token for a short-lived access token. */
    async refreshAccessToken(
      refreshToken: string,
    ): Promise<SpotifyTokenResponse> {
      const response = await fetchImpl(TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      if (response.status === 400) {
        // invalid_grant: the refresh token expired (six months) or was revoked.
        throw new SpotifyReauthRequiredError(400);
      }
      if (!response.ok) {
        throw new SpotifyError(
          `Spotify token refresh failed with status ${response.status}`,
          response.status,
        );
      }
      return (await response.json()) as SpotifyTokenResponse;
    },

    /** Up to 50 top artists for a time range, most listened first. */
    async getTopArtists(
      accessToken: string,
      timeRange: SpotifyTimeRange,
    ): Promise<SpotifyArtist[]> {
      const data = await get<SpotifyTopArtistsResponse>(
        accessToken,
        `/me/top/artists?time_range=${timeRange}&limit=50`,
      );
      return data.items;
    },

    /** Every followed artist, following Spotify's cursor pages. */
    async getFollowedArtists(accessToken: string): Promise<SpotifyArtist[]> {
      const artists: SpotifyArtist[] = [];
      let after: string | null | undefined;

      do {
        const params = new URLSearchParams({ type: "artist", limit: "50" });
        if (after) params.set("after", after);
        const data = await get<SpotifyFollowedArtistsResponse>(
          accessToken,
          `/me/following?${params}`,
        );
        artists.push(...data.artists.items);
        after = data.artists.next ? data.artists.cursors?.after : null;
      } while (after);

      return artists;
    },
  };
}

export type SpotifyClient = ReturnType<typeof createSpotifyClient>;
