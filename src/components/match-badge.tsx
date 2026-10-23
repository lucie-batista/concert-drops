import { matchLabel } from "@/lib/match/score";

/** A small "Top match" or "Strong match" tag, or nothing for weaker matches. */
export function MatchBadge({ score }: { score: number }) {
  const label = matchLabel(score);
  if (!label) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ${
        label === "Top match" ? "bg-ink text-white" : "border-ink/25 border"
      }`}
    >
      {label}
    </span>
  );
}
