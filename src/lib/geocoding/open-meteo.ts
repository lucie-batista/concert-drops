/**
 * City search with the Open-Meteo geocoder (GeoNames data). It's free, needs
 * no key, and allows calls straight from the browser.
 */
const BASE = "https://geocoding-api.open-meteo.com/v1";

export type CityOption = {
  geonameId: number;
  name: string;
  region: string | null;
  countryCode: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

type Result = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
};

/** Up to `count` towns and cities matching a name, biggest first. */
export async function searchCities(
  query: string,
  { count = 6, fetch: fetchFn = fetch, signal }: SearchOptions = {},
): Promise<CityOption[]> {
  const name = query.trim();
  // The geocoder only matches from two characters.
  if (name.length < 2) return [];
  const params = new URLSearchParams({
    name,
    count: String(count * 2),
    language: "en",
    format: "json",
  });
  const res = await fetchFn(`${BASE}/search?${params}`, { signal });
  if (!res.ok) throw new Error(`City search failed (${res.status}).`);
  const body = (await res.json()) as { results?: Result[] };
  // Bigger places first, so Melbourne, Australia beats Melbot, Nepal.
  return [...(body.results ?? [])]
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .map(toCityOption)
    .filter((c): c is CityOption => c !== null)
    .slice(0, count);
}

type SearchOptions = {
  count?: number;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

/** One city by its GeoNames id, or null if it isn't a populated place. */
export async function getCity(
  geonameId: number,
  fetchFn: typeof fetch = fetch,
): Promise<CityOption | null> {
  const res = await fetchFn(`${BASE}/get?id=${geonameId}`);
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`City lookup failed (${res.status}).`);
  return toCityOption((await res.json()) as Result);
}

/** Keeps populated places (feature codes PPL…) that have a time zone. */
export function toCityOption(r: Result): CityOption | null {
  if (!r.feature_code?.startsWith("PPL") || !r.timezone || !r.country_code) {
    return null;
  }
  return {
    geonameId: r.id,
    name: r.name,
    region: r.admin1 ?? null,
    countryCode: r.country_code,
    country: r.country ?? r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    timeZone: r.timezone,
  };
}

/** "Texas, United States", or just the country when there's no region. */
export function placeLabel(city: Pick<CityOption, "region" | "country">) {
  return [city.region, city.country].filter(Boolean).join(", ");
}
