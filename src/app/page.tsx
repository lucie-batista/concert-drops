import Link from "next/link";
import { Suspense } from "react";

import { OnSaleCard } from "@/components/on-sale-card";
import { SchedulePanel } from "@/components/schedule-panel";
import { ShowCard } from "@/components/show-card";
import { getHomeData } from "@/lib/drops/queries";
import { getSchedule } from "@/lib/schedule/queries";

import { AuthButtonPlaceholder } from "./auth-button";
import { AuthControls } from "./auth-controls";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { city, drops, onSale, loadedAt } = await getHomeData();
  const schedule = await getSchedule(city.timeZone);
  const scheduledIds = new Set(schedule.scheduledIds);

  return (
    <>
      <header className="border-ink border-b-2">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-7 gap-y-3 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
            <span aria-hidden="true" className="bg-presale size-7 rounded-lg" />
            concert-drops
          </div>
          <nav aria-label="Main" className="flex gap-6">
            <Link href="/" aria-current="page" className="font-bold">
              01 Drops
            </Link>
          </nav>
          <div className="flex-1" />
          <span className="border-ink inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold">
            {city.name}
          </span>
          {/* Depends on the visitor's cookies, so it streams in after the static page. */}
          <Suspense fallback={<AuthButtonPlaceholder />}>
            <AuthControls searchParams={searchParams} />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-8">
        <h1 className="sr-only">Concert drops near {city.name}</h1>

        <section
          aria-labelledby="drops-heading"
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-3">
            <h2
              id="drops-heading"
              className="text-5xl leading-[0.9] font-extrabold tracking-tighter sm:text-7xl"
            >
              Upcoming drops
            </h2>
            <p className="text-muted max-w-2xl text-lg font-medium">
              Presales and on-sales for the artists I listen to, near{" "}
              {city.name}. Times are in your time zone.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-[999_1_560px]">
              {drops.length > 0 ? (
                <ol className="flex flex-col gap-3">
                  {drops.map((show) => (
                    <li key={show.eventId}>
                      <ShowCard
                        show={show}
                        now={loadedAt}
                        scheduledIds={scheduledIds}
                      />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="bg-surface rounded-3xl p-6 font-medium">
                  No upcoming drops right now. New presales are checked every
                  morning.
                </p>
              )}
            </div>
            <div className="min-w-0 flex-[1_1_320px] lg:sticky lg:top-6">
              <SchedulePanel items={schedule.items} />
            </div>
          </div>
        </section>

        {onSale.length > 0 && (
          <section
            aria-labelledby="on-sale-heading"
            className="flex flex-col gap-6"
          >
            <div className="border-ink flex flex-col gap-2 border-t-2 pt-8">
              <h2
                id="on-sale-heading"
                className="text-4xl leading-none font-extrabold tracking-tighter sm:text-5xl"
              >
                On sale now
              </h2>
              <p className="text-muted max-w-2xl font-medium">
                {onSale.length} upcoming shows by artists I listen to that
                already have tickets out. Ticketmaster doesn’t share whether a
                show is sold out, so check the ticket link.
              </p>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {onSale.map((show) => (
                // min-w-0 lets the card shrink to the column so long names truncate.
                <li key={show.eventId} className="min-w-0">
                  <OnSaleCard show={show} now={loadedAt} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </>
  );
}
