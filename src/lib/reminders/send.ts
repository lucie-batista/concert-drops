import "server-only";

import type { EmailClient } from "@/lib/email/resend";
import {
  SCHEDULE_COLUMNS,
  toScheduleItems,
  type ScheduleRow,
} from "@/lib/schedule/map";
import type { createAdminClient } from "@/lib/supabase/admin";

import { reminderEmail } from "./email";
import { dropsForSlot, HOME_TIME_ZONE, slotAt, type Slot } from "./plan";

type Admin = ReturnType<typeof createAdminClient>;

export type ReminderResult = {
  slot: Slot | null;
  sent: string[];
};

/**
 * Emails me about the drops on my schedule when a reminder is due. Each drop
 * is claimed in `reminder_sends` before sending, so a repeated cron run skips
 * it; if the email fails, the claims are released for the next run.
 */
export async function sendReminders(options: {
  admin: Admin;
  email: EmailClient;
  to: string;
  siteUrl: string;
  now: Date;
  timeZone?: string;
}): Promise<ReminderResult> {
  const { admin, email, to, siteUrl, now, timeZone = HOME_TIME_ZONE } = options;

  const slot = slotAt(now, timeZone);
  if (!slot) return { slot, sent: [] };

  const due = dropsForSlot(
    slot,
    await scheduledDrops(admin, now, timeZone),
    now,
    timeZone,
  );
  if (due.length === 0) return { slot, sent: [] };

  const { data: claimed, error } = await admin
    .from("reminder_sends")
    .upsert(
      due.map((item) => ({ sale_window_id: item.saleWindowId, slot })),
      { onConflict: "sale_window_id,slot", ignoreDuplicates: true },
    )
    .select("sale_window_id");
  if (error) throw error;

  const claimedIds = new Set(claimed.map((row) => row.sale_window_id));
  const items = due.filter((item) => claimedIds.has(item.saleWindowId));
  if (items.length === 0) return { slot, sent: [] };

  try {
    await email.send({
      to,
      ...reminderEmail(slot, items, { timeZone, siteUrl }),
    });
  } catch (e) {
    await admin
      .from("reminder_sends")
      .delete()
      .eq("slot", slot)
      .in("sale_window_id", [...claimedIds]);
    throw e;
  }
  return { slot, sent: items.map((item) => item.saleWindowId) };
}

/**
 * Sends a sample reminder with my next few drops, to check email works. It
 * doesn't count as a reminder, so the real ones still go out.
 */
export async function sendTestReminder(options: {
  admin: Admin;
  email: EmailClient;
  to: string;
  siteUrl: string;
  now: Date;
  timeZone?: string;
}): Promise<ReminderResult> {
  const { admin, email, to, siteUrl, now, timeZone = HOME_TIME_ZONE } = options;

  const items = (await scheduledDrops(admin, now, timeZone))
    .filter((item) => new Date(item.startsAt) > now)
    .slice(0, 3);
  if (items.length === 0) return { slot: null, sent: [] };

  const { subject, html, text } = reminderEmail("upcoming", items, {
    timeZone,
    siteUrl,
  });
  await email.send({ to, subject: `[Test] ${subject}`, html, text });
  return { slot: null, sent: items.map((item) => item.saleWindowId) };
}

async function scheduledDrops(admin: Admin, now: Date, timeZone: string) {
  const { data, error } = await admin
    .from("schedule_items")
    .select(SCHEDULE_COLUMNS);
  if (error) throw error;
  return toScheduleItems(data as ScheduleRow[], timeZone, now.toISOString());
}
