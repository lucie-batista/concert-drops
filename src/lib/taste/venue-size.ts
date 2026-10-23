export type VenueSize = "small" | "mid" | "big";

export const VENUE_SIZE_LABELS: Record<VenueSize, string> = {
  small: "Small club",
  mid: "Theater",
  big: "Arena",
};

/**
 * Rough capacities of Bay Area venues. Ticketmaster doesn't publish capacity,
 * so these come from the venues' own listings. Keyed by normalized name.
 */
const KNOWN_CAPACITIES: Record<string, number> = {
  "chase center": 18000,
  "oakland arena": 19000,
  "cow palace": 12000,
  "bill graham civic auditorium": 8500,
  "greek theatre u c berkeley": 8500,
  "shoreline amphitheatre": 22000,
  "the masonic": 3300,
  "paramount theatre oakland": 3000,
  "fox theater oakland": 2800,
  "war memorial opera house": 3100,
  "davies symphony hall": 2700,
  "golden gate theater": 2300,
  warfield: 2300,
  "zellerbach auditorium": 2000,
  "the midway": 1800,
  "1015 folsom": 1500,
  "the regency ballroom": 1400,
  "the uc theatre": 1400,
  "the castro theatre": 1400,
  "the fillmore": 1300,
  "fox theatre redwood city": 1300,
  "palace of fine arts": 1000,
  "august hall": 900,
  "historic bal theatre": 600,
  "bimbos 365 club": 800,
  "great american music hall": 600,
  "the independent": 500,
  "the chapel": 450,
  "cornerstone ca": 350,
  crybaby: 450,
  "brick and mortar music hall": 400,
  "rickshaw stop": 400,
  "swedish american hall": 400,
  "yoshis oakland": 300,
  "cafe du nord": 300,
  "neck of the woods": 300,
  "feinsteins at the nikko": 150,
};

const BIG_WORDS =
  /\b(arena|stadium|amphitheat(er|re)|pavilion|fairgrounds?|speedway)\b/;
const SMALL_WORDS = /\b(club|bar|lounge|tavern|pub|saloon|cafe|room)\b/;

/** Small under 1,000 people, big from 5,000. */
export function sizeFromCapacity(capacity: number): VenueSize {
  if (capacity < 1000) return "small";
  if (capacity < 5000) return "mid";
  return "big";
}

/**
 * How big a venue is: from its capacity when we know it, otherwise guessed
 * from words like "Arena" or "Club" in its name. Null when there's no clue.
 */
export function venueSize(
  name: string | null,
  capacity: number | null = null,
): VenueSize | null {
  if (capacity) return sizeFromCapacity(capacity);
  if (!name) return null;
  const key = normalizeVenueName(name);
  const known = KNOWN_CAPACITIES[key];
  if (known) return sizeFromCapacity(known);
  if (BIG_WORDS.test(key)) return "big";
  if (SMALL_WORDS.test(key)) return "small";
  return null;
}

/** "Brick & Mortar Music Hall" → "brick and mortar music hall". */
export function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
