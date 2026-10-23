import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { LastfmClient } from "@/lib/lastfm/client";
import type { Database } from "@/lib/supabase/database.types";

import { POPULAR_COUNT, POPULAR_COUNTRY, popularRanks } from "./rank";

/** Replaces the popular artists with today's top artists from Last.fm. */
export async function syncPopularArtists(
  admin: SupabaseClient<Database>,
  lastfm: LastfmClient,
  now: Date,
): Promise<{ artists: number }> {
  const top = await lastfm.topArtists(POPULAR_COUNTRY, POPULAR_COUNT);
  if (top.length === 0) throw new Error("Last.fm returned no top artists.");

  const { error } = await admin.from("popular_artists").upsert(
    top.map((a) => ({
      rank: a.rank,
      name: a.name,
      listeners: a.listeners,
      updated_at: now.toISOString(),
    })),
    { onConflict: "rank" },
  );
  if (error) throw error;

  // A shorter list than yesterday's leaves old rows past the end.
  const { error: deleteError } = await admin
    .from("popular_artists")
    .delete()
    .gt("rank", top.length);
  if (deleteError) throw deleteError;

  return { artists: top.length };
}

/** The saved popular artists, as a name → rank lookup. */
export async function loadPopularRanks(
  admin: SupabaseClient<Database>,
): Promise<Map<string, number>> {
  const { data, error } = await admin
    .from("popular_artists")
    .select("rank, name")
    .order("rank")
    .range(0, POPULAR_COUNT - 1);
  if (error) throw error;
  return popularRanks(data);
}
