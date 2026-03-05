"use client";

import { useState, useEffect } from "react";
import { Match } from "@/app/types/riot";
import {
  getParticipant,
  calcKda,
  formatKda,
  isRemake,
} from "@/app/lib/helpers";
import { computeCIR_v3 } from "@/app/lib/cir";
import {
  getCirColor,
  getCirTierLetter,
  getCirBgColor,
} from "@/app/lib/cirUtils";
import { POSITION_LABELS } from "@/app/data/constants";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import { cn } from "@/app/lib/utils";
import {
  ChevronDown,
  Loader2,
  Clock,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";

export interface MatchCompanion {
  puuid: string;
  gameName: string;
}

type ResultFilter = "all" | "win" | "loss" | "remake";

interface MatchHistoryListProps {
  puuid: string;
  initialMatches: Match[];
  version: string;
  pageSize?: number;
  totalGames: number;
  companions?: MatchCompanion[];
}

function computeMatchCir(match: Match, puuid: string): number {
  const p = getParticipant(match, puuid);
  if (!p) return 0;
  const dur = match.info.gameDuration / 60;
  if (dur <= 0) return 0;

  const teamKills = match.info.participants
    .filter((tp) => tp.teamId === p.teamId)
    .reduce((s, tp) => s + tp.kills, 0);
  const teamTotalDmg = match.info.participants
    .filter((tp) => tp.teamId === p.teamId)
    .reduce((s, tp) => s + tp.totalDamageDealtToChampions, 0);
  const maxGPM = Math.max(
    ...match.info.participants.map((pt) => pt.goldEarned / dur),
  );
  const opponent = match.info.participants.find(
    (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
  );

  const result = computeCIR_v3({
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    killParticipation:
      teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0,
    visionPerMin: p.visionScore / dur,
    dmgToObjectives: p.damageDealtToObjectives ?? 0,
    firstBloodParticipation: p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
    goldPerMin: p.goldEarned / dur,
    csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / dur,
    goldLead: opponent ? p.goldEarned - opponent.goldEarned : 0,
    dmgPerMin: p.totalDamageDealtToChampions / dur,
    dmgToBuildings: p.damageDealtToBuildings ?? 0,
    dmgLead: opponent
      ? p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions
      : 0,
    teamDamagePercent:
      teamTotalDmg > 0
        ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
        : 0,
    maxGameGoldPerMin: maxGPM,
    teamPosition: p.teamPosition,
  });
  return result.score;
}

export default function MatchHistoryList({
  puuid,
  initialMatches,
  version,
  pageSize = 10,
  totalGames,
  companions = [],
}: MatchHistoryListProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [champFilter, setChampFilter] = useState("");
  const [companionFilter, setCompanionFilter] = useState<string[]>([]);
  const [totalFiltered, setTotalFiltered] = useState<number | null>(null);

  const hasActiveFilters =
    resultFilter !== "all" || champFilter !== "" || companionFilter.length > 0;

  // All champions the player has used this season (fetched from player stats)
  const [champOptions, setChampOptions] = useState<string[]>([]);

  // Fetch all champions on mount
  useEffect(() => {
    async function fetchChampions() {
      try {
        const res = await fetch(`/api/player-champions?puuid=${puuid}`);
        const data = await res.json();
        if (data.champions) {
          setChampOptions(data.champions);
        }
      } catch (error) {
        console.error("Failed to fetch champion list:", error);
      }
    }
    fetchChampions();
  }, [puuid]);

  function toggleCompanion(companionPuuid: string) {
    setCompanionFilter((prev) =>
      prev.includes(companionPuuid)
        ? prev.filter((x) => x !== companionPuuid)
        : [...prev, companionPuuid],
    );
  }

  function clearFilters() {
    setResultFilter("all");
    setChampFilter("");
    setCompanionFilter([]);
  }

  // Build query params with filters
  function buildQueryParams(start: number, count: number): string {
    const params = new URLSearchParams({
      puuid,
      start: start.toString(),
      count: count.toString(),
    });
    if (resultFilter !== "all") params.set("result", resultFilter);
    if (champFilter) params.set("champion", champFilter);
    if (companionFilter.length > 0)
      params.set("companions", companionFilter.join(","));
    return params.toString();
  }

  // Refetch when filters change
  useEffect(() => {
    async function refetch() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/matches?${buildQueryParams(0, pageSize)}`,
        );
        const data = await res.json();
        if (data.matches) {
          setMatches(data.matches);
          setTotalFiltered(data.totalFiltered ?? null);
          setHasMore(
            data.matches.length >= pageSize &&
              data.matches.length < (data.totalFiltered ?? totalGames),
          );
        }
      } catch (error) {
        console.error("Failed to fetch filtered matches:", error);
      } finally {
        setLoading(false);
      }
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultFilter, champFilter, companionFilter]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/matches?${buildQueryParams(matches.length, pageSize)}`,
      );
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setMatches((prev) => [...prev, ...data.matches]);
        setTotalFiltered(data.totalFiltered ?? null);
        if (
          data.matches.length < pageSize ||
          matches.length + data.matches.length >=
            (data.totalFiltered ?? totalGames)
        ) {
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

  const RESULT_OPTS: { key: ResultFilter; label: string; color: string }[] = [
    {
      key: "all",
      label: "All",
      color: "border-zinc-700 text-zinc-400 hover:border-zinc-500",
    },
    {
      key: "win",
      label: "Win",
      color: "border-emerald-700/60 text-emerald-400 hover:border-emerald-500",
    },
    {
      key: "loss",
      label: "Loss",
      color: "border-red-700/60 text-red-400 hover:border-red-500",
    },
    {
      key: "remake",
      label: "Remake",
      color: "border-zinc-600/60 text-zinc-500 hover:border-zinc-400",
    },
  ];

  return (
    <div>
      {/* Header row */}
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-teal-400" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Recent Match History
        </h2>
        <span className="font-normal text-zinc-700 text-xs">
          ({totalGames} total)
        </span>
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="cursor-pointer flex items-center gap-1 rounded-md border border-zinc-700/60 bg-zinc-800/60 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "cursor-pointer flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              showFilters || hasActiveFilters
                ? "border-teal-600/60 bg-teal-500/10 text-teal-400"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {hasActiveFilters && (
              <span className="ml-0.5 rounded-full bg-teal-500/20 px-1.5 text-[10px] text-teal-300">
                {(resultFilter !== "all" ? 1 : 0) +
                  (champFilter ? 1 : 0) +
                  companionFilter.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-3 animate-slide-down relative">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-900/80 backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
            </div>
          )}
          {/* Result filter */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Result
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {RESULT_OPTS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setResultFilter(key)}
                  className={cn(
                    "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                    resultFilter === key
                      ? key === "win"
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                        : key === "loss"
                          ? "border-red-500/60 bg-red-500/15 text-red-300"
                          : key === "remake"
                            ? "border-zinc-500/60 bg-zinc-700/40 text-zinc-300"
                            : "border-teal-500/60 bg-teal-500/15 text-teal-300"
                      : color,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Champion filter */}
          {champOptions.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Champion
              </p>
              <div className="flex gap-1 flex-wrap">
                {champOptions.map((champ) => (
                  <button
                    key={champ}
                    onClick={() =>
                      setChampFilter(champFilter === champ ? "" : champ)
                    }
                    className={cn(
                      "cursor-pointer flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium transition-colors",
                      champFilter === champ
                        ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                        : "border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
                    )}
                  >
                    <ChampionIcon
                      championName={champ}
                      version={version}
                      size={16}
                      className="rounded"
                    />
                    {champ}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Companion filter */}
          {companions.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Played with
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {companions.map((c) => (
                  <button
                    key={c.puuid}
                    onClick={() => toggleCompanion(c.puuid)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                      companionFilter.includes(c.puuid)
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                        : "border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
                    )}
                  >
                    {c.gameName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-teal-700/40 bg-teal-950/20 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-500">
            Active:
          </span>
          {resultFilter !== "all" && (
            <span className="rounded-md border border-teal-600/60 bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-300">
              {resultFilter === "win"
                ? "Wins"
                : resultFilter === "loss"
                  ? "Losses"
                  : "Remakes"}
            </span>
          )}
          {champFilter && (
            <span className="flex items-center gap-1 rounded-md border border-violet-600/60 bg-violet-500/10 px-1.5 py-0.5 text-xs font-medium text-violet-300">
              <ChampionIcon
                championName={champFilter}
                version={version}
                size={14}
                className="rounded"
              />
              {champFilter}
            </span>
          )}
          {companionFilter.map((cp) => {
            const companion = companions.find((c) => c.puuid === cp);
            return companion ? (
              <span
                key={cp}
                className="rounded-md border border-amber-600/60 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300"
              >
                with {companion.gameName}
              </span>
            ) : null;
          })}
          <span className="ml-auto text-xs text-zinc-500">
            {totalFiltered !== null
              ? `${totalFiltered} matches`
              : `${matches.length} loaded`}
          </span>
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        </div>
      ) : (
        <div className="space-y-2 stagger-rows">
          {matches.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
              No matches found
              {hasActiveFilters ? " for the selected filters" : ""}.
            </div>
          )}
          {matches.map((match) => {
            const p = getParticipant(match, puuid);
            if (!p) return null;

            const remake = isRemake(match.info.gameDuration);
            const kda = calcKda(p.kills, p.deaths, p.assists);
            const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
            const durationMin = Math.floor(match.info.gameDuration / 60);
            const csPerMin =
              match.info.gameDuration > 0
                ? (cs / (match.info.gameDuration / 60)).toFixed(1)
                : "0.0";
            const durationSec = match.info.gameDuration % 60;
            const roleLabel =
              POSITION_LABELS[p.teamPosition as keyof typeof POSITION_LABELS] ??
              p.teamPosition;
            const dmg = Math.round(
              p.totalDamageDealtToChampions,
            ).toLocaleString();
            const cir = remake ? 0 : computeMatchCir(match, puuid);
            const cirColor = getCirColor(cir);
            const cirTier = getCirTierLetter(cir);
            const cirBg = getCirBgColor(cir);
            const kdaColor =
              kda >= 4
                ? "text-emerald-400"
                : kda >= 2.5
                  ? "text-zinc-300"
                  : "text-red-400";

            return (
              <Link
                key={match.metadata.matchId}
                href={`/match/${match.metadata.matchId}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors cursor-pointer",
                  remake
                    ? "border-zinc-700/40 bg-zinc-900/30 hover:bg-zinc-900/50"
                    : p.win
                      ? "border-emerald-800/40 bg-emerald-950/15 hover:bg-emerald-950/25"
                      : "border-red-800/40 bg-red-950/15 hover:bg-red-950/25",
                )}
              >
                {/* Win/Loss/Remake bar */}
                <div
                  className={cn(
                    "w-1 self-stretch rounded-full shrink-0",
                    remake
                      ? "bg-zinc-600"
                      : p.win
                        ? "bg-emerald-500"
                        : "bg-red-500",
                  )}
                />

                {/* Champion icon */}
                <ChampionIcon
                  championName={p.championName}
                  version={version}
                  size={40}
                />

                {/* Champion + role + KDA */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200 truncate">
                      {p.championName}
                    </span>
                    <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {roleLabel.toUpperCase()}
                    </span>
                    {remake && (
                      <span className="shrink-0 rounded bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 uppercase">
                        Remake
                      </span>
                    )}
                  </div>
                  <KdaDisplay
                    kills={p.kills}
                    deaths={p.deaths}
                    assists={p.assists}
                    size="sm"
                  />
                </div>

                {/* KDA ratio */}
                <div className="hidden text-center sm:block w-16 shrink-0">
                  <div className={`text-sm font-bold tabular-nums ${kdaColor}`}>
                    {formatKda(kda)}
                  </div>
                  <div className="text-[10px] text-zinc-600">KDA</div>
                </div>

                {/* CS/min */}
                <div className="hidden text-center lg:block w-16 shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-zinc-300">
                    {csPerMin}
                  </div>
                  <div className="text-[10px] text-zinc-600">CS/min</div>
                </div>

                {/* Damage */}
                <div className="hidden text-center xl:block w-20 shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-orange-400">
                    {dmg}
                  </div>
                  <div className="text-[10px] text-zinc-600">DMG</div>
                </div>

                {/* Duration */}
                <div className="hidden text-center sm:block w-14 shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-zinc-400">
                    {durationMin}:{String(durationSec).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-zinc-600">TIME</div>
                </div>

                {/* CIR badge / Remake badge */}
                {remake ? (
                  <div className="hidden shrink-0 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-2.5 py-1 text-center sm:block w-14">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase">
                      Remake
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "hidden shrink-0 rounded-lg border px-2.5 py-1 text-center sm:block w-14",
                      cirBg,
                    )}
                  >
                    <div
                      className={`text-xs font-bold tabular-nums ${cirColor}`}
                    >
                      {cir.toFixed(1)}
                    </div>
                    <div
                      className={`text-[9px] font-medium ${cirColor} opacity-70`}
                    >
                      {cirTier}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

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
