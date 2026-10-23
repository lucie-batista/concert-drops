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
      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-3xl px-5 py-4 sm:px-6 ${
        item.kind === "presale" ? "bg-presale/15" : "bg-onsale/30"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          id="next-drop-heading"
          className="text-ink/70 text-xs font-bold tracking-wider uppercase"
        >
          Next drop on Lucie’s schedule
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p
            role="timer"
            className="text-3xl leading-none font-extrabold tracking-tight tabular-nums"
          >
            {isOpen ? (
              "Open now"
            ) : (
              <Countdown
                msLeft={now === null ? null : Date.parse(item.startsAt) - now}
              />
            )}
          </p>
          <p className="text-ink/80 font-medium">
            <span className="text-ink font-bold">{item.artistNames}</span> ·{" "}
            {item.windowName} ·{" "}
            <DropTime
              startsAt={item.startsAt}
              fallbackTimeZone={item.timeZone}
            />
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.signUpUrl && (
          <a
            href={item.signUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-ink inline-flex min-h-11 items-center rounded-full border-2 bg-white px-4 text-sm font-bold"
          >
            Sign up ↗
          </a>
        )}
        {item.ticketUrl && (
          <a
            href={item.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-white"
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
          <span className="text-ink/60 text-[0.6em]">{unit}</span>
        </span>
      ))
  );
}
