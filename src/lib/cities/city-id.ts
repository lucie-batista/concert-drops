import type { CityOption } from "@/lib/geocoding/open-meteo";

/** "austin-4671654": readable, and unique because of the GeoNames id. */
export function cityId(city: Pick<CityOption, "name" | "geonameId">): string {
  const slug = city.name
    .toLowerCase()
    .normalize("NFKD")
    // Drop accents: "é" becomes "e" plus a mark, and the mark goes.
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "city"}-${city.geonameId}`;
}
