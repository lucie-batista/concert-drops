/** "#12 in the US": where the show's biggest artist ranks on Last.fm. */
export function PopularBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ${
        rank <= 100 ? "bg-ink text-white" : "border-ink/25 border"
      }`}
    >
      #{rank} in the US
    </span>
  );
}
