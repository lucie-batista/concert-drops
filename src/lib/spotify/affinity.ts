import type { SpotifyArtist, SpotifyImage, SpotifyTimeRange } from "./types";

export type AffinitySource =
  "top_short_term" | "top_medium_term" | "top_long_term" | "followed";

export type ArtistLists = Record<SpotifyTimeRange, SpotifyArtist[]> & {
  followed: SpotifyArtist[];
};

export type ArtistRecord = {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
};

export type AffinityRecord = {
  spotifyId: string;
  source: AffinitySource;
  /** 1-based position in a top list; null for followed artists. */
  rank: number | null;
};

/**
 * Merges Spotify's top and followed lists into one row per artist, plus one
 * affinity row for each list the artist appears in.
 */
export function combineArtistLists(lists: ArtistLists): {
  artists: ArtistRecord[];
  affinity: AffinityRecord[];
} {
  const artists = new Map<string, ArtistRecord>();
  const affinity: AffinityRecord[] = [];

  const add = (
    items: SpotifyArtist[],
    source: AffinitySource,
    ranked: boolean,
  ) => {
    items.forEach((artist, index) => {
      if (!artists.has(artist.id)) {
        artists.set(artist.id, {
          spotifyId: artist.id,
          name: artist.name,
          imageUrl: pickImage(artist.images),
          genres: artist.genres ?? [],
        });
      }
      affinity.push({
        spotifyId: artist.id,
        source,
        rank: ranked ? index + 1 : null,
      });
    });
  };

  add(lists.short_term, "top_short_term", true);
  add(lists.medium_term, "top_medium_term", true);
  add(lists.long_term, "top_long_term", true);
  add(lists.followed, "followed", false);

  return { artists: [...artists.values()], affinity };
}

/** The smallest image that's still at least 300px wide, else the largest available. */
export function pickImage(images: SpotifyImage[] = []): string | null {
  if (images.length === 0) return null;
  const bySize = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (bySize.find((i) => (i.width ?? 0) >= 300) ?? bySize.at(-1)!).url;
}
