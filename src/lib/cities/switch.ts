import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCity, type CityOption } from "@/lib/geocoding/open-meteo";
import { loadCityEvents } from "@/lib/refresh/load-city";
import type { Database } from "@/lib/supabase/database.types";
import type { TicketmasterClient } from "@/lib/ticketmaster/client";

import { cityId } from "./city-id";

/** A city loaded within this long switches instantly instead of reloading. */
export const FRESH_FOR_MS = 24 * 60 * 60 * 1000;

export class CityNotFoundError extends Error {
  constructor() {
    super("That city couldn’t be found.");
  }
}

/**
 * Makes a city the site's current city, adding it the first time and loading
 * its shows unless they were loaded in the last day.
 */
export async function switchCity(deps: {
  admin: SupabaseClient<Database>;
  ticketmaster: TicketmasterClient;
  geonameId: number;
  now: Date;
  lookup?: (geonameId: number) => Promise<CityOption | null>;
}): Promise<{ cityId: string; loaded: boolean }> {
  const { admin, ticketmaster, geonameId, now, lookup = getCity } = deps;

  const { data: existing, error } = await admin
    .from("cities")
    .select("id, latitude, longitude, radius_miles, refreshed_at")
    .eq("geoname_id", geonameId)
    .maybeSingle();
  if (error) throw error;

  const city = existing ?? (await addCity(admin, geonameId, lookup));

  const fresh =
    city.refreshed_at !== null &&
    now.getTime() - Date.parse(city.refreshed_at) < FRESH_FOR_MS;
  if (!fresh) {
    await loadCityEvents({ admin, ticketmaster, city, now });
  }

  const { error: settingsError } = await admin
    .from("settings")
    .update({ current_city_id: city.id })
    .eq("id", true);
  if (settingsError) throw settingsError;

  return { cityId: city.id, loaded: !fresh };
}

async function addCity(
  admin: SupabaseClient<Database>,
  geonameId: number,
  lookup: (geonameId: number) => Promise<CityOption | null>,
) {
  const found = await lookup(geonameId);
  if (!found) throw new CityNotFoundError();

  const { data, error } = await admin
    .from("cities")
    .insert({
      id: cityId(found),
      name: found.name,
      time_zone: found.timeZone,
      latitude: found.latitude,
      longitude: found.longitude,
      geoname_id: found.geonameId,
      region: found.region,
      country_code: found.countryCode,
    })
    .select("id, latitude, longitude, radius_miles, refreshed_at")
    .single();
  if (error) throw error;
  return data;
}
