import { cn } from "@/app/lib/utils";
import { LeagueEntry } from "@/app/types/riot";
import { TIER_COLORS } from "@/app/data/constants";
import { formatTier, formatWinrate } from "@/app/lib/format";
import RankEmblem from "./RankEmblem";

interface RankBadgeProps {
  entry: LeagueEntry | null;
  size?: "sm" | "md" | "lg";
  showLp?: boolean;
  showWinrate?: boolean;
  className?: string;
}

const TEXT = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const EMBLEM = { sm: 14, md: 18, lg: 22 };

/** Emblem + "Emerald II · 54 LP". Tier colour comes from TIER_COLORS (data). */
export default function RankBadge({
  entry,
  size = "md",
  showLp = true,
  showWinrate = false,
  className,
}: RankBadgeProps) {
  if (!entry) {
    return (
      <span className={cn("italic text-faint", TEXT[size], className)}>
        Unranked
      </span>
    );
  }

  const total = entry.wins + entry.losses;
  const winrate = total > 0 ? (entry.wins / total) * 100 : 0;

  return (
    <span className={cn("inline-flex items-center gap-1.5", TEXT[size], className)}>
      <RankEmblem tier={entry.tier} size={EMBLEM[size]} />
      <span className="font-semibold" style={{ color: TIER_COLORS[entry.tier] }}>
        {formatTier(entry.tier, entry.rank)}
      </span>
      {showLp && (
        <span className="num text-muted-foreground">{entry.leaguePoints} LP</span>
      )}
      {showWinrate && (
        <span className="num text-faint">
          · {formatWinrate(winrate)} ({total}G)
        </span>
      )}
    </span>
  );
}
