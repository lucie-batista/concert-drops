import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records the owner's user ID and stores their Spotify refresh token so the daily
 * refresh can read their listening data without them being logged in.
 */
export async function saveOwnerLogin(userId: string, refreshToken: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: settingsError } = await admin
    .from("settings")
    .update({ owner_user_id: userId })
    .eq("id", true);
  if (settingsError) throw settingsError;

  const { error: credentialsError } = await admin
    .from("spotify_credentials")
    .upsert({
      id: true,
      refresh_token: refreshToken,
      authorized_at: now,
      updated_at: now,
    });
  if (credentialsError) throw credentialsError;
}

/** Removes a non-owner's account so strangers don't accumulate in Supabase. */
export async function deleteUser(userId: string) {
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}
