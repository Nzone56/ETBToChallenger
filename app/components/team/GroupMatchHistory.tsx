"use client";

import { useState } from "react";
import { Match } from "@/app/types/riot";
import { getParticipant, calcKda, formatKda } from "@/app/lib/helpers";
import { cn } from "@/app/lib/utils";
import { Users, ChevronDown } from "lucide-react";

const PAGE_SIZE = 10;

interface GroupMatchHistoryProps {
  groupMatches: {
    match: Match;
    players: { puuid: string; gameName: string }[];
  }[];
}

export default function GroupMatchHistory({
  groupMatches,
}: GroupMatchHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (groupMatches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
        No group matches found in recent history
      </div>
    );
  }

  const visible = groupMatches.slice(0, visibleCount);
  const hasMore = visibleCount < groupMatches.length;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        <Users className="h-4 w-4" />
        Group Matches
        <span className="text-xs font-normal text-zinc-600">
          ({groupMatches.length} matches · 2+ members together)
        </span>
      </h2>

      <div className="space-y-2 stagger-rows">
        {visible.map(({ match, players }) => {
          const allWin = players.every((pl) => {
            const p = getParticipant(match, pl.puuid);
            return p?.win;
          });
          const allLoss = players.every((pl) => {
            const p = getParticipant(match, pl.puuid);
            return p && !p.win;
          });

          const resultLabel = allWin ? "WIN" : allLoss ? "LOSS" : "MIXED";
          const duration = Math.floor(match.info.gameDuration / 60);

          return (
            <div
              key={match.metadata.matchId}
              className={cn(
                "rounded-xl border px-4 py-3 backdrop-blur-sm transition-colors",
                allWin
                  ? "border-emerald-800/40 bg-emerald-950/15 hover:bg-emerald-950/25"
                  : allLoss
                    ? "border-red-800/40 bg-red-950/15 hover:bg-red-950/25"
                    : "border-zinc-700/40 bg-zinc-900/40 hover:bg-zinc-800/40",
              )}
            >
              {/* Header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-bold",
                      allWin
                        ? "bg-emerald-500/20 text-emerald-400"
                        : allLoss
                          ? "bg-red-500/20 text-red-400"
                          : "bg-zinc-500/20 text-zinc-400",
                    )}
                  >
                    {resultLabel}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {players.length} members · {duration}m
                  </span>
                </div>
              </div>

              {/* Players in this match */}
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {players.map((pl) => {
                  const p = getParticipant(match, pl.puuid);
                  if (!p) return null;

                  const kda = calcKda(p.kills, p.deaths, p.assists);

                  return (
                    <div
                      key={pl.puuid}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          p.win ? "bg-emerald-400" : "bg-red-400",
                        )}
                      />
                      <span className="font-medium text-zinc-300">
                        {pl.gameName}
                      </span>
                      <span className="text-zinc-500">{p.championName}</span>
                      <span className="text-zinc-400">
                        {p.kills}/{p.deaths}/{p.assists}
                      </span>
                      <span className="text-zinc-600">
                        {formatKda(kda)} KDA
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="cursor-pointer mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 hover:text-white"
        >
          <ChevronDown className="h-4 w-4" />
          Load More ({groupMatches.length - visibleCount} remaining)
        </button>
      )}

      {!hasMore && groupMatches.length > PAGE_SIZE && (
        <div className="mt-4 text-center text-xs text-zinc-600">
          All group matches loaded
        </div>
      )}
    </div>
  );
}
