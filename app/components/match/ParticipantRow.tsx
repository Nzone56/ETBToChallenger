import Link from "next/link";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import CirBadge from "@/app/components/ui/CirBadge";
import ItemsDisplay from "@/app/components/ui/ItemsDisplay";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import RoleIcon, { roleLabel } from "@/app/components/ui/RoleIcon";
import { calcKda, formatKda, formatNumber } from "@/app/lib/format";
import type { ParticipantView } from "@/app/lib/matchView";
import { playerHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";

interface ParticipantRowProps {
  p: ParticipantView;
  minutes: number;
  remake: boolean;
  version: string;
}

function Figure({ value, sub, className }: { value: string; sub: string; className?: string }) {
  return (
    <td className="px-3 py-2.5 text-right">
      <p className={cn("num text-sm font-semibold", className)}>{value}</p>
      <p className="num text-[11px] text-faint">{sub}</p>
    </td>
  );
}

/** One of the ten players in a match. Roster players are marked and linked. */
export default function ParticipantRow({ p, minutes, remake, version }: ParticipantRowProps) {
  const kda = calcKda(p.kills, p.deaths, p.assists);
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const per = (v: number) => (minutes > 0 ? v / minutes : 0);

  return (
    <tr className={cn("border-t border-border transition-colors hover:bg-muted", p.isChallengePlayer && "bg-accent/5")}>
      <td className="relative py-2.5 pl-5 pr-3">
        {p.isChallengePlayer && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-accent" />}
        <div className="flex items-center gap-3">
          <ChampionIcon championName={p.championName} version={version} size={36} />
          <div className="min-w-0">
            {p.isChallengePlayer ? (
              <Link
                href={playerHref(p.riotIdGameName)}
                className="block truncate text-sm font-semibold text-accent hover:underline"
              >
                {p.riotIdGameName}
              </Link>
            ) : (
              <span className="block truncate text-sm font-medium text-muted-foreground">{p.riotIdGameName}</span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-faint">
              <RoleIcon position={p.teamPosition} className="size-3" />
              {p.championName} · {roleLabel(p.teamPosition)}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <KdaDisplay kills={p.kills} deaths={p.deaths} assists={p.assists} size="sm" />
        <p className={cn("num text-[11px]", kda >= 4 ? "text-win" : kda < 2 ? "text-loss" : "text-faint")}>
          {formatKda(kda)} KDA
        </p>
      </td>
      <Figure value={formatNumber(p.totalDamageDealtToChampions)} sub={`${formatNumber(per(p.totalDamageDealtToChampions))}/m`} />
      <Figure value={formatNumber(p.goldEarned)} sub={`${formatNumber(per(p.goldEarned))}/m`} />
      <Figure value={cs.toString()} sub={`${per(cs).toFixed(1)}/m`} />
      <Figure value={p.visionScore.toString()} sub={`${per(p.visionScore).toFixed(1)}/m`} />
      <td className="px-3 py-2.5">
        <div className="flex justify-center">{remake ? <span className="text-faint">—</span> : <CirBadge score={p.cir} />}</div>
      </td>
      <td className="py-2.5 pl-3 pr-5">
        <ItemsDisplay participant={p} version={version} size="sm" />
      </td>
    </tr>
  );
}
