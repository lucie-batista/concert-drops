import type { TasteProfile } from "./profile";
import {
  knownCapacity,
  sizeFromCapacity,
  VENUE_SIZE_LABELS,
  type VenueSize,
} from "./venue-size";
import { VIBES, type VibeId } from "./vibes";

/** One act playing in the city soon, as the quiz shows it. */
export type QuizAct = {
  /** Ticketmaster attraction id. */
  id: string;
  name: string;
  imageUrl: string;
  vibe: VibeId;
  venueName: string | null;
};

/** What picking an option says about someone's taste. */
export type Signal = { vibe?: VibeId; performer?: string; size?: VenueSize };

export type QuizOption = {
  id: string;
  label: string;
  detail?: string;
  /** Up to four photos. */
  images: string[];
  signal: Signal;
};

export type QuizQuestion = {
  id: string;
  kind: "playlist" | "clash" | "venue" | "vibes";
  prompt: string;
  /** "vibes" questions take several answers; the rest take one. */
  options: QuizOption[];
};

export const QUIZ_LENGTH = 8;

const PLAYLIST_NAMES: Record<VibeId, string> = {
  pop: "Pop on repeat",
  indie: "Indie & alt rotation",
  rock: "Loud guitars",
  hiphop: "Hip-hop & R&B heat",
  electronic: "Late-night electronic",
  folk: "Folk & country roads",
  jazz: "Jazz, soul & blues lounge",
  classical: "Concert hall",
  world: "Latin & world beats",
};

const PLAYLIST_SIZE = 4;

const SIZE_FALLBACKS: Record<VenueSize, string> = {
  small: "Under 1,000 people",
  mid: "1,000 to 5,000 people",
  big: "5,000+ people",
};

/**
 * Eight questions built from acts actually playing in the city, so every
 * answer points at real shows: pick a playlist, pick between two shows on the
 * same night, pick a room size, then any other styles. `seed` keeps the quiz
 * the same for everyone on a given day.
 */
export function buildQuiz(
  acts: QuizAct[],
  venueNames: string[],
  seed: string,
): QuizQuestion[] {
  const random = seededRandom(seed);
  const byVibe = new Map<VibeId, QuizAct[]>();
  for (const act of shuffle(uniqueActs(acts), random)) {
    byVibe.set(act.vibe, [...(byVibe.get(act.vibe) ?? []), act]);
  }

  // Vibes with enough acts for a playlist, most common first.
  const vibes = [...byVibe.keys()].sort(
    (a, b) => byVibe.get(b)!.length - byVibe.get(a)!.length,
  );
  const playlistVibes = vibes.filter(
    (v) => byVibe.get(v)!.length >= PLAYLIST_SIZE,
  );

  const playlists: QuizQuestion[] = [];
  const pairs = shuffle(playlistVibes.slice(0, 6), random);
  for (let i = 0; i + 1 < pairs.length && playlists.length < 3; i += 2) {
    const pair = [pairs[i], pairs[i + 1]];
    playlists.push({
      id: `playlist-${pair.join("-")}`,
      kind: "playlist",
      prompt: "You’re on aux. Which playlist goes on?",
      options: pair.map((vibe) => {
        const picks = byVibe.get(vibe)!.splice(0, PLAYLIST_SIZE);
        return {
          id: vibe,
          label: PLAYLIST_NAMES[vibe],
          detail: picks.map((a) => a.name).join(", "),
          images: picks.map((a) => a.imageUrl),
          signal: { vibe },
        };
      }),
    });
  }

  // Clashes pit two acts of different vibes against each other, cycling
  // through vibes so every style gets a turn.
  const clashes: QuizQuestion[] = [];
  const clashCount = QUIZ_LENGTH - 2 - playlists.length;
  let cursor = 0;
  while (clashes.length < clashCount) {
    const available = vibes.filter((v) => byVibe.get(v)!.length > 0);
    if (available.length < 2) break;
    const a = available[cursor % available.length];
    const b = available[(cursor + 1) % available.length];
    cursor += 2;
    const pair = [byVibe.get(a)!.shift()!, byVibe.get(b)!.shift()!];
    clashes.push({
      id: `clash-${pair.map((p) => p.id).join("-")}`,
      kind: "clash",
      prompt: "Say these two play the same night. Where are you?",
      options: pair.map((act) => ({
        id: act.id,
        label: act.name,
        detail: act.venueName ?? undefined,
        images: [act.imageUrl],
        signal: { vibe: act.vibe, performer: act.id },
      })),
    });
  }

  const venue: QuizQuestion = {
    id: "venue",
    kind: "venue",
    prompt: "Where do you like to see live music?",
    options: (["small", "mid", "big"] as const).map((size) => ({
      id: size,
      label: VENUE_SIZE_LABELS[size],
      detail: exampleVenue(size, venueNames) ?? SIZE_FALLBACKS[size],
      images: [],
      signal: { size },
    })),
  };

  const more: QuizQuestion = {
    id: "vibes",
    kind: "vibes",
    prompt: "Anything else you’d go see? Pick as many as you like.",
    options: VIBES.filter((v) => byVibe.has(v.id)).map((v) => ({
      id: v.id,
      label: v.label,
      images: [],
      signal: { vibe: v.id },
    })),
  };

  // Alternate kinds so it doesn't feel repetitive; the room size sits in the
  // middle and the open-ended question closes.
  const middle = interleave(playlists, clashes);
  return [
    ...middle.slice(0, 3),
    venue,
    ...middle.slice(3, QUIZ_LENGTH - 2),
    more,
  ];
}

/** Adds one answer (the chosen options) to a profile. */
export function applyAnswer(
  profile: TasteProfile,
  chosen: QuizOption[],
): TasteProfile {
  const next: TasteProfile = {
    vibes: { ...profile.vibes },
    performers: [...profile.performers],
    size: profile.size,
  };
  for (const { signal } of chosen) {
    if (signal.vibe)
      next.vibes[signal.vibe] = (next.vibes[signal.vibe] ?? 0) + 1;
    if (signal.performer && !next.performers.includes(signal.performer)) {
      next.performers.push(signal.performer);
    }
    if (signal.size) next.size = signal.size;
  }
  return next;
}

export const EMPTY_PROFILE: TasteProfile = {
  vibes: {},
  performers: [],
  size: null,
};

/** "Like The Independent · about 500 people", from venues in this city. */
function exampleVenue(size: VenueSize, venueNames: string[]): string | null {
  const examples = venueNames
    .map((name) => ({ name, capacity: knownCapacity(name) }))
    .filter(
      (v): v is { name: string; capacity: number } =>
        v.capacity !== null && sizeFromCapacity(v.capacity) === size,
    )
    .sort((a, b) => b.capacity - a.capacity);
  const example = examples[Math.floor(examples.length / 2)];
  if (!example) return null;
  return `Like ${example.name} · about ${example.capacity.toLocaleString("en-US")} people`;
}

/** One entry per act, keeping its first show. */
function uniqueActs(acts: QuizAct[]): QuizAct[] {
  const seen = new Map<string, QuizAct>();
  for (const act of acts) if (!seen.has(act.id)) seen.set(act.id, act);
  return [...seen.values()];
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A small deterministic random number generator (mulberry32). */
function seededRandom(seed: string): () => number {
  let state = 0;
  for (const char of seed)
    state = (Math.imul(state, 31) + char.charCodeAt(0)) | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
