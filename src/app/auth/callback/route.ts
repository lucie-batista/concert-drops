import { NextResponse, type NextRequest } from "next/server";

import { isOwnerAccount, spotifyIdOf } from "@/lib/auth/owner";
import { deleteUser, saveOwnerLogin } from "@/lib/auth/save-owner-login";
import { requireEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Spotify redirects here after login, via Supabase. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const { user, session } = data;

  if (!isOwnerAccount(user, requireEnv("OWNER_SPOTIFY_ID"))) {
    console.warn(
      `Rejected login from Spotify account ${spotifyIdOf(user) ?? "unknown"}`,
    );
    await supabase.auth.signOut();
    await deleteUser(user.id);
    return NextResponse.redirect(`${origin}/?auth=not-owner`);
  }

  // Spotify only hands over the refresh token at login, so save it now.
  if (!session.provider_refresh_token) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
  await saveOwnerLogin(user.id, session.provider_refresh_token);

  return NextResponse.redirect(`${origin}/`);
}
