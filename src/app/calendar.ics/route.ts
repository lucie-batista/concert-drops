import { type NextRequest } from "next/server";

import { buildCalendar } from "@/lib/calendar/ics";
import { getSchedule } from "@/lib/schedule/queries";

/**
 * My scheduled drops as a calendar file. `?drop=<id>` gives just that drop;
 * without it, every upcoming drop on the schedule.
 */
export async function GET(request: NextRequest) {
  const dropId = request.nextUrl.searchParams.get("drop");
  // Calendar times are written in UTC, so the fallback zone doesn't matter.
  const { items } = await getSchedule("UTC");

  const now = Date.now();
  const upcoming = items.filter((i) => Date.parse(i.startsAt) > now);
  const chosen = dropId
    ? items.filter((i) => i.saleWindowId === dropId)
    : upcoming;

  if (dropId && chosen.length === 0) {
    return new Response("That drop isn’t on the schedule.", { status: 404 });
  }

  const filename = dropId
    ? `${slug(`${chosen[0].artistNames} ${chosen[0].windowName}`)}.ics`
    : "concert-drops.ics";

  return new Response(buildCalendar(chosen, new Date(now)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** "SIENNA SPIRO General on-sale" → "sienna-spiro-general-on-sale" */
function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      // Drop accents: "é" becomes "e" plus a mark, and the mark goes.
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "drop"
  );
}
