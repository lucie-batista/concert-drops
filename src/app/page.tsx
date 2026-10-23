import { Suspense } from "react";

import { CityPicker } from "@/components/city-picker";
import { NextDropBanner } from "@/components/next-drop-banner";
import { OnSaleCard } from "@/components/on-sale-card";
import { SchedulePanel } from "@/components/schedule-panel";
import { ShowCard } from "@/components/show-card";
import { SiteHeader } from "@/components/site-header";
import { SortableList } from "@/components/sortable-list";
import { getHomeData } from "@/lib/drops/queries";
import { getSchedule } from "@/lib/schedule/queries";

import { AuthButtonPlaceholder } from "./auth-button";
import { AuthControls } from "./auth-controls";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { city, recentCities, drops, onSale, loadedAt } = await getHomeData();
  const schedule = await getSchedule(city.timeZone);
  const scheduledIds = new Set(schedule.scheduledIds);

  return (
    <>
      <SiteHeader current="/">
        <CityPicker city={city} recentCities={recentCities} />
        {/* Depends on the visitor's cookies, so it streams in after the static page. */}
        <Suspense fallback={<AuthButtonPlaceholder />}>
          <AuthControls searchParams={searchParams} />
        </Suspense>
      </SiteHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-8">
        <h1 className="sr-only">Concert drops near {city.name}</h1>

        <section
          aria-labelledby="drops-heading"
          className="flex flex-col gap-8"
        >
          <NextDropBanner items={schedule.items} />

          <div className="flex flex-col gap-3">
            <h2
              id="drops-heading"
              className="text-5xl leading-[0.9] font-extrabold tracking-tighter sm:text-7xl"
            >
              Upcoming drops
            </h2>
            <p className="text-muted max-w-2xl text-lg font-medium">
              Presales and on-sales for the artists Lucie listens to, near{" "}
              {city.name}. Times are in your time zone.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-[999_1_560px]">
              {drops.length > 0 ? (
                <SortableList
                  label="upcoming drops"
                  listClassName="flex flex-col gap-3"
                  items={drops.map((show) => ({
                    key: show.eventId,
                    score: show.score,
                    node: (
                      <ShowCard
                        show={show}
                        now={loadedAt}
                        scheduledIds={scheduledIds}
                      />
                    ),
                  }))}
                />
              ) : (
                <p className="bg-surface rounded-3xl p-6 font-medium">
                  No upcoming drops right now. New presales are checked every
                  morning.
                </p>
              )}
            </div>
            {/* Once the panel sits beside the list (968px+), skip past the sort buttons so it lines up with the first card. */}
            <div className="min-w-0 flex-[1_1_320px] min-[968px]:mt-16 lg:sticky lg:top-6">
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
                {onSale.length} upcoming shows by artists Lucie listens to that
                already have tickets out. Ticketmaster doesn’t share whether a
                show is sold out, so check the ticket link.
              </p>
            </div>
            <SortableList
              label="shows on sale now"
              listClassName="grid gap-3 md:grid-cols-2"
              // min-w-0 lets the card shrink to the column so long names truncate.
              itemClassName="min-w-0"
              items={onSale.map((show) => ({
                key: show.eventId,
                score: show.score,
                node: <OnSaleCard show={show} now={loadedAt} />,
              }))}
            />
          </section>
        )}
      </main>
    </>
  );
}
