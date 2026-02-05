import Link from "next/link";
import { PlayerRankedData } from "@/app/types/riot";
import { rankToLp } from "@/app/data/constants";
import RankBadge from "@/app/components/ui/RankBadge";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { cn } from "@/app/lib/utils";
import { Trophy, Flame } from "lucide-react";

interface LeaderboardProps {
  players: PlayerRankedData[];
  version: string;
}

export default function Leaderboard({ players, version }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    const lpA = a.flexEntry
      ? rankToLp(a.flexEntry.tier, a.flexEntry.rank, a.flexEntry.leaguePoints)
      : 0;
    const lpB = b.flexEntry
      ? rankToLp(b.flexEntry.tier, b.flexEntry.rank, b.flexEntry.leaguePoints)
      : 0;
    return lpB - lpA;
  });

  const medalColors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Leaderboard
        </h2>
      </div>

      <div className="divide-y divide-zinc-800/50 stagger-rows">
        {sorted.map((player, index) => {
          const total = player.flexEntry
            ? player.flexEntry.wins + player.flexEntry.losses
            : 0;
          const winrate =
            total > 0 && player.flexEntry
              ? ((player.flexEntry.wins / total) * 100).toFixed(1)
              : "—";

          return (
            <Link
              key={player.puuid}
              href={`/player/${encodeURIComponent(player.gameName)}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/40"
            >
              {/* Rank number */}
              <span
                className={cn(
                  "w-6 text-center text-sm font-bold",
                  index < 3 ? medalColors[index] : "text-zinc-600",
                )}
              >
                {index + 1}
              </span>

              {/* Profile icon */}
              <ProfileIcon
                iconId={player.summoner?.profileIconId}
                version={version}
                size={32}
              />

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-zinc-100">
                    {player.gameName}
                  </span>
                  {player.flexEntry?.hotStreak && (
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                  )}
                </div>
                <RankBadge entry={player.flexEntry} size="sm" />
              </div>

              {/* Winrate */}
              <div className="text-right">
                <div className="text-sm font-medium text-zinc-300">
                  {winrate}%
                </div>
                <div className="text-xs text-zinc-600">{total}G</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
