export type DropWindow = {
  id: string;
  kind: "presale" | "public";
  name: string;
  description: string | null;
  url: string | null;
  startsAt: string;
  endsAt: string | null;
};

export type DropArtist = { id: string; name: string; imageUrl: string | null };

/** One show and its upcoming ticket drops. */
export type ShowDrops = {
  eventId: string;
  eventName: string;
  eventUrl: string | null;
  status: string | null;
  showStartsAt: string | null;
  showLocalDate: string | null;
  venueName: string | null;
  venueCity: string | null;
  timeZone: string;
  artists: DropArtist[];
  /** Soonest first. */
  windows: DropWindow[];
};

/** A sale window row with its event, as returned by the drops query. */
export type DropRow = {
  id: string;
  kind: string;
  name: string;
  description: string | null;
  url: string | null;
  starts_at: string;
  ends_at: string | null;
  events: {
    id: string;
    name: string;
    url: string | null;
    status: string | null;
    starts_at: string | null;
    local_date: string | null;
    venues: {
      name: string;
      city: string | null;
      time_zone: string | null;
    } | null;
    event_artists: {
      artists: { id: string; name: string; image_url: string | null } | null;
    }[];
  };
};

/**
 * Groups sale windows by show, so a show with six presales is one card rather
 * than six. Shows are ordered by their soonest drop.
 */
export function groupDropsByShow(
  rows: DropRow[],
  fallbackTimeZone: string,
): ShowDrops[] {
  const shows = new Map<string, ShowDrops>();

  for (const row of rows) {
    const event = row.events;
    let show = shows.get(event.id);
    if (!show) {
      show = {
        eventId: event.id,
        eventName: event.name,
        eventUrl: event.url,
        status: event.status,
        showStartsAt: event.starts_at,
        showLocalDate: event.local_date,
        venueName: event.venues?.name ?? null,
        venueCity: event.venues?.city ?? null,
        timeZone: event.venues?.time_zone ?? fallbackTimeZone,
        artists: event.event_artists
          .flatMap((ea) => (ea.artists ? [ea.artists] : []))
          .map((a) => ({ id: a.id, name: a.name, imageUrl: a.image_url })),
        windows: [],
      };
      shows.set(event.id, show);
    }
    show.windows.push({
      id: row.id,
      kind: row.kind === "presale" ? "presale" : "public",
      name: row.name,
      description: row.description,
      url: row.url,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    });
  }

  for (const show of shows.values()) {
    show.windows.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return [...shows.values()].sort((a, b) =>
    a.windows[0].startsAt.localeCompare(b.windows[0].startsAt),
  );
}
