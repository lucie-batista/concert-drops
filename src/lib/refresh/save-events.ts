import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { chunk } from "@/lib/chunk";
import type { Database } from "@/lib/supabase/database.types";

import type { MatchedEvent } from "./match-events";

const BATCH_SIZE = 200;

export type SaveSummary = {
  events: number;
  venues: number;
  saleWindows: number;
  staleSaleWindowsRemoved: number;
};

/**
 * Stores a city's events with their venues, my artists and sale windows. Venue
 * capacities (curated by hand) are never overwritten. Sale windows Ticketmaster
 * no longer lists are removed, unless they're on my schedule.
 */
export async function saveCityEvents(
  admin: SupabaseClient<Database>,
  cityId: string,
  events: MatchedEvent[],
  seenAt: string,
): Promise<SaveSummary> {
  const venues = new Map(
    events.flatMap(({ event }) =>
      event.venue ? [[event.venue.id, event.venue] as const] : [],
    ),
  );
  for (const batch of chunk([...venues.values()], BATCH_SIZE)) {
    const { error } = await admin.from("venues").upsert(
      batch.map((v) => ({
        id: v.id,
        name: v.name,
        city: v.city,
        state_code: v.stateCode,
        country_code: v.countryCode,
        time_zone: v.timeZone,
        latitude: v.latitude,
        longitude: v.longitude,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  for (const batch of chunk(events, BATCH_SIZE)) {
    const { error } = await admin.from("events").upsert(
      batch.map(({ event, artistIds }) => ({
        id: event.id,
        city_id: cityId,
        venue_id: event.venue?.id ?? null,
        name: event.name,
        starts_at: event.startsAt,
        local_date: event.localDate,
        url: event.url,
        status: event.status,
        has_my_artists: artistIds.length > 0,
        genre: event.genre,
        subgenre: event.subgenre,
        image_url: event.imageUrl,
        performers: event.attractions.map((a) => ({ id: a.id, name: a.name })),
        updated_at: seenAt,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  const eventArtists = events.flatMap(({ event, artistIds }) =>
    artistIds.map((artistId) => ({ event_id: event.id, artist_id: artistId })),
  );
  for (const batch of chunk(eventArtists, BATCH_SIZE)) {
    const { error } = await admin.from("event_artists").upsert(batch, {
      onConflict: "event_id,artist_id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  // Ticketmaster occasionally lists the same window twice; one upsert can't
  // touch a row twice, so dedupe by the table's unique key first.
  const windowRows = new Map(
    events.flatMap(({ event }) =>
      event.saleWindows.map((w) => [
        `${event.id}|${w.kind}|${w.name}|${w.startsAt}`,
        {
          event_id: event.id,
          kind: w.kind,
          name: w.name,
          description: w.description,
          starts_at: w.startsAt,
          ends_at: w.endsAt,
          url: w.url,
        },
      ]),
    ),
  );
  const seenWindowIds = new Set<string>();
  for (const batch of chunk([...windowRows.values()], BATCH_SIZE)) {
    const { data, error } = await admin
      .from("sale_windows")
      .upsert(batch, { onConflict: "event_id,kind,name,starts_at" })
      .select("id");
    if (error) throw error;
    for (const row of data ?? []) seenWindowIds.add(row.id);
  }

  const staleSaleWindowsRemoved = await removeStaleSaleWindows(
    admin,
    events.map(({ event }) => event.id),
    seenWindowIds,
  );

  return {
    events: events.length,
    venues: venues.size,
    saleWindows: windowRows.size,
    staleSaleWindowsRemoved,
  };
}

/** Deletes windows of these events that weren't seen this run and aren't scheduled. */
async function removeStaleSaleWindows(
  admin: SupabaseClient<Database>,
  eventIds: string[],
  seenWindowIds: Set<string>,
): Promise<number> {
  const { data: scheduled, error: scheduleError } = await admin
    .from("schedule_items")
    .select("sale_window_id");
  if (scheduleError) throw scheduleError;
  const keep = new Set([
    ...seenWindowIds,
    ...(scheduled ?? []).map((s) => s.sale_window_id),
  ]);

  const stale: string[] = [];
  for (const batch of chunk(eventIds, BATCH_SIZE)) {
    const { data, error } = await admin
      .from("sale_windows")
      .select("id")
      .in("event_id", batch);
    if (error) throw error;
    for (const row of data ?? []) {
      if (!keep.has(row.id)) stale.push(row.id);
    }
  }

  for (const batch of chunk(stale, BATCH_SIZE)) {
    const { error } = await admin.from("sale_windows").delete().in("id", batch);
    if (error) throw error;
  }
  return stale.length;
}
