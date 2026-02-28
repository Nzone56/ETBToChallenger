"use client";

import { useState } from "react";
import { Match } from "@/app/types/riot";
import { getParticipant, calcKda, formatKda } from "@/app/lib/helpers";
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
import { ChevronDown, Loader2, Clock } from "lucide-react";

interface MatchHistoryListProps {
  puuid: string;
  initialMatches: Match[];
  version: string;
  pageSize?: number;
  totalGames: number;
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
        if (data.matches.length < pageSize) setHasMore(false);
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
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <Clock className="h-3.5 w-3.5 text-teal-400" />
        Recent Match History
        <span className="font-normal text-zinc-700">
          ({totalGames} total games)
        </span>
      </h2>

      <div className="space-y-2 stagger-rows">
        {matches.map((match) => {
          const p = getParticipant(match, puuid);
          if (!p) return null;

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
          const cir = computeMatchCir(match, puuid);
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
            <div
              key={match.metadata.matchId}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                p.win
                  ? "border-emerald-800/40 bg-emerald-950/15 hover:bg-emerald-950/25"
                  : "border-red-800/40 bg-red-950/15 hover:bg-red-950/25",
              )}
            >
              {/* Win/Loss bar */}
              <div
                className={cn(
                  "w-1 self-stretch rounded-full shrink-0",
                  p.win ? "bg-emerald-500" : "bg-red-500",
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

              {/* CIR badge */}
              <div
                className={cn(
                  "hidden shrink-0 rounded-lg border px-2.5 py-1 text-center sm:block w-14",
                  cirBg,
                )}
              >
                <div className={`text-xs font-bold tabular-nums ${cirColor}`}>
                  {cir.toFixed(1)}
                </div>
                <div
                  className={`text-[9px] font-medium ${cirColor} opacity-70`}
                >
                  {cirTier}
                </div>
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
