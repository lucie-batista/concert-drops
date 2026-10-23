import Link from "next/link";

import type { ScheduleItem } from "@/lib/schedule/map";

import { DropTime } from "./drop-time";
import { ScheduleToggle } from "./schedule-toggle";

/** My ticked drops, in date order. Visitors see it read-only, with a way to find their own. */
export function SchedulePanel({ items }: { items: ScheduleItem[] }) {
  return (
    <aside
      aria-labelledby="schedule-heading"
      className="bg-ink flex flex-col gap-4 rounded-3xl p-6 text-white"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="schedule-heading"
          className="text-2xl font-extrabold tracking-tight"
        >
          Lucie’s schedule
        </h2>
        <span className="text-onsale shrink-0 font-bold">
          {items.length} {items.length === 1 ? "drop" : "drops"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-white/75">
          Nothing on the schedule yet. Ticked drops show up here.
        </p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.saleWindowId}
              className="flex items-center gap-3 border-t border-white/15 py-3.5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-onsale text-sm font-bold">
                  <DropTime
                    startsAt={item.startsAt}
                    fallbackTimeZone={item.timeZone}
                  />
                </span>
                <span className="text-lg leading-tight font-extrabold">
                  {item.artistNames}
                </span>
                <span className="text-sm text-white/75">
                  {[item.windowName, item.venueName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold">
                  {item.signUpUrl && (
                    <a
                      href={item.signUpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      Sign up ↗
                    </a>
                  )}
                  {item.ticketUrl && (
                    <a
                      href={item.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      Tickets ↗
                    </a>
                  )}
                  <a
                    href={`/calendar.ics?drop=${item.saleWindowId}`}
                    className="underline underline-offset-2"
                  >
                    Add to calendar
                  </a>
                </span>
              </div>
              <ScheduleToggle
                saleWindowId={item.saleWindowId}
                scheduled
                kind={item.kind}
                label={`${item.artistNames}, ${item.windowName}`}
                onDark
              />
            </li>
          ))}
        </ol>
      )}

      {items.length > 1 && (
        <a
          href="/calendar.ics"
          className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white px-4 text-sm font-bold"
        >
          Add all to calendar
        </a>
      )}

      <Link
        href="/quiz"
        className="self-start text-sm font-bold text-white/75 underline underline-offset-2 hover:text-white"
      >
        Want your own? Take the quiz →
      </Link>
    </aside>
  );
}
