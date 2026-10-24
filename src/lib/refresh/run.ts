import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { LastfmClient } from "@/lib/lastfm/client";
import { syncPopularArtists } from "@/lib/popular/sync";
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

import { loadCityEvents } from "./load-city";
import type { SaveSummary } from "./save-events";

export type RefreshSummary = {
  city: string;
  spotify: SpotifySyncSummary | { error: string };
  popular: { artists: number } | { error: string } | "skipped";
  sweptEvents: number;
  ticketmasterRequests: number;
  matchedEvents: number;
  saved: SaveSummary;
  durationMs: number;
};

/**
 * The daily refresh: update my artists from Spotify and the US's top artists
 * from Last.fm, sweep the current city's music events on Ticketmaster, match
 * them to both and save them.
 * Each run is logged in refresh_runs.
 */
export async function runRefresh(deps: {
  admin: SupabaseClient<Database>;
  spotify: SpotifyClient;
  ticketmaster: TicketmasterClient;
  /** Leave out to keep yesterday's popular artists. */
  lastfm?: LastfmClient;
  now?: Date;
}): Promise<RefreshSummary> {
  const { admin, spotify, ticketmaster, lastfm } = deps;
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

    // Same for Last.fm: yesterday's popular artists are still good enough.
    let popularSummary: RefreshSummary["popular"] = "skipped";
    if (lastfm) {
      try {
        popularSummary = await syncPopularArtists(admin, lastfm, now);
      } catch (error) {
        popularSummary = { error: errorMessage(error) };
      }
    }

    const city = await currentCity(admin);
    const loaded = await loadCityEvents({ admin, ticketmaster, city, now });

    const summary: RefreshSummary = {
      city: city.id,
      spotify: spotifySummary,
      popular: popularSummary,
      sweptEvents: loaded.sweptEvents,
      ticketmasterRequests: ticketmaster.requestCount,
      matchedEvents: loaded.matchedEvents,
      saved: loaded.saved,
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

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
