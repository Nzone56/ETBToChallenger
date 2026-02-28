import { Match, MatchParticipant } from "@/app/types/riot";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { computeCIR_v3 } from "@/app/lib/cir";
import { getCirColor, getCirBgColor } from "@/app/lib/cirUtils";
import { formatKda, calcKda } from "@/app/lib/helpers";
import { Trophy } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface MatchMVPProps {
  match: Match;
  allParticipants: MatchParticipant[];
  version: string;
}

export default function MatchMVP({
  match,
  allParticipants,
  version,
}: MatchMVPProps) {
  const dur = match.info.gameDuration / 60;

  // Calculate CIR for each participant
  const participantsWithCir = allParticipants.map((p) => {
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

  // Find MVP (highest CIR)
  const mvp = participantsWithCir.reduce((max, p) =>
    p.cir > max.cir ? p : max,
  );

  const kda = calcKda(mvp.kills, mvp.deaths, mvp.assists);
  const cirColor = getCirColor(mvp.cir);
  const cirBg = getCirBgColor(mvp.cir);

  return (
    <div className="rounded-lg border border-amber-800/40 bg-linear-to-r from-amber-950/20 to-zinc-900/60 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Trophy Icon & Label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-amber-400">
            MVP
          </span>
        </div>

        {/* Champion Icon */}
        <div className="relative shrink-0">
          <ChampionIcon
            championName={mvp.championName}
            version={version}
            size={36}
            className="rounded ring-1 ring-amber-500/50"
          />
        </div>

        {/* Player Name & Champion */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-bold text-white truncate">
            {mvp.riotIdGameName}
          </h4>
          <p className="text-[10px] sm:text-xs text-zinc-400 truncate">
            {mvp.championName} • {mvp.win ? "Victory" : "Defeat"}
          </p>
        </div>

        {/* Stats - Horizontal on desktop, wrap on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* CIR */}
          <div
            className={cn(
              "rounded border px-2 py-1 text-center min-w-[52px]",
              cirBg,
            )}
          >
            <div
              className={`text-sm sm:text-base font-bold tabular-nums ${cirColor}`}
            >
              {mvp.cir.toFixed(1)}
            </div>
            <div className="text-[8px] sm:text-[9px] font-medium text-zinc-500">
              CIR
            </div>
          </div>

          {/* KDA */}
          <div className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-center min-w-[52px]">
            <div className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
              {formatKda(kda)}
            </div>
            <div className="text-[8px] sm:text-[9px] text-zinc-500">KDA</div>
          </div>

          {/* Damage */}
          <div className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-center min-w-[52px]">
            <div className="text-sm sm:text-base font-bold text-orange-400 tabular-nums">
              {Math.round(mvp.totalDamageDealtToChampions / 1000)}k
            </div>
            <div className="text-[8px] sm:text-[9px] text-zinc-500">DMG</div>
          </div>

          {/* Gold */}
          <div className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-center min-w-[52px]">
            <div className="text-sm sm:text-base font-bold text-yellow-400 tabular-nums">
              {(mvp.goldEarned / 1000).toFixed(1)}k
            </div>
            <div className="text-[8px] sm:text-[9px] text-zinc-500">GOLD</div>
          </div>
        </div>
      </div>
    </div>
  );
}
