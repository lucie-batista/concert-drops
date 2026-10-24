import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { DROPS_TAG } from "@/lib/drops/queries";

import { requireEnv } from "@/lib/env";
import { createLastfmClient } from "@/lib/lastfm/client";
import { isAuthorizedCronRequest } from "@/lib/refresh/cron-auth";
import { runRefresh } from "@/lib/refresh/run";
import { createSpotifyClient } from "@/lib/spotify/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTicketmasterClient } from "@/lib/ticketmaster/client";

// Vercel Hobby allows up to 300 seconds; a normal run takes well under a minute.
export const maxDuration = 300;

/** Daily refresh, triggered by Vercel Cron (see vercel.json). */
export async function GET(request: NextRequest) {
  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runRefresh({
    admin: createAdminClient(),
    spotify: createSpotifyClient({
      clientId: requireEnv("SPOTIFY_CLIENT_ID"),
      clientSecret: requireEnv("SPOTIFY_CLIENT_SECRET"),
    }),
    ticketmaster: createTicketmasterClient({
      apiKey: requireEnv("TICKETMASTER_API_KEY"),
    }),
    // Optional: without a key the Popular page keeps its last list.
    lastfm: process.env.LASTFM_API_KEY
      ? createLastfmClient({ apiKey: process.env.LASTFM_API_KEY })
      : undefined,
  });
  // Show the fresh data right away instead of waiting for the hourly cache.
  revalidateTag(DROPS_TAG, "max");
  return NextResponse.json(summary);
}
