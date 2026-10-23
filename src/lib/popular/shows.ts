import {
  groupDropsByShow,
  toOnSaleShows,
  type OnSaleShow,
  type ShowDrops,
} from "@/lib/drops/group";
import {
  artistsOf,
  type CityDropRow,
  type CityEventRow,
} from "@/lib/taste/results";

import { POPULAR_COUNT } from "./rank";

/** An event row with its popularity rank. */
export type PopularEventRow = CityEventRow & { popular_rank: number | null };

export type PopularDropRow = Omit<CityDropRow, "events"> & {
  events: PopularEventRow;
};

export type Popular<T> = T & { popularRank: number };

export type PopularShows = {
  drops: Popular<ShowDrops>[];
  onSale: Popular<OnSaleShow>[];
};

/**
 * The city's drops and on-sale shows with a popular artist on the bill, in
 * date order. Scores rank the most popular highest, for the sort toggle.
 */
export function toPopularShows(
  dropRows: PopularDropRow[],
  eventRows: PopularEventRow[],
  fallbackTimeZone: string,
): PopularShows {
  const events = new Map<string, PopularEventRow>();
  for (const e of [...eventRows, ...dropRows.map((r) => r.events)]) {
    if (e.popular_rank !== null) events.set(e.id, e);
  }
  const withRank = <T extends { eventId: string }>(show: T) => {
    const event = events.get(show.eventId)!;
    const rank = event.popular_rank!;
    const score = POPULAR_COUNT + 1 - rank;
    return {
      ...show,
      artists: artistsOf(event, score),
      score,
      popularRank: rank,
    };
  };

  const drops = groupDropsByShow(
    dropRows
      .filter((r) => events.has(r.events.id))
      .map((r) => ({ ...r, events: { ...r.events, event_artists: [] } })),
    fallbackTimeZone,
  ).map(withRank);
  const onSale = toOnSaleShows(
    eventRows
      .filter((e) => events.has(e.id))
      .map((e) => ({ ...e, event_artists: [] })),
    fallbackTimeZone,
    new Set(drops.map((d) => d.eventId)),
  ).map(withRank);

  return { drops, onSale };
}
