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

const CITY_FIELDS = "id, name, time_zone, geoname_id, region, country_code";

const EVENT_FIELDS = `id, name, url, status, starts_at, local_date,
  venues(name, city, time_zone),
  event_artists(artists(id, name, image_url, artist_affinity(source, rank)))`;

export type CityInfo = {
  id: string;
  name: string;
  timeZone: string;
  geonameId: number | null;
  region: string | null;
  countryCode: string | null;
};

export type HomeData = {
  city: CityInfo;
  /** Cities loaded before, most recent first, for quick switching. */
  recentCities: CityInfo[];
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
    .select(`cities(${CITY_FIELDS})`)
    .single();
  if (settingsError) throw settingsError;
  const city = settings.cities;
  if (!city) throw new Error("The current city is missing.");

  // My page only shows events with my artists; the rest of the city is for
  // the taste quiz.
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
    .eq("events.has_my_artists", true)
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
    .eq("has_my_artists", true)
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

  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select(CITY_FIELDS)
    .not("refreshed_at", "is", null)
    .neq("id", city.id)
    .order("refreshed_at", { ascending: false })
    .limit(8);
  if (citiesError) throw citiesError;

  return {
    city: toCityInfo(city),
    recentCities: cities.map(toCityInfo),
    drops,
    onSale,
    loadedAt: now,
  };
}

function toCityInfo(c: {
  id: string;
  name: string;
  time_zone: string;
  geoname_id: number | null;
  region: string | null;
  country_code: string | null;
}): CityInfo {
  return {
    id: c.id,
    name: c.name,
    timeZone: c.time_zone,
    geonameId: c.geoname_id,
    region: c.region,
    countryCode: c.country_code,
  };
}
