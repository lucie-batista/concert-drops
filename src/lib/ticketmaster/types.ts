// The parts of Ticketmaster Discovery API v2 responses this app reads.
// https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

export type TmExternalLink = { url: string };

export type TmAttraction = {
  id: string;
  name: string;
  externalLinks?: Record<string, TmExternalLink[] | undefined>;
};

export type TmImage = {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
  /** Ticketmaster's generic placeholder, used when the act has no photo. */
  fallback?: boolean;
};

export type TmClassification = {
  primary?: boolean;
  genre?: { name?: string };
  subGenre?: { name?: string };
};

export type TmVenue = {
  id: string;
  name: string;
  timezone?: string;
  city?: { name?: string };
  state?: { stateCode?: string };
  country?: { countryCode?: string };
  location?: { latitude?: string; longitude?: string };
};

export type TmSaleWindow = {
  name?: string;
  description?: string;
  url?: string;
  startDateTime?: string;
  endDateTime?: string;
};

export type TmEvent = {
  id: string;
  name: string;
  url?: string;
  test?: boolean;
  images?: TmImage[];
  classifications?: TmClassification[];
  dates: {
    start?: {
      localDate?: string;
      dateTime?: string;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
    timezone?: string;
    status?: { code?: string };
  };
  sales?: {
    public?: TmSaleWindow & { startTBD?: boolean; startTBA?: boolean };
    presales?: TmSaleWindow[];
  };
  _embedded?: {
    venues?: TmVenue[];
    attractions?: TmAttraction[];
  };
};

export type TmAttractionsResponse = {
  _embedded?: { attractions?: TmAttraction[] };
};

export type TmEventsResponse = {
  _embedded?: { events?: TmEvent[] };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
};
