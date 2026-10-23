import type { ScheduleItem } from "./map";

/** How long a drop counts as "open now" before the banner moves on. */
export const OPEN_FOR_MS = 60 * 60 * 1000;

export type NextDrop = { item: ScheduleItem; isOpen: boolean };

/**
 * The ticked drop to count down to: one that opened in the last hour, or else
 * the soonest one ahead. Null when nothing ticked is coming up.
 */
export function pickNextDrop(
  items: ScheduleItem[],
  now: number,
): NextDrop | null {
  const item = items.find((i) => Date.parse(i.startsAt) > now - OPEN_FOR_MS);
  if (!item) return null;
  return { item, isOpen: Date.parse(item.startsAt) <= now };
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Splits the time left into whole days, hours, minutes and seconds. */
export function countdownParts(msLeft: number): Countdown {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
