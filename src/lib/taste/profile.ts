import { VIBE_IDS, type VibeId } from "./vibes";
import type { VenueSize } from "./venue-size";

/**
 * What a visitor's quiz answers say about their taste. It lives in the results
 * link, so nothing about visitors is stored.
 */
export type TasteProfile = {
  /** How many times each vibe was picked. */
  vibes: Partial<Record<VibeId, number>>;
  /** Ticketmaster attraction ids of acts they chose. */
  performers: string[];
  size: VenueSize | null;
};

const SIZES: ReadonlySet<string> = new Set(["small", "mid", "big"]);
const MAX_PICKS = 9;
const MAX_PERFORMERS = 12;
const PERFORMER_ID = /^[\w-]{1,40}$/;

/** `v=indie.2,pop.1&a=K8vZ917,K8vZ918&s=small` */
export function profileToSearch(profile: TasteProfile): string {
  const params = new URLSearchParams();
  const vibes = Object.entries(profile.vibes)
    .filter(([, n]) => n && n > 0)
    .map(([id, n]) => `${id}.${n}`);
  if (vibes.length) params.set("v", vibes.join(","));
  if (profile.performers.length) params.set("a", profile.performers.join(","));
  if (profile.size) params.set("s", profile.size);
  // Keep commas readable in the link.
  return params.toString().replace(/%2C/g, ",");
}

/**
 * Reads a profile back from the results link, ignoring anything malformed.
 * Null when there's nothing to go on.
 */
export function profileFromSearch(
  params: Record<string, string | string[] | undefined>,
): TasteProfile | null {
  const first = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const vibes: TasteProfile["vibes"] = {};
  for (const part of first("v").split(",")) {
    const [id, count] = part.split(".");
    const n = Number(count);
    if (VIBE_IDS.has(id) && Number.isInteger(n) && n > 0) {
      vibes[id as VibeId] = Math.min(n, MAX_PICKS);
    }
  }

  const performers = [
    ...new Set(
      first("a")
        .split(",")
        .filter((id) => PERFORMER_ID.test(id)),
    ),
  ].slice(0, MAX_PERFORMERS);

  const s = first("s");
  const size = SIZES.has(s) ? (s as VenueSize) : null;

  if (Object.keys(vibes).length === 0 && performers.length === 0 && !size) {
    return null;
  }
  return { vibes, performers, size };
}
