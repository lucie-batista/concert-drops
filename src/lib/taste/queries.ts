import { cacheLife, cacheTag } from "next/cache";

import { DROPS_TAG } from "@/lib/drops/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { localDateIn } from "@/lib/time";

import { buildQuiz, type QuizAct, type QuizQuestion } from "./quiz";
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
