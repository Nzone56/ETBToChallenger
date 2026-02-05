"use client";

import { useState } from "react";
import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import Link from "next/link";

type SortKey = "winrate" | "kda" | "damage";

interface InternalRankingsProps {
  players: {
    gameName: string;
    profileIconId: number | null;
    stats: PlayerAggregatedStats;
  }[];
  version: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "winrate", label: "Winrate" },
  { key: "kda", label: "KDA" },
  { key: "damage", label: "Avg Damage" },
];

export default function InternalRankings({
  players,
  version,
}: InternalRankingsProps) {
  const [sortBy, setSortBy] = useState<SortKey>("winrate");

  const sorted = [...players].sort((a, b) => {
    switch (sortBy) {
      case "winrate":
        return b.stats.winrate - a.stats.winrate;
      case "kda":
        return b.stats.avgKda - a.stats.avgKda;
      case "damage":
        return b.stats.avgDamage - a.stats.avgDamage;
    }
  });

  function getValue(player: { stats: PlayerAggregatedStats }): string {
    switch (sortBy) {
      case "winrate":
        return formatWinrate(player.stats.winrate);
      case "kda":
        return formatKda(player.stats.avgKda);
      case "damage":
        return Math.round(player.stats.avgDamage).toLocaleString();
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Internal Rankings
        </h2>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                sortBy === option.key
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden divide-y divide-zinc-800/50 stagger-rows">
        {sorted.map((player, index) => (
          <Link
            key={player.gameName}
            href={`/player/${encodeURIComponent(player.gameName)}`}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/40"
          >
            <span
              className={cn(
                "w-6 text-center text-sm font-bold",
                index === 0
                  ? "text-yellow-400"
                  : index === 1
                    ? "text-zinc-300"
                    : index === 2
                      ? "text-amber-600"
                      : "text-zinc-600",
              )}
            >
              {index + 1}
            </span>
            <ProfileIcon
              iconId={player.profileIconId}
              version={version}
              size={28}
            />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-zinc-200">
                {player.gameName}
              </span>
              <div className="text-xs text-zinc-500">
                {player.stats.totalGames} games
              </div>
            </div>
            <span className="text-sm font-semibold text-zinc-300">
              {getValue(player)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
