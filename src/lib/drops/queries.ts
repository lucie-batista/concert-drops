import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import { localDateIn } from "@/lib/time";

import {
  groupDropsByShow,
  toOnSaleShows,
  type DropRow,
  type EventRow,
  type OnSaleShow,
  type ShowDrops,
} from "./group";

/** Cache tag for drops data; the daily refresh revalidates it. */
export const DROPS_TAG = "drops";

const EVENT_FIELDS = `id, name, url, status, starts_at, local_date,
  venues(name, city, time_zone),
  event_artists(artists(id, name, image_url))`;

export type HomeData = {
  city: { id: string; name: string; timeZone: string };
  /** Shows with tickets about to drop. */
  drops: ShowDrops[];
  /** Shows that already have tickets on sale. */
  onSale: OnSaleShow[];
  /** When this data was loaded; stands in for "now" in cached rendering. */
  loadedAt: string;
};

/**
 * Everything the home page shows for the current city. Cached for an hour, and
 * refreshed right after each daily refresh.
 */
export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheLife("hours");
  cacheTag(DROPS_TAG);

  const supabase = createPublicClient();

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("cities(id, name, time_zone)")
    .single();
  if (settingsError) throw settingsError;
  const city = settings.cities;
  if (!city) throw new Error("The current city is missing.");

  // A drop is a window that opens soon, or opened in the last day. Many
  // "presales" (VIP packages, card offers) stay open for months; those aren't drops.
  const now = new Date().toISOString();
  const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: windows, error: windowsError } = await supabase
    .from("sale_windows")
    .select(
      `id, kind, name, description, url, starts_at, ends_at,
       events!inner(${EVENT_FIELDS}, city_id)`,
    )
    .eq("events.city_id", city.id)
    .neq("events.status", "cancelled")
    .gte("starts_at", recent)
    .order("starts_at")
    .limit(500);
  if (windowsError) throw windowsError;
  const drops = groupDropsByShow(windows as DropRow[], city.time_zone);

  // Upcoming shows Ticketmaster lists as on sale. Ticketmaster doesn't say
  // whether a show is sold out, so the ticket link is the place to check.
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("city_id", city.id)
    .in("status", ["onsale", "rescheduled"])
    .gte("local_date", localDateIn(city.time_zone, now))
    .order("local_date")
    .order("starts_at")
    .limit(300);
  if (eventsError) throw eventsError;
  const onSale = toOnSaleShows(
    events as EventRow[],
    city.time_zone,
    new Set(drops.map((d) => d.eventId)),
  );

  return {
    city: { id: city.id, name: city.name, timeZone: city.time_zone },
    drops,
    onSale,
    loadedAt: now,
  };
}
