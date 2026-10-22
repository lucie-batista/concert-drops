import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import { groupDropsByShow, type DropRow, type ShowDrops } from "./group";

/** Cache tag for drops data; the daily refresh revalidates it. */
export const DROPS_TAG = "drops";

export type DropsPage = {
  city: { id: string; name: string; timeZone: string };
  shows: ShowDrops[];
  /** When this data was loaded; stands in for "now" in cached rendering. */
  loadedAt: string;
};

/**
 * Upcoming and in-progress drops for the current city, grouped by show.
 * Cached for an hour, and refreshed right after each daily refresh.
 */
export async function getUpcomingDrops(): Promise<DropsPage> {
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
  const { data, error } = await supabase
    .from("sale_windows")
    .select(
      `id, kind, name, description, url, starts_at, ends_at,
       events!inner(id, name, url, status, starts_at, local_date, city_id,
         venues(name, city, time_zone),
         event_artists(artists(id, name, image_url)))`,
    )
    .eq("events.city_id", city.id)
    .neq("events.status", "cancelled")
    .gte("starts_at", recent)
    .order("starts_at")
    .limit(500);
  if (error) throw error;

  return {
    city: { id: city.id, name: city.name, timeZone: city.time_zone },
    shows: groupDropsByShow(data as DropRow[], city.time_zone),
    loadedAt: now,
  };
}
