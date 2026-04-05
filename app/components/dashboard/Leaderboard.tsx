"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlayerRankedData,
  PlayerAggregatedStats,
  Position,
} from "@/app/types/riot";
import { rankToLp } from "@/app/data/constants";
import { POSITION_LABELS } from "@/app/data/constants";
import RankBadge from "@/app/components/ui/RankBadge";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { cn } from "@/app/lib/utils";
import { Trophy, Flame, Users } from "lucide-react";
import { formatWinrate } from "@/app/lib/helpers";
import { PlayerStackStats } from "@/app/lib/db";

interface LeaderboardProps {
  players: (PlayerRankedData & {
    stats: PlayerAggregatedStats;
  })[];
  stackStats: PlayerStackStats[];
  version: string;
}

type RoleFilter = "Overall" | Position;
type StackFilter = "All" | "Solo" | "Duo" | "Trio" | "Penta";

const ROLE_FILTERS: RoleFilter[] = [
  "Overall",
  "TOP",
  "JUNGLE",
  "MIDDLE",
  "BOTTOM",
  "UTILITY",
];

const STACK_FILTERS: StackFilter[] = ["All", "Solo", "Duo", "Trio", "Penta"];

export default function Leaderboard({
  players,
  stackStats,
  version,
}: LeaderboardProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Overall");
  const [stackFilter, setStackFilter] = useState<StackFilter>("All");

  // Create stack stats map for quick lookup
  const stackStatsMap = new Map(stackStats.map((s) => [s.puuid, s]));

  // When stack filter changes, reset role filter to Overall
  const handleStackFilterChange = (newStackFilter: StackFilter) => {
    setStackFilter(newStackFilter);
    if (newStackFilter !== "All") {
      setRoleFilter("Overall");
    }
  };

  // When role filter changes, reset stack filter to All
  const handleRoleFilterChange = (newRoleFilter: RoleFilter) => {
    setRoleFilter(newRoleFilter);
    if (newRoleFilter !== "Overall") {
      setStackFilter("All");
    }
  };

  // Filter and sort players based on selected filters
  const filteredPlayers = players
    .map((player) => {
      // Start with base stats
      let wins = player.stats.wins;
      let totalGames = player.stats.totalGames;
      let winrate = player.stats.winrate;

      const hasRoleFilter = roleFilter !== "Overall";
      const hasStackFilter = stackFilter !== "All";

      if (hasRoleFilter) {
        // Only role filter active
        const roleStat = player.stats.roleStats.find(
          (r) => r.position === roleFilter,
        );
        if (!roleStat || roleStat.games === 0) {
          return null;
        }
        wins = roleStat.wins;
        totalGames = roleStat.games;
        winrate = roleStat.winrate;
      } else if (hasStackFilter) {
        // Only stack filter active
        const stackStat = stackStatsMap.get(player.puuid);
        if (!stackStat) return null;

        if (stackFilter === "Solo") {
          if (stackStat.soloGames === 0) return null;
          wins = stackStat.soloWins;
          totalGames = stackStat.soloGames;
        } else if (stackFilter === "Duo") {
          if (stackStat.duoGames === 0) return null;
          wins = stackStat.duoWins;
          totalGames = stackStat.duoGames;
        } else if (stackFilter === "Trio") {
          if (stackStat.trioGames === 0) return null;
          wins = stackStat.trioWins;
          totalGames = stackStat.trioGames;
        } else if (stackFilter === "Penta") {
          if (stackStat.pentaGames === 0) return null;
          wins = stackStat.pentaWins;
          totalGames = stackStat.pentaGames;
        }
        winrate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
      }

      return {
        ...player,
        displayWins: wins,
        displayTotalGames: totalGames,
        displayWinrate: winrate,
      };
    })
    .filter((p) => p !== null)
    .sort((a, b) => {
      // Sort by LP for Overall, by winrate for specific roles
      if (roleFilter === "Overall") {
        const lpA = a.flexEntry
          ? rankToLp(
              a.flexEntry.tier,
              a.flexEntry.rank,
              a.flexEntry.leaguePoints,
            )
          : 0;
        const lpB = b.flexEntry
          ? rankToLp(
              b.flexEntry.tier,
              b.flexEntry.rank,
              b.flexEntry.leaguePoints,
            )
          : 0;
        return lpB - lpA;
      } else {
        return b.displayWinrate - a.displayWinrate;
      }
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

      {/* Role Filter Tabs */}
      <div className="border-b border-zinc-800/50 px-2 py-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleFilterChange(role)}
              disabled={stackFilter !== "All" && role !== "Overall"}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                roleFilter === role
                  ? "bg-zinc-700 text-white"
                  : stackFilter !== "All" && role !== "Overall"
                    ? "text-zinc-700 cursor-not-allowed opacity-50"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer",
              )}
            >
              {role === "Overall" ? role : POSITION_LABELS[role as Position]}
            </button>
          ))}
        </div>
      </div>

      {/* Stack Filter Tabs */}
      <div className="border-b border-zinc-800/50 px-2 py-2">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <div className="flex gap-1 flex-1">
            {STACK_FILTERS.map((stack) => (
              <button
                key={stack}
                onClick={() => handleStackFilterChange(stack)}
                disabled={roleFilter !== "Overall" && stack !== "All"}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  stackFilter === stack
                    ? "bg-zinc-700 text-white"
                    : roleFilter !== "Overall" && stack !== "All"
                      ? "text-zinc-700 cursor-not-allowed opacity-50"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer",
                )}
              >
                {stack}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Player Rankings */}
      <div className="divide-y divide-zinc-800/50 stagger-rows">
        {filteredPlayers.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">
            No data for this filter combination
          </div>
        ) : (
          filteredPlayers.map((player, index) => {
            const winrate =
              player.displayTotalGames > 0
                ? formatWinrate(player.displayWinrate)
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
                  {roleFilter === "Overall" ? (
                    <RankBadge entry={player.flexEntry} size="sm" />
                  ) : (
                    <span className="text-xs text-zinc-500">
                      {player.displayTotalGames}G
                    </span>
                  )}
                </div>

                {/* Winrate */}
                <div className="text-right">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      winrate === "—"
                        ? "text-zinc-300"
                        : player.displayWinrate >= 50
                          ? "text-emerald-400"
                          : "text-red-400",
                    )}
                  >
                    {winrate}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {player.displayWins}W{" "}
                    {player.displayTotalGames - player.displayWins}L
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
