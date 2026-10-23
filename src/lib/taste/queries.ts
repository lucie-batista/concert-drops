import { cacheLife, cacheTag } from "next/cache";

import { DROPS_TAG } from "@/lib/drops/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { localDateIn } from "@/lib/time";

import { buildQuiz, type QuizAct, type QuizQuestion } from "./quiz";
import type { CityDropRow, CityEventRow } from "./results";
import { vibeOf } from "./vibes";

export type QuizData = {
  cityName: string;
  questions: QuizQuestion[];
};

/** A performer as stored in events.performers. */
export type Performer = { id: string; name: string };

/**
 * Today's quiz for the current city, built from every upcoming show there.
 * Refreshed with the drops.
 */
export async function getQuizData(): Promise<QuizData> {
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

  const today = localDateIn(city.time_zone, new Date());
  const { data: events, error } = await supabase
    .from("events")
    .select("genre, subgenre, image_url, performers, venues(name)")
    .eq("city_id", city.id)
    .neq("status", "cancelled")
    .gte("local_date", today)
    .order("local_date")
    .limit(3000);
  if (error) throw error;

  // The event photo is the headliner's, so each show offers its headliner.
  const acts: QuizAct[] = events.flatMap((e) => {
    const headliner = (e.performers as Performer[])[0];
    const vibe = vibeOf(e.genre, e.subgenre);
    if (!headliner || !vibe || !e.image_url) return [];
    return [
      {
        id: headliner.id,
        name: headliner.name,
        imageUrl: e.image_url,
        vibe,
        venueName: e.venues?.name ?? null,
      },
    ];
  });
  const venueNames = [
    ...new Set(events.flatMap((e) => (e.venues ? [e.venues.name] : []))),
  ];

  return {
    cityName: city.name,
    questions: buildQuiz(acts, venueNames, `${city.id}:${today}`),
  };
}

const CITY_EVENT_FIELDS = `id, name, url, status, starts_at, local_date,
  genre, subgenre, image_url, performers, venues(name, city, time_zone)`;

export type CityShows = {
  cityName: string;
  timeZone: string;
  drops: CityDropRow[];
  onSale: CityEventRow[];
  /** When this data was loaded; stands in for "now" in cached rendering. */
  loadedAt: string;
};

/**
 * Every upcoming drop and on-sale show in the current city, for scoring
 * against a visitor's taste. Refreshed with the drops.
 */
export async function getCityShows(): Promise<CityShows> {
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

  // Same definition of a drop as my page: opens soon or opened in the last day.
  const now = new Date().toISOString();
  const recent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: drops, error: dropsError } = await supabase
    .from("sale_windows")
    .select(
      `id, kind, name, description, url, starts_at, ends_at,
       events!inner(${CITY_EVENT_FIELDS}, city_id)`,
    )
    .eq("events.city_id", city.id)
    .neq("events.status", "cancelled")
    .gte("starts_at", recent)
    .order("starts_at")
    .limit(2000);
  if (dropsError) throw dropsError;

  const { data: onSale, error: onSaleError } = await supabase
    .from("events")
    .select(CITY_EVENT_FIELDS)
    .eq("city_id", city.id)
    .in("status", ["onsale", "rescheduled"])
    .gte("local_date", localDateIn(city.time_zone, now))
    .order("local_date")
    .order("starts_at")
    .limit(3000);
  if (onSaleError) throw onSaleError;

  return {
    cityName: city.name,
    timeZone: city.time_zone,
    drops: drops as unknown as CityDropRow[],
    onSale: onSale as unknown as CityEventRow[],
    loadedAt: now,
  };
}
