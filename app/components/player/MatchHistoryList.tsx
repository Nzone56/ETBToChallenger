"use client";

import { useState } from "react";
import { Match } from "@/app/types/riot";
import { getParticipant, calcKda, formatKda } from "@/app/lib/helpers";
import { POSITION_LABELS } from "@/app/data/constants";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import { cn } from "@/app/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

interface MatchHistoryListProps {
  puuid: string;
  initialMatches: Match[];
  version: string;
  pageSize?: number;
}

export default function MatchHistoryList({
  puuid,
  initialMatches,
  version,
  pageSize = 10,
}: MatchHistoryListProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialMatches.length >= pageSize);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matches?puuid=${puuid}&start=${matches.length}&count=${pageSize}`,
      );
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setMatches((prev) => [...prev, ...data.matches]);
        if (data.matches.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more matches:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Match History
        <span className="ml-2 text-xs font-normal text-zinc-600">
          ({matches.length} matches)
        </span>
      </h2>

      <div className="space-y-2 stagger-rows">
        {matches.map((match) => {
          const p = getParticipant(match, puuid);
          if (!p) return null;

          const kda = calcKda(p.kills, p.deaths, p.assists);
          const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
          const duration = Math.floor(match.info.gameDuration / 60);

          return (
            <div
              key={match.metadata.matchId}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                p.win
                  ? "border-emerald-800/40 bg-emerald-950/15 hover:bg-emerald-950/25"
                  : "border-red-800/40 bg-red-950/15 hover:bg-red-950/25",
              )}
            >
              {/* Result indicator */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  p.win
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400",
                )}
              >
                {p.win ? "W" : "L"}
              </div>

              {/* Champion */}
              <ChampionIcon
                championName={p.championName}
                version={version}
                size={36}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {p.championName}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {POSITION_LABELS[
                      p.teamPosition as keyof typeof POSITION_LABELS
                    ] ?? p.teamPosition}
                  </span>
                </div>
                <KdaDisplay
                  kills={p.kills}
                  deaths={p.deaths}
                  assists={p.assists}
                  size="sm"
                />
              </div>

              {/* KDA ratio */}
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-zinc-300">
                  {formatKda(kda)}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    KDA
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {cs} CS · {p.visionScore} VS
                </div>
              </div>

              {/* Duration */}
              <div className="text-right text-xs text-zinc-600">
                {duration}m
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="cursor-pointer mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 hover:text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Load More Matches
            </>
          )}
        </button>
      )}

      {!hasMore && matches.length > 0 && (
        <div className="mt-4 text-center text-xs text-zinc-600">
          All season matches loaded
        </div>
      )}
    </div>
  );
}
