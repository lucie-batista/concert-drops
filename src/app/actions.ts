"use server";

import { updateTag } from "next/cache";

import { SCHEDULE_TAG } from "@/lib/schedule/queries";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Adds a drop to my schedule or removes it. Runs as the signed-in user, so the
 * database's row level security decides; only the owner's changes are allowed.
 */
export async function setScheduled(
  saleWindowId: string,
  scheduled: boolean,
): Promise<ActionResult> {
  if (!UUID.test(saleWindowId)) {
    return { ok: false, error: "That drop doesn’t exist." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return { ok: false, error: "Log in to change the schedule." };
  }

  const { error } = scheduled
    ? await supabase
        .from("schedule_items")
        .upsert(
          { sale_window_id: saleWindowId },
          { onConflict: "sale_window_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("schedule_items")
        .delete()
        .eq("sale_window_id", saleWindowId);

  if (error) {
    return { ok: false, error: "Couldn’t save that. Try again." };
  }

  // Show the change right away instead of waiting for the hourly cache.
  updateTag(SCHEDULE_TAG);
  return { ok: true };
}
