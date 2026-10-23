export type AffinitySignal = { source: string; rank: number | null };

/** Most points each Spotify list can add. Recent listening counts most. */
const WEIGHTS: Record<string, number> = {
  top_short_term: 35, // about the last 4 weeks
  top_medium_term: 35, // about the last 6 months
  top_long_term: 20, // about the last year
  followed: 10,
};

/** Top lists go 50 deep, so #1 earns full points and #50 earns 1/50. */
const LIST_LENGTH = 50;

/**
 * How much I like an artist, 0–100, from where they rank in my Spotify top
 * lists and whether I follow them.
 */
export function affinityScore(signals: AffinitySignal[]): number {
  let score = 0;
  for (const { source, rank } of signals) {
    const weight = WEIGHTS[source] ?? 0;
    if (source === "followed") {
      score += weight;
    } else if (rank !== null && rank >= 1 && rank <= LIST_LENGTH) {
      score += (weight * (LIST_LENGTH + 1 - rank)) / LIST_LENGTH;
    }
  }
  return Math.round(Math.min(score, 100));
}

export type MatchLabel = "Top match" | "Strong match";

/** A label for the card, or null when the score is too low to call out. */
export function matchLabel(score: number): MatchLabel | null {
  if (score >= 60) return "Top match";
  if (score >= 30) return "Strong match";
  return null;
}

/** A show is as good a match as its best artist. */
export function showScore(artists: { score: number }[]): number {
  return Math.max(0, ...artists.map((a) => a.score));
}
