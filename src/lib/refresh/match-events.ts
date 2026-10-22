import { normalizeArtistName } from "@/lib/ticketmaster/match";
import type { NormalizedEvent } from "@/lib/ticketmaster/normalize";

export type KnownArtist = { id: string; spotifyId: string; name: string };

export type MatchedEvent = { event: NormalizedEvent; artistIds: string[] };

/**
 * Keeps the events featuring at least one of my artists. An attraction matches
 * by Spotify ID when Ticketmaster links one; otherwise by exact name, but only
 * when the name belongs to exactly one of my artists and the attraction doesn't
 * link to a different Spotify artist.
 */
export function matchEventsToArtists(
  events: NormalizedEvent[],
  artists: KnownArtist[],
): MatchedEvent[] {
  const bySpotifyId = new Map(artists.map((a) => [a.spotifyId, a.id]));

  // null marks a name shared by more than one of my artists: too ambiguous.
  const byName = new Map<string, string | null>();
  for (const artist of artists) {
    const key = normalizeArtistName(artist.name);
    byName.set(key, byName.has(key) ? null : artist.id);
  }

  const matched: MatchedEvent[] = [];
  for (const event of events) {
    const artistIds = new Set<string>();
    for (const attraction of event.attractions) {
      const viaSpotify = attraction.spotifyIds
        .map((id) => bySpotifyId.get(id))
        .find((id) => id !== undefined);
      if (viaSpotify) {
        artistIds.add(viaSpotify);
      } else if (attraction.spotifyIds.length === 0) {
        const viaName = byName.get(normalizeArtistName(attraction.name));
        if (viaName) artistIds.add(viaName);
      }
    }
    if (artistIds.size > 0) {
      matched.push({ event, artistIds: [...artistIds] });
    }
  }
  return matched;
}

/**
 * Ticketmaster keeps a rescheduled show's original listing alongside the new one.
 * Drops a "rescheduled" listing when another listing for the same venue, day and
 * artist exists.
 */
export function dropReplacedReschedules(
  events: MatchedEvent[],
): MatchedEvent[] {
  const slot = (m: MatchedEvent) =>
    `${m.event.venue?.id ?? "?"}|${m.event.localDate ?? "?"}`;
  const replacements = events.filter((m) => m.event.status !== "rescheduled");

  return events.filter(
    (m) =>
      m.event.status !== "rescheduled" ||
      !replacements.some(
        (r) =>
          slot(r) === slot(m) &&
          r.artistIds.some((id) => m.artistIds.includes(id)),
      ),
  );
}
