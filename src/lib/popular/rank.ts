import { normalizeArtistName } from "@/lib/ticketmaster/match";

/** How many of the country's top artists count as popular. */
export const POPULAR_COUNT = 1000;

/** Last.fm's name for the country the Popular page follows. */
export const POPULAR_COUNTRY = "united states";

/** Looks up an artist's rank by name, ignoring case, accents and punctuation. */
export function popularRanks(
  artists: { rank: number; name: string }[],
): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const { rank, name } of artists) {
    const key = normalizeArtistName(name);
    if (key && !ranks.has(key)) ranks.set(key, rank);
  }
  return ranks;
}

/** The best rank of anyone on the bill, or null when nobody is popular. */
export function bestPopularRank(
  performers: { name: string }[],
  ranks: Map<string, number>,
): number | null {
  let best: number | null = null;
  for (const { name } of performers) {
    const rank = ranks.get(normalizeArtistName(name));
    if (rank !== undefined && (best === null || rank < best)) best = rank;
  }
  return best;
}
