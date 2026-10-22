import Link from "next/link";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import CirBadge from "@/app/components/ui/CirBadge";
import ItemsDisplay from "@/app/components/ui/ItemsDisplay";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import ResultBadge, { RESULT_STRIPE } from "@/app/components/ui/ResultBadge";
import RoleIcon, { roleLabel } from "@/app/components/ui/RoleIcon";
import { computeParticipantCir } from "@/app/lib/cir";
import { formatColombianDateShort } from "@/app/lib/dateUtils";
import {
  calcKda,
  formatDuration,
  formatKda,
  formatNumber,
  getParticipant,
  matchResult,
} from "@/app/lib/format";
import { matchHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import type { Match } from "@/app/types/riot";

interface MatchRowProps {
  match: Match;
  puuid: string;
  version: string;
}

function Cell({
  value,
  label,
  valueClassName = "text-foreground",
  className,
}: {
  value: React.ReactNode;
  label: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-16 shrink-0 text-center", className)}>
      <p className={cn("num text-sm font-semibold", valueClassName)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}

/** One game in a player's history. The whole row opens the match. */
export default function MatchRow({ match, puuid, version }: MatchRowProps) {
  const p = getParticipant(match, puuid);
  if (!p) return null;

  const { gameDuration } = match.info;
  const result = matchResult(gameDuration, p.win);
  const kda = calcKda(p.kills, p.deaths, p.assists);
  const minutes = gameDuration / 60;
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;

  return (
    <Link
      href={matchHref(match.metadata.matchId)}
      className="relative flex items-center gap-4 py-3 pl-5 pr-4 transition-colors hover:bg-muted"
    >
      <span className={cn("absolute inset-y-2 left-0 w-1 rounded-r-full", RESULT_STRIPE[result])} />

      <ChampionIcon championName={p.championName} version={version} size={44} />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{p.championName}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <RoleIcon position={p.teamPosition} />
            {roleLabel(p.teamPosition)}
          </span>
          <ResultBadge result={result} />
        </div>
        <KdaDisplay kills={p.kills} deaths={p.deaths} assists={p.assists} size="sm" />
      </div>

      <ItemsDisplay participant={p} version={version} size="sm" className="hidden lg:flex" />

      <Cell
        value={formatKda(kda)}
        label="KDA"
        valueClassName={kda >= 4 ? "text-win" : kda < 2 ? "text-loss" : undefined}
        className="hidden sm:block"
      />
      <Cell value={minutes > 0 ? (cs / minutes).toFixed(1) : "0.0"} label="CS/min" className="hidden md:block" />
      <Cell value={formatNumber(p.totalDamageDealtToChampions)} label="Damage" className="hidden xl:block w-20" />

      <div className="num w-20 shrink-0 text-right text-xs text-muted-foreground">
        <p>{formatDuration(gameDuration)}</p>
        <p className="text-faint">{formatColombianDateShort(match.info.gameStartTimestamp)}</p>
      </div>

      <div className="hidden w-16 shrink-0 justify-end sm:flex">
        {result === "remake" ? (
          <span className="text-[10px] uppercase tracking-wider text-faint">No CIR</span>
        ) : (
          <CirBadge score={computeParticipantCir(match, p).score} />
        )}
      </div>
    </Link>
  );
}
