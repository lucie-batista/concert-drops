export type ScheduleItem = {
  saleWindowId: string;
  kind: "presale" | "public";
  windowName: string;
  startsAt: string;
  artistNames: string;
  venueName: string | null;
  timeZone: string;
  ticketUrl: string | null;
  signUpUrl: string | null;
};

/** Performers named for a show without my artists. */
const HEADLINERS = 2;

/** The columns a schedule row needs, for `.from("schedule_items").select()`. */
export const SCHEDULE_COLUMNS = `sale_windows(id, kind, name, url, starts_at,
  events(name, url, performers, venues(name, time_zone),
    event_artists(artists(name))))`;

/** A schedule row with its sale window and event, as returned by the query. */
export type ScheduleRow = {
  sale_windows: {
    id: string;
    kind: string;
    name: string;
    url: string | null;
    starts_at: string;
    events: {
      name: string;
      url: string | null;
      /** Everyone on the bill, headliner first. */
      performers: { id: string; name: string }[];
      venues: { name: string; time_zone: string | null } | null;
      event_artists: { artists: { name: string } | null }[];
    };
  } | null;
};

/**
 * Turns schedule rows into list items in date order, keeping drops that open
 * after `since`. Rows whose window was deleted are skipped.
 */
export function toScheduleItems(
  rows: ScheduleRow[],
  fallbackTimeZone: string,
  since: string,
): ScheduleItem[] {
  return rows
    .flatMap((r) => (r.sale_windows ? [r.sale_windows] : []))
    .filter((w) => w.starts_at >= since)
    .map((w) => {
      // My artists on the bill; for a show without them (say, from the
      // Popular page), its headliners.
      const myArtists = w.events.event_artists.flatMap((ea) =>
        ea.artists ? [ea.artists.name] : [],
      );
      const names = myArtists.length
        ? myArtists
        : w.events.performers.slice(0, HEADLINERS).map((p) => p.name);
      const artistNames = names.join(", ");
      return {
        saleWindowId: w.id,
        kind: w.kind === "presale" ? ("presale" as const) : ("public" as const),
        windowName: w.kind === "presale" ? w.name : "General on-sale",
        startsAt: w.starts_at,
        artistNames: artistNames || w.events.name,
        venueName: w.events.venues?.name ?? null,
        timeZone: w.events.venues?.time_zone ?? fallbackTimeZone,
        ticketUrl: w.events.url,
        signUpUrl: w.url,
      };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
