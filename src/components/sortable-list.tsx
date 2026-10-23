"use client";

import { useState, type ReactNode } from "react";

export type SortableItem = { key: string; score: number; node: ReactNode };

type Order = "soonest" | "best";

/**
 * A list of server-rendered cards with a Soonest / Best match toggle. Items
 * arrive soonest first; best match sorts by score and keeps that order for ties.
 */
export function SortableList({
  items,
  label,
  listClassName,
  itemClassName,
  defaultOrder = "soonest",
  bestLabel = "Best match",
}: {
  items: SortableItem[];
  /** What's being sorted, for screen readers, e.g. "upcoming drops". */
  label: string;
  listClassName?: string;
  itemClassName?: string;
  defaultOrder?: Order;
  /** The name of the score order, e.g. "Most popular". */
  bestLabel?: string;
}) {
  const [order, setOrder] = useState<Order>(defaultOrder);
  const sorted =
    order === "best" ? [...items].sort((a, b) => b.score - a.score) : items;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label={`Sort ${label}`}
        className="border-ink flex self-start rounded-full border-2 p-0.5 text-sm font-bold"
      >
        {(
          [
            ["soonest", "Soonest"],
            ["best", bestLabel],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            aria-pressed={order === value}
            onClick={() => setOrder(value)}
            className={`min-h-10 rounded-full px-4 ${
              order === value ? "bg-ink text-white" : ""
            }`}
          >
            {text}
          </button>
        ))}
      </div>
      <ol className={listClassName}>
        {sorted.map((item) => (
          <li key={item.key} className={itemClassName}>
            {item.node}
          </li>
        ))}
      </ol>
    </div>
  );
}
