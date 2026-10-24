import { cacheLife, cacheTag } from "next/cache";

import { DROPS_TAG } from "@/lib/drops/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { localDateIn } from "@/lib/time";

import {
  toPopularShows,
  type PopularDropRow,
  type PopularEventRow,
  type PopularShows,
} from "./shows";

const EVENT_FIELDS = `id, name, url, status, starts_at, local_date, genre,
  subgenre, image_url, performers, popular_rank,
  venues(name, city, time_zone)`;

export type PopularData = PopularShows & {
  /** When the popular artists were last updated, or null if never. */
  updatedAt: string | null;
  /** When this data was loaded; stands in for "now" in cached rendering. */
  loadedAt: string;
};

/**
 * Drops and on-sale shows in the current city by the US's most listened-to
 * artists. Refreshed with the drops.
 */
export async function getPopularData(): Promise<PopularData> {
  "use cache";
  cacheLife("hours");
  cacheTag(DROPS_TAG);

  const supabase = createPublicClient();
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("cities(id, time_zone)")
    .single();
  if (settingsError) throw settingsError;
  const city = settings.cities;
  if (!city) throw new Error("The current city is missing.");

  // Same definition of a drop as my page: opens soon or opened in the last day.
  const now = new Date().toISOString();
  const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: drops, error: dropsError } = await supabase
    .from("sale_windows")
    .select(
      `id, kind, name, description, url, starts_at, ends_at,
       events!inner(${EVENT_FIELDS}, city_id)`,
    )
    .eq("events.city_id", city.id)
    .not("events.popular_rank", "is", null)
    .neq("events.status", "cancelled")
    .gte("starts_at", recent)
    .order("starts_at")
    .limit(500);
  if (dropsError) throw dropsError;

  const { data: onSale, error: onSaleError } = await supabase
    .from("events")
    .select(EVENT_FIELDS)
    .eq("city_id", city.id)
    .not("popular_rank", "is", null)
    .in("status", ["onsale", "rescheduled"])
    .gte("local_date", localDateIn(city.time_zone, now))
    .order("local_date")
    .order("starts_at")
    .limit(300);
  if (onSaleError) throw onSaleError;

  const { data: newest, error: newestError } = await supabase
    .from("popular_artists")
    .select("updated_at")
    .eq("rank", 1)
    .maybeSingle();
  if (newestError) throw newestError;

  return {
    ...toPopularShows(
      drops as unknown as PopularDropRow[],
      onSale as unknown as PopularEventRow[],
      city.time_zone,
    ),
    updatedAt: newest?.updated_at ?? null,
    loadedAt: now,
  };
}
