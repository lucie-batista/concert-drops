import type { User } from "@supabase/supabase-js";

/** Spotify permissions the app asks for when the owner logs in. */
export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-top-read", // top artists over 4 weeks, 6 months and all time
  "user-follow-read", // followed artists
].join(" ");

/** The Spotify user ID of a Supabase user who signed in with Spotify. */
export function spotifyIdOf(user: Pick<User, "identities">): string | null {
  const identity = user.identities?.find((i) => i.provider === "spotify");
  return identity?.id ?? null;
}

/** Only the Spotify account named in OWNER_SPOTIFY_ID counts as the owner. */
export function isOwnerAccount(
  user: Pick<User, "identities">,
  ownerSpotifyId: string,
): boolean {
  const spotifyId = spotifyIdOf(user);
  return ownerSpotifyId.length > 0 && spotifyId === ownerSpotifyId;
}
