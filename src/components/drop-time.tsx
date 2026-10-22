"use client";

import { formatInTimeZone, tileParts } from "@/lib/time";

import { useViewerTimeZone } from "./use-viewer-time-zone";

/** The colored date block for a show's next drop, in the viewer's time zone. */
export function DropTile({
  startsAt,
  kind,
  isOpen,
  fallbackTimeZone,
}: {
  startsAt: string;
  kind: "presale" | "public";
  /** Already started (a presale that's open now). */
  isOpen: boolean;
  fallbackTimeZone: string;
}) {
  const timeZone = useViewerTimeZone(fallbackTimeZone);
  const t = tileParts(startsAt, timeZone);

  return (
    <time
      dateTime={startsAt}
      className={`flex w-full flex-col rounded-2xl p-3.5 sm:w-38 ${
        kind === "presale" ? "bg-presale" : "bg-onsale"
      }`}
    >
      <span className="text-xs font-bold tracking-wider uppercase">
        {kind === "presale" ? "Presale" : "On-sale"} ·{" "}
        {isOpen ? "Open now" : t.weekday}
      </span>
      <span className="text-3xl leading-tight font-extrabold tracking-tight">
        {t.month} {t.day}
      </span>
      <span className="text-sm font-bold">
        {t.time} {t.zone}
      </span>
    </time>
  );
}

/** A drop time such as "Wed, Oct 28 · 2:00 PM PT", in the viewer's time zone. */
export function DropTime({
  startsAt,
  fallbackTimeZone,
}: {
  startsAt: string;
  fallbackTimeZone: string;
}) {
  const timeZone = useViewerTimeZone(fallbackTimeZone);
  return (
    <time dateTime={startsAt}>{formatInTimeZone(startsAt, timeZone)}</time>
  );
}
