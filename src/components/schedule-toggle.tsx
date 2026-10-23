"use client";

import { useOptimistic, useState, useTransition } from "react";

import { setScheduled } from "@/app/actions";

import { useIsOwner } from "./owner-state";

/**
 * The owner's check button for one drop. Visitors see a colored dot instead.
 * The tick shows immediately and rolls back if saving fails.
 */
export function ScheduleToggle({
  saleWindowId,
  scheduled,
  kind,
  label,
  onDark = false,
}: {
  saleWindowId: string;
  scheduled: boolean;
  kind: "presale" | "public";
  /** What's being scheduled, for screen readers, e.g. "Ashe, Artist Presale". */
  label: string;
  /** Styles for dark backgrounds, like the schedule panel. */
  onDark?: boolean;
}) {
  const isOwner = useIsOwner();
  const [optimistic, setOptimistic] = useOptimistic(scheduled);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!isOwner) {
    return (
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 self-center rounded-full ${
          kind === "presale" ? "bg-presale" : "bg-onsale"
        }`}
      />
    );
  }

  const toggle = () => {
    const next = !optimistic;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await setScheduled(saleWindowId, next);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimistic}
        aria-label={`${optimistic ? "Remove" : "Add"} ${label} ${
          optimistic ? "from" : "to"
        } Lucie’s drop schedule`}
        // A 44px tap target around a smaller visible box.
        className="-m-2.5 inline-flex size-11 shrink-0 items-center justify-center self-center"
      >
        <span
          className={`flex size-6 items-center justify-center rounded-md border-2 ${
            onDark
              ? `border-white ${optimistic ? "bg-onsale text-ink" : "text-transparent"}`
              : `border-ink ${optimistic ? "bg-ink text-onsale" : "bg-white text-transparent"}`
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </button>
      {error && (
        <span role="alert" className="w-full text-sm font-bold text-red-700">
          {error}
        </span>
      )}
    </>
  );
}
