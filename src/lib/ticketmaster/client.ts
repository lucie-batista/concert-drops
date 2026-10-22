import { encodeGeohash } from "@/lib/geohash";

import { normalizeEvents, type NormalizedEvent } from "./normalize";
import type {
  TmAttraction,
  TmAttractionsResponse,
  TmEvent,
  TmEventsResponse,
} from "./types";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

// Ticketmaster only pages through the first 1,000 results of a search
// (size × page must stay under 1,000), so bigger searches are split by date.
const PAGE_SIZE = 200;
const MAX_RESULTS = 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class TicketmasterError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TicketmasterError";
  }
}

export type EventSearch = {
  attractionId: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
};

export type CitySweep = {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  from: Date;
  to: Date;
};

export function createTicketmasterClient(options: {
  apiKey: string;
  fetch?: typeof fetch;
  /** Gap between requests. Ticketmaster allows about 5 per second. */
  minIntervalMs?: number;
  /** Base wait before retrying a 429 or 5xx response; doubles each retry. */
  retryDelayMs?: number;
}) {
  const {
    apiKey,
    fetch: fetchImpl = fetch,
    minIntervalMs = 250,
    retryDelayMs = 1000,
  } = options;
  let lastRequestAt = 0;
  let requestCount = 0;

  async function get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}/${path}`);
    url.search = new URLSearchParams({ ...params, apikey: apiKey }).toString();

    for (let attempt = 0; ; attempt++) {
      await sleep(lastRequestAt + minIntervalMs - Date.now());
      lastRequestAt = Date.now();
      requestCount++;

      const response = await fetchImpl(url);
      if (response.ok) {
        return (await response.json()) as T;
      }

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < 2) {
        await sleep(retryDelayMs * 2 ** attempt);
        continue;
      }
      // The URL contains the API key, so keep it out of the message.
      throw new TicketmasterError(
        `Ticketmaster ${path} request failed with status ${response.status}`,
        response.status,
      );
    }
  }

  async function sweepWindow(
    sweep: CitySweep,
    from: Date,
    to: Date,
  ): Promise<TmEvent[]> {
    const params = {
      classificationName: "music",
      geoPoint: encodeGeohash(sweep.latitude, sweep.longitude),
      radius: String(sweep.radiusMiles),
      unit: "miles",
      startDateTime: toTicketmasterDate(from),
      endDateTime: toTicketmasterDate(to),
      sort: "date,asc",
      size: String(PAGE_SIZE),
    };

    const first = await get<TmEventsResponse>("events.json", {
      ...params,
      page: "0",
    });
    const total = first.page?.totalElements ?? 0;

    if (total > MAX_RESULTS && to.getTime() - from.getTime() > ONE_DAY_MS) {
      const mid = new Date((from.getTime() + to.getTime()) / 2);
      return [
        ...(await sweepWindow(sweep, from, mid)),
        ...(await sweepWindow(sweep, mid, to)),
      ];
    }

    const events = [...(first._embedded?.events ?? [])];
    const pages = Math.min(
      first.page?.totalPages ?? 1,
      MAX_RESULTS / PAGE_SIZE,
    );
    for (let page = 1; page < pages; page++) {
      const next = await get<TmEventsResponse>("events.json", {
        ...params,
        page: String(page),
      });
      events.push(...(next._embedded?.events ?? []));
    }
    return events;
  }

  return {
    /** Music attractions whose names match the keyword. */
    async searchAttractions(keyword: string): Promise<TmAttraction[]> {
      const data = await get<TmAttractionsResponse>("attractions.json", {
        keyword,
        classificationName: "music",
        size: "20",
      });
      return data._embedded?.attractions ?? [];
    },

    /** Upcoming events for one attraction within a radius, soonest first. */
    async findEvents(search: EventSearch): Promise<NormalizedEvent[]> {
      const data = await get<TmEventsResponse>("events.json", {
        attractionId: search.attractionId,
        geoPoint: encodeGeohash(search.latitude, search.longitude),
        radius: String(search.radiusMiles),
        unit: "miles",
        size: "50",
        sort: "date,asc",
      });
      return normalizeEvents(data._embedded?.events ?? []);
    },

    /**
     * Every music event within a radius between two dates. Splits the date range
     * whenever a search has more results than Ticketmaster will page through.
     */
    async sweepMusicEvents(sweep: CitySweep): Promise<NormalizedEvent[]> {
      const events = await sweepWindow(sweep, sweep.from, sweep.to);
      // Split windows share a boundary, so an event can appear twice.
      const unique = new Map(events.map((e) => [e.id, e]));
      return normalizeEvents([...unique.values()]);
    },

    /** Requests made so far, including retries. */
    get requestCount() {
      return requestCount;
    },
  };
}

export type TicketmasterClient = ReturnType<typeof createTicketmasterClient>;

/** Ticketmaster wants "2026-10-22T00:00:00Z", without milliseconds. */
function toTicketmasterDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}
