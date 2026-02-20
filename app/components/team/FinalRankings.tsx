"use client";

import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { Trophy } from "lucide-react";
import { type PlayerData, SORT_OPTIONS, computeRanks } from "./rankingUtils";

interface FinalRankingsProps {
  players: PlayerData[];
  version: string;
}

const RANK_COLOR = [
  "text-yellow-400",
  "text-zinc-300",
  "text-amber-600",
  "text-zinc-500",
  "text-zinc-500",
  "text-zinc-600",
  "text-zinc-600",
];

export default function FinalRankings({
  players,
  version,
}: FinalRankingsProps) {
  const allRanks = computeRanks(players);
  const total = SORT_OPTIONS.length;

  const finalScores = players
    .map((player) => {
      const playerRanks = allRanks.get(player.gameName)!;
      const sum = SORT_OPTIONS.reduce(
        (acc, opt) => acc + (playerRanks[opt.key] ?? players.length),
        0,
      );
      const avg = sum / total;

      const sorted = [...SORT_OPTIONS].sort(
        (a, b) =>
          (playerRanks[a.key] ?? players.length) -
          (playerRanks[b.key] ?? players.length),
      );
      const best = sorted.slice(0, 3).map((o) => o.label);
      const worst = sorted
        .slice(-3)
        .reverse()
        .map((o) => o.label);

      return { player, avg, best, worst };
    })
    .sort((a, b) => {
      if (a.avg !== b.avg) return a.avg - b.avg;
      return b.player.stats.totalGames - a.player.stats.totalGames;
    });

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        <Trophy className="h-4 w-4 text-yellow-400" />
        Final Rankings
        <span className="text-xs font-normal text-zinc-600">
          avg position across {total} categories · lower = better
        </span>
      </h2>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/50 overflow-hidden">
        {finalScores.map(({ player, avg, best, worst }, index) => (
          <div
            key={player.gameName}
            className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
          >
            {/* Position number */}
            <span
              className={cn(
                "w-6 text-center text-sm font-bold tabular-nums shrink-0",
                RANK_COLOR[index] ?? "text-zinc-700",
              )}
            >
              {index + 1}
            </span>

            {/* Avatar */}
            <ProfileIcon
              iconId={player.profileIconId}
              version={version}
              size={28}
            />

            {/* Name + games */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-zinc-200 truncate">
                {player.gameName}
              </div>
              <div className="text-xs text-zinc-500">
                {player.stats.totalGames} games
              </div>
            </div>

            {/* Best / worst — hidden on small screens */}
            <div className="hidden sm:flex flex-col gap-0.5 text-[10px] text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="text-zinc-600">Best</span>
                {best.map((l) => (
                  <span key={l} className="text-emerald-500 font-medium">
                    {l}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-zinc-600">Worst</span>
                {worst.map((l) => (
                  <span key={l} className="text-red-500 font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Avg score */}
            <div className="text-right shrink-0">
              <div
                className={cn(
                  "text-base font-bold tabular-nums",
                  RANK_COLOR[index] ?? "text-zinc-600",
                )}
              >
                {avg.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-600">avg rank</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
