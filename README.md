# concert-drops

A personal radar for concert ticket drops. It reads my Spotify listening, finds upcoming presales and on-sales for those artists in my city, ranks them by how much I'd want to be there, and keeps a schedule of the drops I'm going for.

I kept missing presales for artists I really like and ending up on overpriced resale. This is the fix.

> **Status:** in progress. The plan is below.

## Planned features

- **Drops feed:** presale and general on-sale windows for my top and followed Spotify artists, from Ticketmaster.
- **Match score:** each show ranked by listening history, venue size and timing, with a short "why it's a match".
- **My drop schedule:** tick the drops I'm going for and get a simple list in date order, plus calendar export.
- **City switcher:** San Francisco by default; any city on demand.
- **Time zones done right:** concert times in the venue's time zone, drop times in the viewer's.
- **Later:** email reminders and a taste quiz so visitors can try it with their own taste.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres and auth), planned
- Spotify Web API and Ticketmaster Discovery API, planned
- [Vitest](https://vitest.dev) for tests; GitHub Actions for CI
- Hosted on [Vercel](https://vercel.com)

## Running locally

Requires Node 24 (see `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm test           # unit tests
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run format     # Prettier
```

## Author

Built by Lucie ([@lucie-batista](https://github.com/lucie-batista)).
