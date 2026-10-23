import type { TasteProfile } from "./profile";
import type { VenueSize } from "./venue-size";
import type { VibeId } from "./vibes";

/** What the quiz can judge a show by. */
export type ShowTraits = {
  vibe: VibeId | null;
  size: VenueSize | null;
  performerIds: string[];
};

/** Most points each part can add. */
const WEIGHTS = {
  vibe: 60, // scaled by how often the vibe was picked, vs. the favorite
  size: 25, // the venue size they asked for
  performer: 40, // an act they chose in the quiz
};

const SIZE_ORDER: VenueSize[] = ["small", "mid", "big"];

/**
 * How well a show fits a visitor's quiz answers, 0–100, on the same scale as
 * my Spotify match scores so the same badges apply.
 */
export function tasteScore(profile: TasteProfile, show: ShowTraits): number {
  let score = 0;

  const favorite = Math.max(0, ...Object.values(profile.vibes));
  if (show.vibe && favorite > 0) {
    score += (WEIGHTS.vibe * (profile.vibes[show.vibe] ?? 0)) / favorite;
  }

  if (profile.size) {
    score += sizePoints(profile.size, show.size);
  }

  if (show.performerIds.some((id) => profile.performers.includes(id))) {
    score += WEIGHTS.performer;
  }

  return Math.round(Math.min(score, 100));
}

/** Full points for the right size, some for the next size over or unknown. */
function sizePoints(wanted: VenueSize, actual: VenueSize | null): number {
  if (!actual) return WEIGHTS.size * 0.4;
  const gap = Math.abs(SIZE_ORDER.indexOf(wanted) - SIZE_ORDER.indexOf(actual));
  if (gap === 0) return WEIGHTS.size;
  if (gap === 1) return WEIGHTS.size * 0.4;
  return 0;
}
