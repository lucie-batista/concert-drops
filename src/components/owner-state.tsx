"use client";

import { useEffect, useSyncExternalStore } from "react";

// Whether the owner is signed in. The page is prerendered for everyone, so the
// login controls (rendered per request) report it here for owner-only buttons.
let isOwner = false;
const listeners = new Set<() => void>();

function setIsOwner(value: boolean) {
  if (value === isOwner) return;
  isOwner = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True once the signed-in owner is known. Always false on the server. */
export function useIsOwner(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isOwner,
    () => false,
  );
}

/** Rendered by the login controls to report who's signed in. */
export function OwnerFlag({ isOwner: value }: { isOwner: boolean }) {
  useEffect(() => {
    setIsOwner(value);
  }, [value]);
  return null;
}
