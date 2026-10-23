"use client";

import type { ScheduleItem } from "@/lib/schedule/map";
import { countdownParts, pickNextDrop } from "@/lib/schedule/next-drop";

import { DropTime } from "./drop-time";
import { useNow } from "./use-now";

/**
 * A live countdown to the next drop on my schedule. Hidden when nothing
 * ticked is coming up.
 */
export function NextDropBanner({ items }: { items: ScheduleItem[] }) {
  const now = useNow();
  // Before the clock is known, show the soonest ticked drop with blank digits.
  const next = pickNextDrop(items, now ?? 0);
  if (!next) return null;

  const { item, isOpen } = next;

  return (
    <section
      aria-labelledby="next-drop-heading"
      className={`flex flex-wrap items-end justify-between gap-6 rounded-3xl p-6 sm:p-8 ${
        item.kind === "presale" ? "bg-presale" : "bg-onsale"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <h2
          id="next-drop-heading"
          className="text-sm font-bold tracking-wider uppercase"
        >
          Next drop on my schedule
        </h2>
        <p
          role="timer"
          className="text-[clamp(2rem,11vw,4.5rem)] leading-none font-extrabold tracking-tighter tabular-nums"
        >
          {isOpen ? (
            "Open now"
          ) : (
            <Countdown
              msLeft={now === null ? null : Date.parse(item.startsAt) - now}
            />
          )}
        </p>
        <p className="text-lg leading-snug font-medium">
          <span className="font-extrabold">{item.artistNames}</span> ·{" "}
          {item.windowName}
          {item.venueName && ` · ${item.venueName}`}
          <br />
          <DropTime startsAt={item.startsAt} fallbackTimeZone={item.timeZone} />
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {item.signUpUrl && (
          <a
            href={item.signUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-ink inline-flex min-h-11 items-center rounded-full border-2 bg-white px-5 font-bold"
          >
            Sign up ↗
          </a>
        )}
        {item.ticketUrl && (
          <a
            href={item.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
          >
            Tickets ↗
          </a>
        )}
      </div>
    </section>
  );
}

/** "2d 14h 06m 09s", with dashes until the clock is known. */
function Countdown({ msLeft }: { msLeft: number | null }) {
  const parts = msLeft === null ? null : countdownParts(msLeft);
  const units = [
    ["d", parts?.days],
    ["h", parts?.hours],
    ["m", parts?.minutes],
    ["s", parts?.seconds],
  ] as const;

  return (
    units
      // Skip days once under a day, so the last stretch reads "05h 12m 30s".
      .filter(([unit, value]) => !(unit === "d" && value === 0))
      .map(([unit, value]) => (
        <span key={unit} className="mr-[0.25em] last:mr-0">
          {value === undefined
            ? "––"
            : unit === "d"
              ? value
              : String(value).padStart(2, "0")}
          <span className="text-[0.5em]">{unit}</span>
        </span>
      ))
  );
}
