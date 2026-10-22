import Link from "next/link";
import { Suspense } from "react";

import { ShowCard } from "@/components/show-card";
import { getUpcomingDrops } from "@/lib/drops/queries";

import { AuthButtonPlaceholder } from "./auth-button";
import { AuthControls } from "./auth-controls";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { city, shows, loadedAt } = await getUpcomingDrops();

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

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl leading-[0.9] font-extrabold tracking-tighter sm:text-7xl">
            Upcoming drops
          </h1>
          <p className="text-muted max-w-2xl text-lg font-medium">
            Presales and on-sales for the artists I listen to, near {city.name}.
            Times are in your time zone.
          </p>
        </div>

        {shows.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {shows.map((show) => (
              <li key={show.eventId}>
                <ShowCard show={show} now={loadedAt} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="bg-surface rounded-3xl p-6 font-medium">
            No upcoming drops right now. New presales are checked every morning.
          </p>
        )}
      </main>
    </>
  );
}
