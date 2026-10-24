"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { chooseCity } from "@/app/actions";
import { POPULAR_CITIES } from "@/lib/cities/popular";
import type { CityInfo } from "@/lib/drops/queries";
import {
  placeLabel,
  searchCities,
  type CityOption,
} from "@/lib/geocoding/open-meteo";

import { useIsOwner } from "./owner-state";

type CityPick = { geonameId: number; name: string };

const chipClass =
  "border-ink inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold";

/**
 * The city in the header. For the owner it's a chip that opens a search for
 * any city; everyone else sees a plain label.
 */
export function CityPicker({
  city,
  recentCities,
}: {
  city: CityInfo;
  recentCities: CityInfo[];
}) {
  const isOwner = useIsOwner();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Only I can switch cities, so visitors get a plain label, not a button.
  if (!isOwner) {
    return (
      <span className="text-muted inline-flex min-h-11 items-center gap-1.5 text-sm font-bold">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        {city.name}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className={`${chipClass} gap-1.5`}
      >
        {city.name}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="sr-only">, change city</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="city-dialog-heading"
        className="text-ink backdrop:bg-ink/40 m-auto w-[min(34rem,calc(100%-2rem))] rounded-3xl bg-white p-0"
      >
        <CitySearch
          current={city}
          recentCities={recentCities}
          onDone={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}

function CitySearch({
  current,
  recentCities,
  onDone,
}: {
  current: CityInfo;
  recentCities: CityInfo[];
  onDone: () => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityOption[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<CityPick | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Search as you type, waiting for a short pause and dropping stale requests.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchCities(query, { signal: controller.signal })
        .then((found) => {
          setResults(found);
          setSearchError(null);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          console.error(e);
          setSearchError("City search isn’t working right now.");
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = (pick: CityPick) => {
    if (pick.geonameId === current.geonameId) return onDone();
    setError(null);
    setChoosing(pick);
    startTransition(async () => {
      const result = await chooseCity(pick.geonameId);
      if (result.ok) {
        setQuery("");
        setResults([]);
        onDone();
      } else {
        setError(result.error);
      }
    });
  };

  const showResults = query.trim().length >= 2;
  const recent = recentCities.flatMap((c) =>
    c.geonameId ? [{ geonameId: c.geonameId, name: c.name }] : [],
  );
  const recentIds = new Set(recent.map((c) => c.geonameId));
  const popular = POPULAR_CITIES.filter(
    (c) => c.geonameId !== current.geonameId && !recentIds.has(c.geonameId),
  );

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="city-dialog-heading"
          className="text-2xl font-extrabold tracking-tight"
        >
          Change city
        </h2>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="-m-2 inline-flex size-11 items-center justify-center rounded-full text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {pending && choosing ? (
        <p
          role="status"
          className="bg-surface flex items-center gap-3 rounded-2xl p-4 font-bold"
        >
          <span
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
          Finding shows near {choosing.name}… This can take up to 30 seconds the
          first time.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-sm font-bold">
              Search for a city
            </label>
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Austin, London, Melbourne…"
              autoComplete="off"
              className="border-ink min-h-11 rounded-full border-2 px-4 font-medium"
            />
          </div>

          {showResults && (
            <div aria-live="polite">
              {searchError ? (
                <p className="text-muted">{searchError}</p>
              ) : results.length > 0 ? (
                <ul className="flex flex-col">
                  {results.map((r) => (
                    <li key={r.geonameId}>
                      <button
                        type="button"
                        onClick={() => choose(r)}
                        className="hover:bg-surface flex min-h-11 w-full flex-col items-start rounded-xl px-3 py-2 text-left"
                      >
                        <span className="font-bold">{r.name}</span>
                        <span className="text-muted text-sm">
                          {placeLabel(r)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No cities match “{query.trim()}”.</p>
              )}
            </div>
          )}

          {!showResults && (
            <>
              <CityChips title="Recent" cities={recent} onChoose={choose} />
              <CityChips title="Popular" cities={popular} onChoose={choose} />
            </>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="font-bold text-red-700">
          {error}
        </p>
      )}
      <p className="text-muted text-sm">
        Shows within 25 miles, from Ticketmaster. Everyone visiting sees the
        city you pick.
      </p>
    </div>
  );
}

function CityChips({
  title,
  cities,
  onChoose,
}: {
  title: string;
  cities: readonly CityPick[];
  onChoose: (pick: CityPick) => void;
}) {
  if (cities.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <li key={c.geonameId}>
            <button
              type="button"
              onClick={() => onChoose(c)}
              className={chipClass}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
