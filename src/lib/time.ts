/**
 * Formats an instant as it reads in a specific time zone,
 * e.g. "Fri, Oct 23 · 10:00 AM PT".
 *
 * Concert times use the venue's time zone; drop times use the viewer's.
 */
export function formatInTimeZone(
  instant: Date | string,
  timeZone: string,
): string {
  const date = new Date(instant);

  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortGeneric",
  }).format(date);

  // Intl separates "10:00" and "AM" with a narrow no-break space; use a plain one.
  return `${day} · ${time.replace(/ /g, " ")}`;
}

export type TileParts = {
  weekday: string; // "Fri"
  day: string; // "23"
  month: string; // "Oct"
  time: string; // "10:00 AM"
  zone: string; // "PT"
};

/** The pieces of a drop's date tile, as the instant reads in a time zone. */
export function tileParts(instant: Date | string, timeZone: string): TileParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortGeneric",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
    time: `${get("hour")}:${get("minute")} ${get("dayPeriod")}`,
    zone: get("timeZoneName"),
  };
}

/**
 * A show's calendar date ("2027-02-26") as "Fri, Feb 26", adding the year when
 * it isn't the current one. Treated as a plain date, so no time zone can shift it.
 */
export function formatShowDate(localDate: string, now = new Date()): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getUTCFullYear() !== now.getUTCFullYear() && { year: "numeric" }),
  }).format(date);
}
