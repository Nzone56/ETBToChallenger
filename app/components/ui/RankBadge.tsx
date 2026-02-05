import { cn } from "@/app/lib/utils";
import { LeagueEntry } from "@/app/types/riot";
import { TIER_COLORS } from "@/app/data/constants";

interface RankBadgeProps {
  entry: LeagueEntry | null;
  size?: "sm" | "md" | "lg";
  showLp?: boolean;
  showWinrate?: boolean;
  className?: string;
}

export default function RankBadge({
  entry,
  size = "md",
  showLp = true,
  showWinrate = false,
  className,
}: RankBadgeProps) {
  if (!entry) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-zinc-500 italic">Unranked</span>
      </div>
    );
  }

  const tierColor = TIER_COLORS[entry.tier] ?? "#888";
  const total = entry.wins + entry.losses;
  const winrate = total > 0 ? ((entry.wins / total) * 100).toFixed(1) : "0";

  const sizeStyles = {
    sm: "text-xs gap-1",
    md: "text-sm gap-2",
    lg: "text-base gap-2",
  };

  const dotSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <div className={cn("flex items-center", sizeStyles[size], className)}>
      <span
        className={cn("rounded-full", dotSize[size])}
        style={{ backgroundColor: tierColor }}
      />
      <span
        className="font-semibold text-zinc-100"
        style={{ color: tierColor }}
      >
        {entry.tier} {entry.rank}
      </span>
      {showLp && <span className="text-zinc-400">{entry.leaguePoints} LP</span>}
      {showWinrate && (
        <span className="text-zinc-500">
          {winrate}% ({total}G)
        </span>
      )}
    </div>
  );
}
