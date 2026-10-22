"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * The viewer's time zone. The server can't know it, so server rendering (and
 * hydration) uses the fallback, then React re-renders with the browser's zone.
 */
export function useViewerTimeZone(fallback: string): string {
  return useSyncExternalStore(subscribe, browserTimeZone, () => fallback);
}
