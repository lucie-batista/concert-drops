import type { ScheduleItem } from "@/lib/schedule/map";
import { localDateIn } from "@/lib/time";

/** Reminders go out on my clock, wherever the drops are. */
export const HOME_TIME_ZONE = "America/Los_Angeles";

export type Slot = "evening" | "morning";

/** The hour each reminder goes out: 9 PM the night before, 7 AM the day of. */
const SLOT_HOURS: Record<Slot, number> = { evening: 21, morning: 7 };

/**
 * Which reminder is due at this moment, if any. The cron runs at two UTC
 * hours for each slot (one per daylight saving offset) and only the run that
 * lands on the right local hour sends.
 */
export function slotAt(now: Date, timeZone: string): Slot | null {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  for (const [slot, slotHour] of Object.entries(SLOT_HOURS)) {
    if (hour === slotHour) return slot as Slot;
  }
  return null;
}

/**
 * The drops a reminder covers: tomorrow's in the evening, and the rest of
 * today's in the morning.
 */
export function dropsForSlot(
  slot: Slot,
  items: ScheduleItem[],
  now: Date,
  timeZone: string,
): ScheduleItem[] {
  const today = localDateIn(timeZone, now);
  const day = slot === "evening" ? nextDay(today) : today;
  return items.filter(
    (item) =>
      localDateIn(timeZone, item.startsAt) === day &&
      new Date(item.startsAt) > now,
  );
}

/** "2026-10-31" → "2026-11-01". */
function nextDay(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
