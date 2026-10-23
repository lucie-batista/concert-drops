import type { ScheduleItem } from "@/lib/schedule/map";

/** How long each drop blocks out on the calendar. */
const DURATION = "PT30M";
/** Reminder before the drop opens. */
const REMINDER = "-PT15M";

/**
 * An iCalendar file (RFC 5545) with one event per drop, each with a reminder
 * 15 minutes before. Apple Calendar, Google Calendar and Outlook all read it.
 */
export function buildCalendar(items: ScheduleItem[], stampedAt: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//concert-drops//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...items.flatMap((item) => eventLines(item, stampedAt)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

function eventLines(item: ScheduleItem, stampedAt: Date): string[] {
  const title = `${item.artistNames} · ${item.windowName}`;
  const notes = [
    item.signUpUrl && `Sign up: ${item.signUpUrl}`,
    item.ticketUrl && `Tickets: ${item.ticketUrl}`,
  ].filter(Boolean);

  return [
    "BEGIN:VEVENT",
    `UID:${item.saleWindowId}@concert-drops`,
    `DTSTAMP:${icsDate(stampedAt)}`,
    `DTSTART:${icsDate(new Date(item.startsAt))}`,
    `DURATION:${DURATION}`,
    `SUMMARY:${escapeText(title)}`,
    ...(item.venueName ? [`LOCATION:${escapeText(item.venueName)}`] : []),
    ...(notes.length ? [`DESCRIPTION:${escapeText(notes.join("\n"))}`] : []),
    ...(item.ticketUrl ? [`URL:${item.ticketUrl}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    `TRIGGER:${REMINDER}`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

/** "20261023T170000Z" */
function icsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Escapes backslashes, semicolons, commas and newlines in a text value. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * Splits a line longer than 75 bytes into continuation lines that start with
 * a space, without cutting a multi-byte character in half.
 */
export function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // Continuation lines spend one byte on the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}
