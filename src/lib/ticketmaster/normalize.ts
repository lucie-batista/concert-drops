import type { TmEvent, TmSaleWindow, TmVenue } from "./types";

export type NormalizedVenue = {
  id: string;
  name: string;
  city: string | null;
  stateCode: string | null;
  countryCode: string | null;
  timeZone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type NormalizedSaleWindow = {
  kind: "presale" | "public";
  name: string;
  description: string | null;
  url: string | null;
  startsAt: string;
  endsAt: string | null;
};

export type NormalizedEvent = {
  id: string;
  name: string;
  url: string | null;
  status: string | null;
  /** Exact start time, or null while Ticketmaster lists the time as TBA. */
  startsAt: string | null;
  localDate: string | null;
  timeZone: string | null;
  venue: NormalizedVenue | null;
  attractionIds: string[];
  saleWindows: NormalizedSaleWindow[];
};

/** Converts Ticketmaster events into the shape we store, dropping test events. */
export function normalizeEvents(events: TmEvent[]): NormalizedEvent[] {
  return events.filter((e) => !e.test).map(normalizeEvent);
}

export function normalizeEvent(event: TmEvent): NormalizedEvent {
  const start = event.dates.start;
  const timeKnown = !start?.timeTBA && !start?.noSpecificTime;
  const venue = event._embedded?.venues?.[0];

  return {
    id: event.id,
    name: event.name,
    url: event.url ?? null,
    status: event.dates.status?.code ?? null,
    startsAt: timeKnown ? (start?.dateTime ?? null) : null,
    localDate: start?.localDate ?? null,
    timeZone: event.dates.timezone ?? venue?.timezone ?? null,
    venue: venue ? normalizeVenue(venue) : null,
    attractionIds: (event._embedded?.attractions ?? []).map((a) => a.id),
    saleWindows: saleWindowsOf(event),
  };
}

function normalizeVenue(venue: TmVenue): NormalizedVenue {
  return {
    id: venue.id,
    name: venue.name,
    city: venue.city?.name ?? null,
    stateCode: venue.state?.stateCode ?? null,
    countryCode: venue.country?.countryCode ?? null,
    timeZone: venue.timezone ?? null,
    latitude: toNumber(venue.location?.latitude),
    longitude: toNumber(venue.location?.longitude),
  };
}

function saleWindowsOf(event: TmEvent): NormalizedSaleWindow[] {
  const windows: NormalizedSaleWindow[] = [];

  for (const presale of event.sales?.presales ?? []) {
    const window = toSaleWindow("presale", presale, "Presale");
    if (window) windows.push(window);
  }

  const publicSale = event.sales?.public;
  if (publicSale && !publicSale.startTBD && !publicSale.startTBA) {
    const window = toSaleWindow("public", publicSale, "General on-sale");
    if (window) windows.push(window);
  }

  return windows.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function toSaleWindow(
  kind: NormalizedSaleWindow["kind"],
  sale: TmSaleWindow,
  defaultName: string,
): NormalizedSaleWindow | null {
  if (!sale.startDateTime) return null;
  return {
    kind,
    name: sale.name?.trim() || defaultName,
    description: sale.description ?? null,
    url: sale.url ?? null,
    startsAt: sale.startDateTime,
    endsAt: sale.endDateTime ?? null,
  };
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
