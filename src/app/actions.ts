"use server";

import { updateTag } from "next/cache";

import { CityNotFoundError, switchCity } from "@/lib/cities/switch";
import { DROPS_TAG } from "@/lib/drops/queries";
import { requireEnv } from "@/lib/env";
import { SCHEDULE_TAG } from "@/lib/schedule/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createTicketmasterClient } from "@/lib/ticketmaster/client";

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

/**
 * Makes a city (by GeoNames id) the one everyone sees. The first visit to a
 * city, or one not loaded in a day, sweeps Ticketmaster first. Owner only,
 * since each sweep spends Ticketmaster's daily request allowance.
 */
export async function chooseCity(geonameId: number): Promise<ActionResult> {
  if (!Number.isSafeInteger(geonameId) || geonameId <= 0) {
    return { ok: false, error: "That city couldn’t be found." };
  }

  const supabase = await createClient();
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    return { ok: false, error: "Only the owner can change the city." };
  }

  try {
    await switchCity({
      admin: createAdminClient(),
      ticketmaster: createTicketmasterClient({
        apiKey: requireEnv("TICKETMASTER_API_KEY"),
      }),
      geonameId,
      now: new Date(),
    });
  } catch (error) {
    if (error instanceof CityNotFoundError) {
      return { ok: false, error: error.message };
    }
    console.error("Switching city failed", error);
    return {
      ok: false,
      error: "Couldn’t load shows for that city. Try again.",
    };
  }

  updateTag(DROPS_TAG);
  return { ok: true };
}
