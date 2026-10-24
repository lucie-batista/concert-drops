import Image from "next/image";
import type { ReactNode } from "react";

import type { OnSaleShow } from "@/lib/drops/group";
import { formatShowDate, tileParts } from "@/lib/time";

import { MatchBadge } from "./match-badge";

/**
 * A show that's already on sale. Its tile shows the concert itself, in the
 * venue's time zone, since that's when it happens wherever the viewer is.
 */
export function OnSaleCard({
  show,
  now,
  badge,
}: {
  show: OnSaleShow;
  now: string;
  /** Replaces the match badge. */
  badge?: ReactNode;
}) {
  const artistNames = show.artists.map((a) => a.name).join(", ");
  const photo = show.artists.find((a) => a.imageUrl);

  return (
    <article className="flex items-center gap-4 rounded-3xl border-2 border-black/10 p-3 sm:gap-5">
      <ShowTile show={show} now={now} />

      {photo?.imageUrl && (
        <Image
          src={photo.imageUrl}
          alt=""
          width={48}
          height={48}
          className="hidden size-12 shrink-0 rounded-xl object-cover sm:block"
        />
      )}

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-lg leading-tight font-extrabold tracking-tight break-words">
          {artistNames || show.eventName}
        </h3>
        <div className="flex min-w-0 items-center gap-2">
          {badge ?? <MatchBadge score={show.score} />}
          <p className="text-muted truncate text-sm font-medium">
            {show.venueName}
          </p>
        </div>
      </div>

      {show.eventUrl && (
        <a
          href={show.eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Tickets for ${artistNames || show.eventName}`}
          className="border-ink inline-flex min-h-11 shrink-0 items-center rounded-full border-2 px-3 text-sm font-bold sm:px-4"
        >
          Tickets ↗
        </a>
      )}
    </article>
  );
}

function ShowTile({ show, now }: { show: OnSaleShow; now: string }) {
  const className =
    "bg-ink flex w-24 shrink-0 flex-col rounded-2xl px-3 py-2.5 text-white";

  if (show.showStartsAt) {
    const t = tileParts(show.showStartsAt, show.timeZone);
    return (
      <time dateTime={show.showStartsAt} className={className}>
        <span className="text-xs font-bold tracking-wider uppercase">
          {t.weekday}
        </span>
        <span className="text-xl leading-tight font-extrabold tracking-tight">
          {t.month} {t.day}
        </span>
        <span className="text-xs font-bold">
          {t.time} {t.zone}
        </span>
      </time>
    );
  }

  // Time TBA: show the date only.
  const [weekday, date] = show.showLocalDate
    ? formatShowDate(show.showLocalDate, new Date(now)).split(", ")
    : ["", "TBA"];
  return (
    <time dateTime={show.showLocalDate ?? undefined} className={className}>
      <span className="text-xs font-bold tracking-wider uppercase">
        {weekday}
      </span>
      <span className="text-xl leading-tight font-extrabold tracking-tight">
        {date}
      </span>
      <span className="text-xs font-bold">Time TBA</span>
    </time>
  );
}
