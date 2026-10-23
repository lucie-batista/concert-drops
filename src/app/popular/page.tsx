import type { Metadata } from "next";
import { Suspense } from "react";

import { CityPicker } from "@/components/city-picker";
import { OnSaleCard } from "@/components/on-sale-card";
import { PopularBadge } from "@/components/popular-badge";
import { SchedulePanel } from "@/components/schedule-panel";
import { ShowCard } from "@/components/show-card";
import { SiteHeader } from "@/components/site-header";
import { SortableList } from "@/components/sortable-list";
import { getHomeData } from "@/lib/drops/queries";
import { getPopularData } from "@/lib/popular/queries";
import { POPULAR_COUNT } from "@/lib/popular/rank";
import { getSchedule } from "@/lib/schedule/queries";

import { AuthButtonPlaceholder } from "../auth-button";
import { AuthControls } from "../auth-controls";

export const metadata: Metadata = {
  title: "Popular drops · concert-drops",
  description:
    "Upcoming presales and on-sales for the most listened-to artists in the US.",
};

export default async function PopularPage({
  searchParams,
}: PageProps<"/popular">) {
  const { city, recentCities } = await getHomeData();
  const { drops, onSale, updatedAt, loadedAt } = await getPopularData();
  const schedule = await getSchedule(city.timeZone);
  const scheduledIds = new Set(schedule.scheduledIds);

  return (
    <>
      <SiteHeader current="/popular">
        <CityPicker city={city} recentCities={recentCities} />
        {/* Depends on the visitor's cookies, so it streams in after the static page. */}
        <Suspense fallback={<AuthButtonPlaceholder />}>
          <AuthControls searchParams={searchParams} />
        </Suspense>
      </SiteHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-8">
        <section
          aria-labelledby="drops-heading"
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-3">
            <h1
              id="drops-heading"
              className="text-5xl leading-[0.9] font-extrabold tracking-tighter sm:text-7xl"
            >
              Popular drops
            </h1>
            <p className="text-muted max-w-2xl text-lg font-medium">
              Presales and on-sales near {city.name} for the{" "}
              {POPULAR_COUNT.toLocaleString("en-US")} most listened-to artists
              in the US, ranked by{" "}
              <a
                href="https://www.last.fm/charts"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Last.fm
              </a>
              . Times are in your time zone.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-[999_1_560px]">
              {drops.length > 0 ? (
                <SortableList
                  label="popular drops"
                  bestLabel="Most popular"
                  listClassName="flex flex-col gap-3"
                  items={drops.map((show) => ({
                    key: show.eventId,
                    score: show.score,
                    node: (
                      <ShowCard
                        show={show}
                        now={loadedAt}
                        scheduledIds={scheduledIds}
                        badge={<PopularBadge rank={show.popularRank} />}
                      />
                    ),
                  }))}
                />
              ) : (
                <p className="bg-surface rounded-3xl p-6 font-medium">
                  {updatedAt
                    ? "No popular drops near here right now. New presales are checked every morning."
                    : "The popular artists load with the next morning refresh."}
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
                {onSale.length} upcoming shows by popular artists that already
                have tickets out. Ticketmaster doesn’t share whether a show is
                sold out, so check the ticket link.
              </p>
            </div>
            <SortableList
              label="popular shows on sale now"
              bestLabel="Most popular"
              listClassName="grid gap-3 md:grid-cols-2"
              // min-w-0 lets the card shrink to the column so long names truncate.
              itemClassName="min-w-0"
              items={onSale.map((show) => ({
                key: show.eventId,
                score: show.score,
                node: (
                  <OnSaleCard
                    show={show}
                    now={loadedAt}
                    badge={<PopularBadge rank={show.popularRank} />}
                  />
                ),
              }))}
            />
          </section>
        )}
      </main>
    </>
  );
}
