import { NextResponse, type NextRequest } from "next/server";

import { SPOTIFY_SCOPES } from "@/lib/auth/owner";
import { createClient } from "@/lib/supabase/server";

/** Starts the Spotify login. 303 so the browser follows the redirect with GET. */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: SPOTIFY_SCOPES,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/?auth=error`, 303);
  }
  return NextResponse.redirect(data.url, 303);
}
