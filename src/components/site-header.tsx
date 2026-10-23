import Link from "next/link";
import type { ReactNode } from "react";

const PAGES = [
  { href: "/", label: "01 Drops" },
  { href: "/quiz", label: "02 Try your taste" },
  { href: "/popular", label: "03 Popular" },
] as const;

/** The logo, page links, and whatever the page puts on the right. */
export function SiteHeader({
  current,
  children,
}: {
  current: (typeof PAGES)[number]["href"];
  children?: ReactNode;
}) {
  return (
    <header className="border-ink border-b-2">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-7 gap-y-3 px-6 py-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight"
        >
          <span aria-hidden="true" className="bg-presale size-7 rounded-lg" />
          concert-drops
        </Link>
        <nav aria-label="Main" className="flex gap-6">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              aria-current={page.href === current ? "page" : undefined}
              className={
                page.href === current
                  ? "font-bold"
                  : "text-muted hover:text-ink font-bold"
              }
            >
              {page.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        {children}
      </div>
    </header>
  );
}
