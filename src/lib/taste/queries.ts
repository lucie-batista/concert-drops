import { cacheLife, cacheTag } from "next/cache";

import { DROPS_TAG } from "@/lib/drops/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { localDateIn } from "@/lib/time";

import { FAMOUS_ARTISTS } from "./famous-artists";
import { buildQuiz, type QuizAct, type QuizQuestion } from "./quiz";
import type { CityDropRow, CityEventRow } from "./results";
import type { VibeId } from "./vibes";

export type QuizData = {
  cityName: string;
  questions: QuizQuestion[];
};

/** A performer as stored in events.performers. */
export type Performer = { id: string; name: string };

/** "Nov 12", for a show's local date. */
const SHOW_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

/**
 * Today's quiz for the current city: well-known artists, the city's venues,
 * and any of those artists' upcoming shows there. Refreshed with the drops.
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
    .select("local_date, performers, venues(name)")
    .eq("city_id", city.id)
    .neq("status", "cancelled")
    .gte("local_date", today)
    .order("local_date")
    .limit(3000);
  if (error) throw error;

  // Note each artist's next show in town, so picking them can point at it.
  const nextShow = new Map<string, string>();
  for (const e of events) {
    for (const p of e.performers as Performer[]) {
      if (nextShow.has(p.id)) continue;
      const date = SHOW_DATE.format(new Date(`${e.local_date}T12:00:00Z`));
      nextShow.set(
        p.id,
        e.venues ? `Playing ${e.venues.name} · ${date}` : `Playing ${date}`,
      );
    }
  }
  const acts: QuizAct[] = Object.entries(FAMOUS_ARTISTS).flatMap(
    ([vibe, artists]) =>
      artists.map((a) => ({
        ...a,
        vibe: vibe as VibeId,
        playing: nextShow.get(a.id),
      })),
  );
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
