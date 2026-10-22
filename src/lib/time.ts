/**
 * Formats an instant as it reads in a specific time zone,
 * e.g. "Thu, Oct 23 · 10:00 AM PT".
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
