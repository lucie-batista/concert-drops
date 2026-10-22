import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { combineArtistLists } from "./affinity";
import type { SpotifyClient } from "./client";

export class SpotifyNotConnectedError extends Error {
  constructor() {
    super("Spotify isn't connected yet. Log in as the owner first.");
    this.name = "SpotifyNotConnectedError";
  }
}

export type SpotifySyncSummary = {
  artists: number;
  topShortTerm: number;
  topMediumTerm: number;
  topLongTerm: number;
  followed: number;
  refreshTokenRotated: boolean;
};

/**
 * Pulls the owner's top and followed artists from Spotify and stores them,
 * along with which lists each artist is on.
 */
export async function syncSpotifyArtists(
  admin: SupabaseClient<Database>,
  spotify: SpotifyClient,
): Promise<SpotifySyncSummary> {
  const startedAt = new Date().toISOString();

  const { data: credentials, error: credentialsError } = await admin
    .from("spotify_credentials")
    .select("refresh_token")
    .maybeSingle();
  if (credentialsError) throw credentialsError;
  if (!credentials) throw new SpotifyNotConnectedError();

  const token = await spotify.refreshAccessToken(credentials.refresh_token);

  // Spotify sometimes issues a new refresh token. Keep authorized_at as is:
  // the six-month expiry counts from the original login, not from rotation.
  const refreshTokenRotated = Boolean(
    token.refresh_token && token.refresh_token !== credentials.refresh_token,
  );
  if (refreshTokenRotated) {
    const { error } = await admin
      .from("spotify_credentials")
      .update({ refresh_token: token.refresh_token!, updated_at: startedAt })
      .eq("id", true);
    if (error) throw error;
  }

  const accessToken = token.access_token;
  const [shortTerm, mediumTerm, longTerm, followed] = await Promise.all([
    spotify.getTopArtists(accessToken, "short_term"),
    spotify.getTopArtists(accessToken, "medium_term"),
    spotify.getTopArtists(accessToken, "long_term"),
    spotify.getFollowedArtists(accessToken),
  ]);

  const { artists, affinity } = combineArtistLists({
    short_term: shortTerm,
    medium_term: mediumTerm,
    long_term: longTerm,
    followed,
  });

  // Upsert by Spotify ID. Ticketmaster match columns aren't included, so
  // existing matches are left alone.
  const { data: savedArtists, error: artistsError } = await admin
    .from("artists")
    .upsert(
      artists.map((a) => ({
        spotify_id: a.spotifyId,
        name: a.name,
        image_url: a.imageUrl,
        genres: a.genres,
        updated_at: startedAt,
      })),
      { onConflict: "spotify_id" },
    )
    .select("id, spotify_id");
  if (artistsError) throw artistsError;

  const idBySpotifyId = new Map(
    (savedArtists ?? []).map((a) => [a.spotify_id, a.id]),
  );

  // Write the new affinity rows, then remove rows from earlier syncs. Doing it in
  // this order means readers never see an empty list mid-sync.
  if (affinity.length > 0) {
    const { error } = await admin.from("artist_affinity").upsert(
      affinity.map((r) => ({
        artist_id: idBySpotifyId.get(r.spotifyId)!,
        source: r.source,
        rank: r.rank,
        captured_at: startedAt,
      })),
      { onConflict: "artist_id,source" },
    );
    if (error) throw error;
  }

  const { error: staleError } = await admin
    .from("artist_affinity")
    .delete()
    .lt("captured_at", startedAt);
  if (staleError) throw staleError;

  return {
    artists: artists.length,
    topShortTerm: shortTerm.length,
    topMediumTerm: mediumTerm.length,
    topLongTerm: longTerm.length,
    followed: followed.length,
    refreshTokenRotated,
  };
}
