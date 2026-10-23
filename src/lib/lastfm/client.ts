const API_URL = "https://ws.audioscrobbler.com/2.0/";

/** Last.fm pages charts up to 1,000 artists at a time. */
const PAGE_SIZE = 500;

export class LastfmError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LastfmError";
  }
}

export type TopArtist = {
  /** 1 = most listened to. */
  rank: number;
  name: string;
  listeners: number | null;
};

type TopArtistsResponse = {
  topartists?: {
    artist?: { name: string; listeners?: string }[];
  };
  error?: number;
  message?: string;
};

export function createLastfmClient(options: {
  apiKey: string;
  fetch?: typeof fetch;
}) {
  const { apiKey, fetch: fetchImpl = fetch } = options;

  return {
    /** The most listened-to artists in a country, most popular first. */
    async topArtists(country: string, count: number): Promise<TopArtist[]> {
      const artists: TopArtist[] = [];
      for (let page = 1; artists.length < count; page++) {
        const url = new URL(API_URL);
        url.search = new URLSearchParams({
          method: "geo.gettopartists",
          country,
          limit: String(PAGE_SIZE),
          page: String(page),
          api_key: apiKey,
          format: "json",
        }).toString();

        const response = await fetchImpl(url);
        const body = (await response
          .json()
          .catch(() => ({}))) as TopArtistsResponse;
        if (!response.ok || body.error) {
          throw new LastfmError(
            `Last.fm top artists failed (${response.status}): ${body.message ?? "no details"}`,
            response.status,
          );
        }

        const pageArtists = body.topartists?.artist ?? [];
        for (const a of pageArtists) {
          const listeners = Number(a.listeners);
          artists.push({
            rank: artists.length + 1,
            name: a.name,
            listeners: Number.isFinite(listeners) ? listeners : null,
          });
        }
        if (pageArtists.length < PAGE_SIZE) break;
      }
      return artists.slice(0, count);
    },
  };
}

export type LastfmClient = ReturnType<typeof createLastfmClient>;
