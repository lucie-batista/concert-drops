import Image from "next/image";

import type { ShowDrops } from "@/lib/drops/group";
import { formatInTimeZone, formatShowDate } from "@/lib/time";

import { DropTile, DropTime } from "./drop-time";
import { ScheduleToggle } from "./schedule-toggle";

/** One show: its next drop, the artists, and every upcoming sale window. */
export function ShowCard({
  show,
  now,
  scheduledIds,
}: {
  show: ShowDrops;
  now: string;
  /** Sale windows on my schedule. */
  scheduledIds: Set<string>;
}) {
  const next = show.windows[0];
  const artistNames = show.artists.map((a) => a.name).join(", ");
  const photo = show.artists.find((a) => a.imageUrl);

  return (
    <article className="bg-surface flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-start sm:gap-6">
      <DropTile
        startsAt={next.startsAt}
        kind={next.kind}
        isOpen={next.startsAt <= now}
        fallbackTimeZone={show.timeZone}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          {photo?.imageUrl && (
            <Image
              src={photo.imageUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0">
            <h3 className="text-2xl leading-tight font-extrabold tracking-tight">
              {artistNames || show.eventName}
            </h3>
            <p className="text-muted font-medium">
              {[show.venueName, showDate(show, now)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {show.windows.map((w) => (
            <li
              key={w.id}
              className="flex min-h-7 flex-wrap items-baseline gap-x-2"
            >
              <ScheduleToggle
                saleWindowId={w.id}
                scheduled={scheduledIds.has(w.id)}
                kind={w.kind}
                label={`${artistNames || show.eventName}, ${
                  w.kind === "public" ? "General on-sale" : w.name
                }`}
              />
              <span className="font-bold">
                {w.kind === "public" ? "General on-sale" : w.name}
              </span>
              <span className="text-muted">
                <DropTime
                  startsAt={w.startsAt}
                  fallbackTimeZone={show.timeZone}
                />
              </span>
              {w.url && (
                <a
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline underline-offset-2"
                >
                  Sign up ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      {show.eventUrl && (
        <a
          href={show.eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-ink inline-flex min-h-11 items-center justify-center self-start rounded-full border-2 bg-white px-4 text-sm font-bold"
        >
          Tickets ↗
        </a>
      )}
    </article>
  );
}

/** "Sat, Feb 14 · 8:00 PM PT" in the venue's zone, or just the date if the time is TBA. */
function showDate(show: ShowDrops, now: string): string | null {
  if (show.showStartsAt) {
    return `Show ${formatInTimeZone(show.showStartsAt, show.timeZone)}`;
  }
  return show.showLocalDate
    ? `Show ${formatShowDate(show.showLocalDate, new Date(now))}`
    : null;
}
