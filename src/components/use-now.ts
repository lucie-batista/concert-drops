"use client";

import { useSyncExternalStore } from "react";

// One shared clock that ticks every second while something is watching it.
let now: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    now = Date.now();
    for (const l of listeners) l();
  }, 1000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
      now = null;
    }
  };
}

function getSnapshot() {
  now ??= Date.now();
  return now;
}

/**
 * The current time in ms, updated every second. Null on the server and during
 * hydration, since the prerendered page can't know when it's being viewed.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
