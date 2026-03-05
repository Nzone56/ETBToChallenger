import { Match, MatchParticipant } from "@/app/types/riot";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { computeCIR_v3 } from "@/app/lib/cir";
import {
  getCirColor,
  getCirBgColor,
  getCirTierLetter,
} from "@/app/lib/cirUtils";
import { formatKda, calcKda, isRemake } from "@/app/lib/helpers";
import { POSITION_LABELS } from "@/app/data/constants";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { Flame, Crown, Eye } from "lucide-react";

interface MatchTeamTableProps {
  participants: MatchParticipant[];
  teamId: number;
  win: boolean;
  version: string;
  match: Match;
  challengePuuids: Set<string>;
}

export default function MatchTeamTable({
  participants,
  teamId,
  win,
  version,
  match,
  challengePuuids,
}: MatchTeamTableProps) {
  const dur = match.info.gameDuration / 60;

  // Calculate CIR for each participant
  const participantsWithCir = participants.map((p) => {
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

    const cirResult = computeCIR_v3({
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

    return { ...p, cir: cirResult.score };
  });

  // Sort by position (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
  const positionOrder: Record<string, number> = {
    TOP: 0,
    JUNGLE: 1,
    MIDDLE: 2,
    BOTTOM: 3,
    UTILITY: 4,
  };

  const sorted = [...participantsWithCir].sort((a, b) => {
    const orderA = positionOrder[a.teamPosition] ?? 999;
    const orderB = positionOrder[b.teamPosition] ?? 999;
    return orderA - orderB;
  });

  const team = match.info.teams.find((t) => t.teamId === teamId);
  const remake = isRemake(match.info.gameDuration);

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm overflow-hidden",
        remake
          ? "border-zinc-700/40 bg-zinc-900/20"
          : win
            ? "border-emerald-800/40 bg-emerald-950/10"
            : "border-red-800/40 bg-red-950/10",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-2 border-b",
          remake
            ? "bg-zinc-800/30 border-zinc-700/40"
            : win
              ? "bg-emerald-500/10 border-emerald-800/40"
              : "bg-red-500/10 border-red-800/40",
        )}
      >
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold",
              remake
                ? "text-zinc-500"
                : win
                  ? "text-emerald-400"
                  : "text-red-400",
            )}
          >
            {teamId === 100 ? "Blue Team" : "Red Team"} -{" "}
            {remake ? "Remake" : win ? "Victory" : "Defeat"}
          </h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-500">
            <span className="font-medium text-[11px] sm:text-xs">
              {sorted.reduce((sum, p) => sum + p.kills, 0)} /{" "}
              {sorted.reduce((sum, p) => sum + p.deaths, 0)} /{" "}
              {sorted.reduce((sum, p) => sum + p.assists, 0)}
            </span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span className="text-[11px] sm:text-xs">
              {Math.round(
                sorted.reduce(
                  (sum, p) => sum + p.totalDamageDealtToChampions,
                  0,
                ),
              ).toLocaleString()}{" "}
              DMG
            </span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <div className="flex items-center gap-2 sm:gap-3 text-zinc-700">
              <span
                className="flex items-center gap-0.5 sm:gap-1"
                title="Dragons"
              >
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
                <span className="text-[11px] sm:text-xs">
                  {team?.objectives.dragon?.kills ?? 0}
                </span>
              </span>

              <span
                className="flex items-center gap-0.5 sm:gap-1"
                title="Barons"
              >
                <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500" />
                <span className="text-[11px] sm:text-xs">
                  {team?.objectives.baron?.kills ?? 0}
                </span>
              </span>

              <span
                className="flex items-center gap-0.5 sm:gap-1"
                title="Heralds"
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-500" />
                <span className="text-[11px] sm:text-xs">
                  {team?.objectives.riftHerald?.kills ?? 0}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[200]" />
            <col className="w-[100]" />
            <col className="w-[110]" />
            <col className="w-[100]" />
            <col className="w-[90]" />
            <col className="w-[80]" />
            <col className="w-[80]" />
            <col className="min-w-[300] w-auto" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800/50 text-xs text-zinc-600">
              <th className="px-4 py-2 text-left font-medium">Player</th>
              <th className="px-3 py-2 text-center font-medium">KDA</th>
              <th className="px-3 py-2 text-center font-medium">Damage</th>
              <th className="px-3 py-2 text-center font-medium">Gold</th>
              <th className="px-3 py-2 text-center font-medium">CS</th>
              <th className="px-3 py-2 text-center font-medium">Vision</th>
              <th className="px-3 py-2 text-center font-medium">CIR</th>
              <th className="px-4 py-2 text-center font-medium">Items</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const kda = calcKda(p.kills, p.deaths, p.assists);
              const kdaColor =
                kda >= 4
                  ? "text-emerald-400"
                  : kda >= 2.5
                    ? "text-zinc-300"
                    : "text-red-400";
              const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
              const csPerMin = (cs / dur).toFixed(1);
              const roleLabel =
                POSITION_LABELS[
                  p.teamPosition as keyof typeof POSITION_LABELS
                ] ?? p.teamPosition;
              const cirColor = getCirColor(p.cir);
              const cirBg = getCirBgColor(p.cir);
              const cirTier = getCirTierLetter(p.cir);

              // Items 0-5 are regular items, item6 is trinket
              const regularItems = [
                p.item0,
                p.item1,
                p.item2,
                p.item3,
                p.item4,
                p.item5,
              ];
              const trinket = p.item6;

              const isChallengePlayer = challengePuuids.has(p.puuid);

              return (
                <tr
                  key={p.puuid}
                  className={cn(
                    "border-b border-zinc-800/30 transition-colors",
                    isChallengePlayer
                      ? "bg-teal-950/10 hover:bg-teal-950/20"
                      : "hover:bg-zinc-800/20",
                  )}
                >
                  {/* Player */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ChampionIcon
                          championName={p.championName}
                          version={version}
                          size={40}
                        />
                        {isChallengePlayer && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500 ring-2 ring-zinc-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {isChallengePlayer ? (
                          <Link
                            href={`/player/${p.riotIdGameName}`}
                            className="text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors truncate block cursor-pointer"
                          >
                            {p.riotIdGameName}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-zinc-400 truncate block">
                            {p.riotIdGameName}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-zinc-600">
                            {p.championName}
                          </span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] text-zinc-600">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="px-3 py-3 text-center">
                    <div className="text-xs text-zinc-400">
                      {p.kills} / {p.deaths} / {p.assists}
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${kdaColor}`}
                    >
                      {formatKda(kda)}
                    </div>
                  </td>

                  {/* Damage */}
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm font-semibold tabular-nums text-orange-400">
                      {Math.round(
                        p.totalDamageDealtToChampions,
                      ).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {Math.round(
                        p.totalDamageDealtToChampions / dur,
                      ).toLocaleString()}
                      /min
                    </div>
                  </td>

                  {/* Gold */}
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm font-semibold tabular-nums text-yellow-400">
                      {Math.round(p.goldEarned).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {Math.round(p.goldEarned / dur).toLocaleString()}/min
                    </div>
                  </td>

                  {/* CS */}
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm font-semibold tabular-nums text-zinc-300">
                      {cs}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {csPerMin}/min
                    </div>
                  </td>

                  {/* Vision */}
                  <td className="px-3 py-3 text-center">
                    <div className="text-sm font-semibold tabular-nums text-purple-400">
                      {p.visionScore}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {(p.visionScore / dur).toFixed(1)}/min
                    </div>
                  </td>

                  {/* CIR */}
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <div
                        className={cn(
                          "rounded-lg border px-2 py-1 text-center w-[40]",
                          cirBg,
                        )}
                      >
                        <div
                          className={`text-xs font-bold tabular-nums ${cirColor}`}
                        >
                          {p.cir.toFixed(1)}
                        </div>
                        <div
                          className={`text-[9px] font-medium ${cirColor} opacity-70`}
                        >
                          {cirTier}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {/* Regular items (always 6 slots) */}
                      {regularItems.map((itemId, i) => (
                        <div
                          key={i}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded border border-zinc-700 bg-zinc-800/50 overflow-hidden shrink-0"
                        >
                          {itemId > 0 && (
                            <img
                              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`}
                              alt={`Item ${itemId}`}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                      ))}
                      {/* Trinket (item6) */}
                      {trinket > 0 && (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded border border-amber-600/50 bg-amber-900/20 overflow-hidden shrink-0">
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${trinket}.png`}
                            alt={`Trinket ${trinket}`}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
