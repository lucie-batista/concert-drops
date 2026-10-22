import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import { toScheduleItems, type ScheduleItem, type ScheduleRow } from "./map";

/** Cache tag for the schedule; ticking a drop updates it. */
export const SCHEDULE_TAG = "schedule";

export type Schedule = {
  items: ScheduleItem[];
  /** Every ticked sale window, so cards can show their ticks. */
  scheduledIds: string[];
};

/** My ticked drops that are still ahead (or opened in the last day). */
export async function getSchedule(fallbackTimeZone: string): Promise<Schedule> {
  "use cache";
  cacheLife("hours");
  cacheTag(SCHEDULE_TAG);

  const { data, error } = await createPublicClient()
    .from("schedule_items")
    .select(
      `sale_windows(id, kind, name, url, starts_at,
         events(name, url, venues(name, time_zone), event_artists(artists(name))))`,
    );
  if (error) throw error;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const rows = data as ScheduleRow[];
  return {
    items: toScheduleItems(rows, fallbackTimeZone, since),
    scheduledIds: rows.flatMap((r) =>
      r.sale_windows ? [r.sale_windows.id] : [],
    ),
  };
}
