import { encodeGeohash } from "@/lib/geohash";

import { normalizeEvents, type NormalizedEvent } from "./normalize";
import type {
  TmAttraction,
  TmAttractionsResponse,
  TmEventsResponse,
} from "./types";

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";

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

export function createTicketmasterClient(options: {
  apiKey: string;
  fetch?: typeof fetch;
}) {
  const { apiKey, fetch: fetchImpl = fetch } = options;

  async function get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}/${path}`);
    url.search = new URLSearchParams({ ...params, apikey: apiKey }).toString();

    const response = await fetchImpl(url);
    if (!response.ok) {
      // The URL contains the API key, so keep it out of the message.
      throw new TicketmasterError(
        `Ticketmaster ${path} request failed with status ${response.status}`,
        response.status,
      );
    }
    return (await response.json()) as T;
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
  };
}

export type TicketmasterClient = ReturnType<typeof createTicketmasterClient>;
