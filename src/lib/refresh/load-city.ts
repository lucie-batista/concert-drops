import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { TicketmasterClient } from "@/lib/ticketmaster/client";

import {
  dropReplacedReschedules,
  matchEventsToArtists,
  type KnownArtist,
} from "./match-events";
import { saveCityEvents, type SaveSummary } from "./save-events";

/** How far ahead to look for shows. Ticketmaster rarely lists anything further out. */
const LOOKAHEAD_DAYS = 400;

export type CityToLoad = {
  id: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
};

export type LoadCitySummary = {
  sweptEvents: number;
  matchedEvents: number;
  saved: SaveSummary;
};

/**
 * Sweeps a city's music events on Ticketmaster, keeps the ones with my
 * artists, saves them and records when the city was loaded.
 */
export async function loadCityEvents(deps: {
  admin: SupabaseClient<Database>;
  ticketmaster: TicketmasterClient;
  city: CityToLoad;
  now: Date;
}): Promise<LoadCitySummary> {
  const { admin, ticketmaster, city, now } = deps;
  const artists = await allArtists(admin);

  const swept = await ticketmaster.sweepMusicEvents({
    latitude: city.latitude,
    longitude: city.longitude,
    radiusMiles: city.radius_miles,
    from: now,
    to: new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000),
  });
  const matched = dropReplacedReschedules(matchEventsToArtists(swept, artists));
  const saved = await saveCityEvents(
    admin,
    city.id,
    matched,
    now.toISOString(),
  );

  const { error } = await admin
    .from("cities")
    .update({ refreshed_at: new Date().toISOString() })
    .eq("id", city.id);
  if (error) throw error;

  return { sweptEvents: swept.length, matchedEvents: matched.length, saved };
}

/** All artists, paging past Supabase's default 1,000-row limit. */
async function allArtists(
  admin: SupabaseClient<Database>,
): Promise<KnownArtist[]> {
  const pageSize = 1000;
  const artists: KnownArtist[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("artists")
      .select("id, spotify_id, name")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    artists.push(
      ...data.map((a) => ({ id: a.id, spotifyId: a.spotify_id, name: a.name })),
    );
    if (data.length < pageSize) return artists;
  }
}
