/**
 * Broad styles of music the quiz talks about. Ticketmaster has dozens of
 * genres and subgenres; these group them into choices a visitor recognizes.
 */
export const VIBES = [
  { id: "pop", label: "Pop" },
  { id: "indie", label: "Indie & alternative" },
  { id: "rock", label: "Rock & metal" },
  { id: "hiphop", label: "Hip-hop & R&B" },
  { id: "electronic", label: "Electronic & dance" },
  { id: "folk", label: "Folk & country" },
  { id: "jazz", label: "Jazz, soul & blues" },
  { id: "classical", label: "Classical & opera" },
  { id: "world", label: "Latin & world" },
] as const;

export type VibeId = (typeof VIBES)[number]["id"];

export const VIBE_IDS: ReadonlySet<string> = new Set(VIBES.map((v) => v.id));

export function vibeLabel(id: VibeId): string {
  return VIBES.find((v) => v.id === id)!.label;
}

// Subgenres are more specific, so they win: Ticketmaster files plenty of pop
// acts under "Rock" with the subgenre "Pop".
const BY_SUBGENRE: Record<string, VibeId> = {
  Pop: "pop",
  "Electro Pop": "pop",
  "Adult Contemporary": "pop",
  "K-Pop": "pop",
  Alternative: "indie",
  "Alternative Rock": "indie",
  "Indie Rock": "indie",
  "Indie Pop": "indie",
  "Indie Folk": "folk",
  Punk: "rock",
  "Hard Rock": "rock",
  "Nu-Metal": "rock",
  Trap: "hiphop",
  Soul: "jazz",
  "Jazz Blues": "jazz",
  Amapiano: "electronic",
  House: "electronic",
  Techno: "electronic",
  "Classical/Vocal": "classical",
};

const BY_GENRE: Record<string, VibeId> = {
  Pop: "pop",
  Alternative: "indie",
  Rock: "rock",
  Metal: "rock",
  "Hip-Hop/Rap": "hiphop",
  "R&B": "hiphop",
  "Dance/Electronic": "electronic",
  Folk: "folk",
  Country: "folk",
  Blues: "jazz",
  Jazz: "jazz",
  Classical: "classical",
  Opera: "classical",
  World: "world",
  Latin: "world",
  Reggae: "world",
};

/** The vibe of a show from its Ticketmaster genre, or null if it's unclear. */
export function vibeOf(
  genre: string | null,
  subgenre: string | null,
): VibeId | null {
  return (
    (subgenre ? BY_SUBGENRE[subgenre] : undefined) ??
    (genre ? BY_GENRE[genre] : undefined) ??
    null
  );
}
