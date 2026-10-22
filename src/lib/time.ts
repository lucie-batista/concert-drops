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

  return `${day} · ${clockTime(date, timeZone)} ${zoneLabel(date, timeZone)}`;
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
  const date = new Date(instant);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
    time: clockTime(date, timeZone),
    zone: zoneLabel(date, timeZone),
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

/**
 * A short zone name like "PT". Some browsers only have long generic names
 * ("Los Angeles Time"), so fall back to the short specific name ("PDT").
 */
export function zoneLabel(date: Date, timeZone: string): string {
  const generic = zoneName(date, timeZone, "shortGeneric");
  return generic && !generic.includes(" ")
    ? generic
    : zoneName(date, timeZone, "short");
}

function zoneName(
  date: Date,
  timeZone: string,
  style: "shortGeneric" | "short",
): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: style })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? ""
  );
}

/** "10:00 AM". Intl puts a narrow no-break space before AM/PM; use a plain one. */
function clockTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .replace(/ /g, " ");
}
