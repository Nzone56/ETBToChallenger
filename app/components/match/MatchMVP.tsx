import { Crown } from "lucide-react";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import CirBadge from "@/app/components/ui/CirBadge";
import StatTile from "@/app/components/ui/StatTile";
import { calcKda, formatCompact, formatKda } from "@/app/lib/format";
import type { ParticipantView } from "@/app/lib/matchView";

/** The highest CIR in the game, from either team. */
export default function MatchMVP({ mvp, version }: { mvp: ParticipantView; version: string }) {
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-xl border border-primary/30 bg-linear-to-r from-primary/10 via-card to-card px-5 py-4">
      <div className="flex items-center gap-2 text-primary">
        <Crown className="size-5" />
        <span className="font-display text-sm font-semibold uppercase tracking-wider">MVP</span>
      </div>
      <ChampionIcon championName={mvp.championName} version={version} size={48} className="ring-primary/50" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl font-semibold">{mvp.riotIdGameName}</p>
        <p className="text-sm text-muted-foreground">
          {mvp.championName} · {mvp.win ? "Victory" : "Defeat"}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <StatTile variant="plain" size="sm" label="KDA" value={formatKda(calcKda(mvp.kills, mvp.deaths, mvp.assists))} sub={`${mvp.kills}/${mvp.deaths}/${mvp.assists}`} />
        <StatTile variant="plain" size="sm" label="Damage" value={formatCompact(mvp.totalDamageDealtToChampions)} />
        <StatTile variant="plain" size="sm" label="Gold" value={formatCompact(mvp.goldEarned)} />
        <CirBadge score={mvp.cir} detail="label" size="md" />
      </div>
    </section>
  );
}
