"use client";

import { useEffect, useState } from "react";

/**
 * A form button that shows it's working as soon as it's clicked. Login leaves the
 * site for Spotify and comes back, which takes a few seconds; without feedback it
 * looks like nothing happened.
 */
export function AuthButton({
  action,
  label,
  pendingLabel,
}: {
  action: string;
  label: string;
  pendingLabel: string;
}) {
  const [pending, setPending] = useState(false);

  // If the browser restores this page from its back/forward cache, reset the button.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form action={action} method="post" onSubmit={() => setPending(true)}>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="border-ink inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold disabled:cursor-wait disabled:opacity-70"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
        )}
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}

/** Holds the button's place while the login state loads. */
export function AuthButtonPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface h-11 w-32 animate-pulse rounded-full motion-reduce:animate-none"
    />
  );
}
