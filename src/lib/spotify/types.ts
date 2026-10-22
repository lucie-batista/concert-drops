// The parts of Spotify Web API responses this app reads.
// https://developer.spotify.com/documentation/web-api

export type SpotifyImage = {
  url: string;
  width: number | null;
  height: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
};

export type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

export type SpotifyTopArtistsResponse = { items: SpotifyArtist[] };

export type SpotifyFollowedArtistsResponse = {
  artists: {
    items: SpotifyArtist[];
    cursors?: { after?: string | null };
    next: string | null;
  };
};

export type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
  /** Only present when Spotify rotates the refresh token. */
  refresh_token?: string;
};
