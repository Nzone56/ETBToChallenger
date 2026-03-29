"use client";

import Link from "next/link";
import { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "../ui/ChampionIcon";
import { DELTA_LEADERBOARDS } from "./DeltaConfig";
import { formatColombianDateShort } from "@/app/lib/dateUtils";

interface DeltaLeaderboardCardProps {
  record: MatchRecord;
  rank: number;
  version: string;
  type: "titan" | "anchor" | "king" | "gap";
}

export function DeltaLeaderboardCard({
  record,
  rank,
  version,
  type,
}: DeltaLeaderboardCardProps) {
  const delta = record.value;
  const isPositive = delta > 0;
  const config = DELTA_LEADERBOARDS[type];
  const theme = config.theme;
  const Icon = config.icon;
  const isLaneComparison = type === "king" || type === "gap";
  const contextLabel = isLaneComparison ? "Opponent" : "Team Avg";

  const matchDate = formatColombianDateShort(record.playedAt);

  return (
    <Link
      href={`/match/${record.matchId}`}
      className={`group relative block cursor-pointer overflow-hidden rounded-lg border bg-linear-to-br ${theme.gradient} ${theme.border} ${theme.glow} p-3 transition-all duration-300 hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        {/* Rank Badge - Inline */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.rankBg} ${theme.rankText} text-sm font-bold shadow-md`}
        >
          {rank}
        </div>

        {/* Champion Icon */}
        <div className="relative shrink-0">
          <ChampionIcon
            championName={record.championName}
            version={version}
            size={48}
            className="rounded-lg ring-2 ring-zinc-700/50"
          />
          <div
            className={`absolute -bottom-1 -right-1 rounded-full ${theme.rankBg} p-0.5 shadow-md`}
          >
            <Icon className={`h-3 w-3 ${theme.iconColor}`} />
          </div>
        </div>

        {/* Main Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Player Name & KDA */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-bold text-zinc-100">
              {record.gameName}
            </p>
            <span className="shrink-0 text-xs text-zinc-400">
              {record.kills}/{record.deaths}/{record.assists}
            </span>
          </div>

          {/* CIR Comparison - Compact */}
          {record.contextValue !== undefined &&
            record.playerCIR !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-bold tabular-nums ${theme.deltaColor}`}>
                  {record.playerCIR.toFixed(1)}
                </span>
                <span className="text-zinc-600">→</span>
                <span className="font-bold tabular-nums text-zinc-400">
                  {record.contextValue.toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {isLaneComparison && record.opponentChampionName
                    ? `vs ${record.opponentChampionName}`
                    : contextLabel}
                </span>
              </div>
            )}

          {/* Match Info */}
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className={record.win ? "text-green-400" : "text-red-400"}>
              {record.win ? "Win" : "Loss"}
            </span>
            <span className="text-zinc-600">•</span>
            <span>{matchDate}</span>
          </div>
        </div>

        {/* Delta Value - Right Side */}
        <div className="shrink-0 text-right">
          <p
            className={`text-xl font-bold tabular-nums leading-none ${theme.deltaColor}`}
          >
            {isPositive ? "+" : ""}
            {delta.toFixed(1)}
          </p>
        </div>
      </div>
    </Link>
  );
}
