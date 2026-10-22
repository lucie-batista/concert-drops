import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SpotifyReauthRequiredError,
  type SpotifyClient,
} from "@/lib/spotify/client";
import {
  syncSpotifyArtists,
  type SpotifySyncSummary,
} from "@/lib/spotify/sync";
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

export type RefreshSummary = {
  city: string;
  spotify: SpotifySyncSummary | { error: string };
  sweptEvents: number;
  ticketmasterRequests: number;
  matchedEvents: number;
  saved: SaveSummary;
  durationMs: number;
};

/**
 * The daily refresh: update my artists from Spotify, sweep the current city's
 * music events on Ticketmaster, keep the ones with my artists and save them.
 * Each run is logged in refresh_runs.
 */
export async function runRefresh(deps: {
  admin: SupabaseClient<Database>;
  spotify: SpotifyClient;
  ticketmaster: TicketmasterClient;
  now?: Date;
}): Promise<RefreshSummary> {
  const { admin, spotify, ticketmaster } = deps;
  const now = deps.now ?? new Date();
  const startedAt = now.toISOString();

  const { data: run, error: runError } = await admin
    .from("refresh_runs")
    .insert({ started_at: startedAt })
    .select("id")
    .single();
  if (runError) throw runError;

  try {
    // If Spotify fails (e.g. the six-month login expired), carry on with the
    // artists already saved so drops still update.
    let spotifySummary: RefreshSummary["spotify"];
    try {
      spotifySummary = await syncSpotifyArtists(admin, spotify);
    } catch (error) {
      if (!(error instanceof SpotifyReauthRequiredError)) throw error;
      spotifySummary = { error: error.message };
    }

    const city = await currentCity(admin);
    const artists = await allArtists(admin);

    const swept = await ticketmaster.sweepMusicEvents({
      latitude: city.latitude,
      longitude: city.longitude,
      radiusMiles: city.radius_miles,
      from: now,
      to: new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000),
    });
    const matched = dropReplacedReschedules(
      matchEventsToArtists(swept, artists),
    );
    const saved = await saveCityEvents(admin, city.id, matched, startedAt);

    const summary: RefreshSummary = {
      city: city.id,
      spotify: spotifySummary,
      sweptEvents: swept.length,
      ticketmasterRequests: ticketmaster.requestCount,
      matchedEvents: matched.length,
      saved,
      durationMs: Date.now() - now.getTime(),
    };

    await admin
      .from("refresh_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        summary,
      })
      .eq("id", run.id);
    return summary;
  } catch (error) {
    await admin
      .from("refresh_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: errorMessage(error),
      })
      .eq("id", run.id);
    throw error;
  }
}

async function currentCity(admin: SupabaseClient<Database>) {
  const { data, error } = await admin
    .from("settings")
    .select("cities(id, latitude, longitude, radius_miles)")
    .single();
  if (error) throw error;
  if (!data.cities) throw new Error("The current city is missing.");
  return data.cities;
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

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
