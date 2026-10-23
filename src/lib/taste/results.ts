import {
  groupDropsByShow,
  toOnSaleShows,
  type DropArtist,
  type DropRow,
  type OnSaleShow,
  type ShowDrops,
} from "@/lib/drops/group";

import type { TasteProfile } from "./profile";
import { tasteScore } from "./score";
import { venueSize } from "./venue-size";
import { vibeOf } from "./vibes";

/** An event row with what the quiz scores it on. */
export type CityEventRow = Omit<DropRow["events"], "event_artists"> & {
  genre: string | null;
  subgenre: string | null;
  image_url: string | null;
  performers: { id: string; name: string }[];
};

export type CityDropRow = Omit<DropRow, "events"> & { events: CityEventRow };

export type TasteResults = { drops: ShowDrops[]; onSale: OnSaleShow[] };

/** Shows at or above this score make the list. */
const MIN_SCORE = 30;
/** How many shows each list shows at most. */
const MAX_SHOWS = 30;
/** If too few shows clear the bar, top up with the best of the rest. */
const MIN_SHOWS = 5;
/** Festivals list dozens of acts; cards name the first few. */
const MAX_NAMES = 4;

/**
 * The city's drops and on-sale shows that fit a visitor's taste, best matches
 * only, in date order like my page.
 */
export function rankForTaste(
  profile: TasteProfile,
  dropRows: CityDropRow[],
  eventRows: CityEventRow[],
  fallbackTimeZone: string,
): TasteResults {
  const events = new Map<string, CityEventRow>();
  for (const e of [...eventRows, ...dropRows.map((r) => r.events)]) {
    events.set(e.id, e);
  }
  const score = (id: string) => tasteScore(profile, traitsOf(events.get(id)!));
  const withTaste = <T extends { eventId: string }>(show: T) => {
    const showScore = score(show.eventId);
    return {
      ...show,
      artists: artistsOf(events.get(show.eventId)!, showScore),
      score: showScore,
    };
  };

  const drops = groupDropsByShow(
    dropRows.map((r) => ({ ...r, events: { ...r.events, event_artists: [] } })),
    fallbackTimeZone,
  ).map(withTaste);
  const onSale = toOnSaleShows(
    eventRows.map((e) => ({ ...e, event_artists: [] })),
    fallbackTimeZone,
    new Set(drops.map((d) => d.eventId)),
  ).map(withTaste);

  return { drops: bestOf(drops), onSale: bestOf(onSale) };
}

function traitsOf(event: CityEventRow) {
  return {
    vibe: vibeOf(event.genre, event.subgenre),
    size: venueSize(event.venues?.name ?? null),
    performerIds: event.performers.map((p) => p.id),
  };
}

/** The bill as card artists; the event photo belongs to the headliner. */
function artistsOf(event: CityEventRow, score: number): DropArtist[] {
  return event.performers.slice(0, MAX_NAMES).map((p, i) => ({
    id: p.id,
    name: p.name,
    imageUrl: i === 0 ? event.image_url : null,
    score,
  }));
}

/** The best matches, kept in their original (date) order. */
function bestOf<T extends { score: number }>(shows: T[]): T[] {
  const ranked = shows
    .map((show, index) => ({ show, index }))
    .filter(({ show }) => show.score > 0)
    .sort((a, b) => b.show.score - a.show.score || a.index - b.index);
  const strong = ranked.filter(({ show }) => show.score >= MIN_SCORE);
  const picked = (strong.length >= MIN_SHOWS ? strong : ranked).slice(
    0,
    strong.length >= MIN_SHOWS ? MAX_SHOWS : MIN_SHOWS,
  );
  return picked.sort((a, b) => a.index - b.index).map(({ show }) => show);
}
