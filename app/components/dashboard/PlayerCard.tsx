import Link from "next/link";
import { PlayerDashboardData } from "@/app/types/riot";
import {
  getParticipant,
  calcKda,
  formatKda,
  formatWinrate,
} from "@/app/lib/helpers";
import { POSITION_LABELS, rankToLp } from "@/app/data/constants";
import { computeCIR_v3 } from "@/app/lib/cir";
import RankBadge from "@/app/components/ui/RankBadge";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import WinrateBar from "@/app/components/ui/WinrateBar";
import { cn } from "@/app/lib/utils";
import { ChevronRight } from "lucide-react";

function cirLabel(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 20)
    return {
      label: "Legendary",
      color: "text-yellow-300",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    };
  if (score >= 15)
    return {
      label: "Dominant",
      color: "text-orange-300",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
    };
  if (score >= 11)
    return {
      label: "Great",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    };
  if (score >= 8)
    return {
      label: "Good",
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
    };
  if (score >= 5)
    return {
      label: "Average",
      color: "text-zinc-300",
      bg: "bg-zinc-500/10",
      border: "border-zinc-600/30",
    };
  if (score >= 2)
    return {
      label: "Poor",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-600/30",
    };
  return {
    label: "Awful",
    color: "text-red-600",
    bg: "bg-red-900/10",
    border: "border-red-800/30",
  };
}

function CirBadge({ score }: { score: number }) {
  const { label, color, bg, border } = cirLabel(score);
  return (
    <div
      className={cn(
        "mt-1.5 flex items-center justify-end gap-1.5 rounded-md border px-2 py-1",
        bg,
        border,
      )}
    >
      <span
        className={cn("text-sm font-bold tabular-nums leading-none", color)}
      >
        {score.toFixed(1)}
      </span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
          CIR
        </span>
        <span className={cn("text-[9px] font-semibold", color)}>{label}</span>
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: PlayerDashboardData;
  version: string;
}

export default function PlayerCard({ player, version }: PlayerCardProps) {
  const lastMatchParticipant = player.lastMatch
    ? getParticipant(player.lastMatch, player.puuid)
    : null;

  const cirScores = (() => {
    if (!lastMatchParticipant || !player.lastMatch) return null;
    const p = lastMatchParticipant;
    const match = player.lastMatch;
    const durationMin = match.info.gameDuration / 60;
    if (durationMin <= 0) return null;

    const teamKills = match.info.participants
      .filter((tp) => tp.teamId === p.teamId)
      .reduce((sum, tp) => sum + tp.kills, 0);
    const kp = teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0;

    const opponent = match.info.participants.find(
      (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
    );
    const goldLead = opponent ? p.goldEarned - opponent.goldEarned : 0;
    const dmgLead = opponent
      ? p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions
      : 0;

    const teamTotalDmg = match.info.participants
      .filter((tp) => tp.teamId === p.teamId)
      .reduce((sum, tp) => sum + tp.totalDamageDealtToChampions, 0);
    const teamDmgPct =
      teamTotalDmg > 0
        ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
        : 0;

    const maxGPM = Math.max(
      ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
    );

    const input = {
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      killParticipation: kp,
      visionPerMin: p.visionScore / durationMin,
      dmgToObjectives: p.damageDealtToObjectives ?? 0,
      firstBloodParticipation: p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
      goldPerMin: p.goldEarned / durationMin,
      csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
      goldLead,
      dmgPerMin: p.totalDamageDealtToChampions / durationMin,
      dmgToBuildings: p.damageDealtToBuildings ?? 0,
      dmgLead,
      teamDamagePercent: teamDmgPct,
      maxGameGoldPerMin: maxGPM,
    };

    const v3result = computeCIR_v3({ ...input, teamPosition: p.teamPosition });

    return {
      score: v3result.score,
      role: v3result.role,
    };
  })();

  const total = player.flexEntry
    ? player.flexEntry.wins + player.flexEntry.losses
    : 0;
  const winrate = player.flexEntry ? (player.flexEntry.wins / total) * 100 : 0;
  const lp = player.flexEntry
    ? rankToLp(
        player.flexEntry.tier,
        player.flexEntry.rank,
        player.flexEntry.leaguePoints,
      )
    : 0;

  return (
    <Link
      href={`/player/${encodeURIComponent(player.gameName)}`}
      className="group block"
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm transition-all hover:border-zinc-600 hover:bg-zinc-900/80">
        {/* Header row: icon + name + rank + stats */}
        <div className="flex items-center gap-3">
          <ProfileIcon
            iconId={player.summoner?.profileIconId}
            version={version}
            size={48}
            className="ring-2 ring-zinc-700/50"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100 group-hover:text-white truncate">
                {player.gameName}
              </h3>
              <span className="text-xs text-zinc-600">#{player.tagLine}</span>
              <ChevronRight className="ml-auto h-4 w-4 text-zinc-700 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <RankBadge entry={player.flexEntry} size="sm" />
              {player.flexEntry && (
                <span className="text-xs text-zinc-500">{lp} LP</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        {player.flexEntry && (
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <WinrateBar
                wins={player.flexEntry.wins}
                losses={player.flexEntry.losses}
              />
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-zinc-200">
                {formatWinrate(winrate)}
              </div>
              <div className="text-xs text-zinc-500">
                {player.flexEntry.wins}W {player.flexEntry.losses}L
              </div>
            </div>
          </div>
        )}

        {/* Last Match */}
        {lastMatchParticipant && player.lastMatch && (
          <div
            className={cn(
              "mt-3 flex items-center gap-3 rounded-lg border px-3 py-2",
              lastMatchParticipant.win
                ? "border-emerald-800/50 bg-emerald-950/20"
                : "border-red-800/50 bg-red-950/20",
            )}
          >
            <ChampionIcon
              championName={lastMatchParticipant.championName}
              version={version}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold",
                    lastMatchParticipant.win
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {lastMatchParticipant.win ? "WIN" : "LOSS"}
                </span>
                <span className="text-xs text-zinc-400">
                  {lastMatchParticipant.championName}
                </span>
                <span className="text-xs text-zinc-600">
                  {POSITION_LABELS[
                    lastMatchParticipant.teamPosition as keyof typeof POSITION_LABELS
                  ] ?? lastMatchParticipant.teamPosition}
                </span>
              </div>
              <KdaDisplay
                kills={lastMatchParticipant.kills}
                deaths={lastMatchParticipant.deaths}
                assists={lastMatchParticipant.assists}
                size="sm"
              />
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-300">
                {formatKda(
                  calcKda(
                    lastMatchParticipant.kills,
                    lastMatchParticipant.deaths,
                    lastMatchParticipant.assists,
                  ),
                )}{" "}
                KDA
              </div>
              <div className="text-xs text-zinc-600">
                {Math.floor(player.lastMatch.info.gameDuration / 60)}m
              </div>
              {cirScores && <CirBadge score={cirScores.score} />}
            </div>
          </div>
        )}

        {!lastMatchParticipant && (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-600 italic">
            No recent flex match
          </div>
        )}
      </div>
    </Link>
  );
}
