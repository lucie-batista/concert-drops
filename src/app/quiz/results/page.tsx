import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OnSaleCard } from "@/components/on-sale-card";
import { ShowCard } from "@/components/show-card";
import { SiteHeader } from "@/components/site-header";
import { SortableList } from "@/components/sortable-list";
import { describeTaste, profileFromSearch } from "@/lib/taste/profile";
import { getCityShows } from "@/lib/taste/queries";
import { rankForTaste } from "@/lib/taste/results";

export const metadata: Metadata = {
  title: "Your drops · concert-drops",
  description: "Upcoming ticket drops picked for your taste.",
};

export default function ResultsPage({
  searchParams,
}: PageProps<"/quiz/results">) {
  return (
    <>
      <SiteHeader current="/quiz" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 sm:px-8">
        {/* The answers are in the link, so this renders per visit. */}
        <Suspense fallback={<p className="font-bold">Finding your shows…</p>}>
          <Results searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: PageProps<"/quiz/results">["searchParams"];
}) {
  const profile = profileFromSearch(await searchParams);
  if (!profile) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-4xl font-extrabold tracking-tighter">
          Take the quiz first
        </h1>
        <p className="text-muted text-lg font-medium">
          Your results come from your answers, and this link doesn’t have any.
        </p>
        <RetakeLink />
      </div>
    );
  }

  const { cityName, timeZone, drops, onSale, loadedAt } = await getCityShows();
  const results = rankForTaste(profile, drops, onSale, timeZone);

  return (
    <>
      <section aria-labelledby="drops-heading" className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-3">
          <p className="bg-presale/15 rounded-full px-3 py-1 text-sm font-bold">
            Your taste: {describeTaste(profile)}
          </p>
          <h1
            id="drops-heading"
            className="text-5xl leading-[0.9] font-extrabold tracking-tighter sm:text-7xl"
          >
            Your drops
          </h1>
          <p className="text-muted max-w-2xl text-lg font-medium">
            Presales and on-sales near {cityName} that fit your quiz answers,
            best matches first. Times are in your time zone.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-bold">
            <RetakeLink />
            <Link href="/" className="underline underline-offset-4">
              See my picks instead
            </Link>
          </div>
        </div>

        {results.drops.length > 0 ? (
          <SortableList
            label="your upcoming drops"
            defaultOrder="best"
            listClassName="flex flex-col gap-3"
            items={results.drops.map((show) => ({
              key: show.eventId,
              score: show.score,
              node: <ShowCard show={show} now={loadedAt} />,
            }))}
          />
        ) : (
          <p className="bg-surface rounded-3xl p-6 font-medium">
            No upcoming drops match your taste right now. New presales are
            checked every morning.
          </p>
        )}
      </section>

      {results.onSale.length > 0 && (
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
              Shows for your taste that already have tickets out.
            </p>
          </div>
          <SortableList
            label="shows on sale now"
            defaultOrder="best"
            listClassName="grid gap-3 md:grid-cols-2"
            itemClassName="min-w-0"
            items={results.onSale.map((show) => ({
              key: show.eventId,
              score: show.score,
              node: <OnSaleCard show={show} now={loadedAt} />,
            }))}
          />
        </section>
      )}
    </>
  );
}

function RetakeLink() {
  return (
    <Link href="/quiz" className="underline underline-offset-4">
      Retake the quiz
    </Link>
  );
}
