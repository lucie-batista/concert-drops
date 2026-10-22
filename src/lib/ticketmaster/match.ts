import type { TmAttraction } from "./types";

export type SpotifyArtistRef = { spotifyId: string; name: string };

export type AttractionMatch = {
  attractionId: string;
  method: "spotify" | "name";
};

/**
 * Picks the Ticketmaster attraction for a Spotify artist, or null if unsure.
 *
 * 1. An attraction that links to the artist's Spotify page is a certain match.
 * 2. Otherwise, accept a name match only if exactly one attraction has the same name
 *    and doesn't link to a different Spotify artist. Searches return lots of tribute
 *    acts and same-name artists, so guessing would be worse than no match.
 */
export function matchAttraction(
  artist: SpotifyArtistRef,
  attractions: TmAttraction[],
): AttractionMatch | null {
  const bySpotify = attractions.find((a) =>
    spotifyIdsOf(a).includes(artist.spotifyId),
  );
  if (bySpotify) {
    return { attractionId: bySpotify.id, method: "spotify" };
  }

  const name = normalizeArtistName(artist.name);
  const candidates = attractions.filter(
    (a) => normalizeArtistName(a.name) === name && spotifyIdsOf(a).length === 0,
  );
  if (candidates.length === 1) {
    return { attractionId: candidates[0].id, method: "name" };
  }

  return null;
}

/** "Beyoncé" → "beyonce", "Florence + The Machine" → "florence the machine". */
export function normalizeArtistName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Spotify artist IDs from an attraction's Spotify links. */
export function spotifyIdsOf(attraction: TmAttraction): string[] {
  return (attraction.externalLinks?.spotify ?? [])
    .map((link) => /open\.spotify\.com\/artist\/([A-Za-z0-9]+)/.exec(link.url))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1]);
}
