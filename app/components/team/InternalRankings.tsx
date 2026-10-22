"use client";

import { useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankNumber from "@/app/components/ui/RankNumber";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { formatSigned } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import {
  type PlayerData,
  type SortKey,
  SORT_OPTIONS,
  STAT_MAP,
  computeRanks,
  getBestChamp,
  sortWithTieBreak,
} from "./rankingUtils";

interface InternalRankingsProps {
  players: PlayerData[];
  version: string;
}

/** A player's figure for one category — the champion category shows the icon. */
function StatValue({ player, sortKey, version }: { player: PlayerData; sortKey: SortKey; version: string }) {
  if (sortKey === "bestChampion") {
    const bc = getBestChamp(player.stats);
    if (!bc) return <>—</>;
    return (
      <span className="inline-flex items-center gap-1.5">
        <ChampionIcon championName={bc.name} version={version} size={18} className="rounded-sm" />
        {bc.name} ({formatSigned(bc.value)})
      </span>
    );
  }
  const { field, format } = STAT_MAP[sortKey];
  return <>{format(player.stats[field] as number)}</>;
}

function rankTone(rank: number, total: number) {
  if (rank === 1) return "text-medal-gold";
  if (rank === 2) return "text-medal-silver";
  if (rank === 3) return "text-medal-bronze";
  if (rank >= total - 1) return "text-loss";
  return "text-muted-foreground";
}

/** Rank the roster by any one stat; expand a row to see every rank at once. */
export default function InternalRankings({ players, version }: InternalRankingsProps) {
  const [sortBy, setSortBy] = useState<SortKey>("winrate");
  const [expanded, setExpanded] = useState<string | null>(null);
  const allRanks = computeRanks(players);

  const sorted =
    sortBy === "bestChampion"
      ? [...players].sort((a, b) => allRanks.get(a.gameName)!.bestChampion - allRanks.get(b.gameName)!.bestChampion)
      : sortWithTieBreak(players, (p) => p.stats[STAT_MAP[sortBy].field] as number, STAT_MAP[sortBy].desc);

  return (
    <Panel>
      <PanelHeader icon={ListOrdered} title="Internal rankings" description="Pick a category · expand a player for every rank" />
      <div className="border-b border-border px-5 py-3">
        <SegmentedControl
          options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
          value={sortBy}
          onChange={setSortBy}
          ariaLabel="Ranking category"
          wrap
        />
      </div>
      <ol key={sortBy} className="appear-children divide-y divide-border">
        {sorted.map((player, i) => {
          const open = expanded === player.gameName;
          const ranks = allRanks.get(player.gameName)!;
          return (
            <li key={player.gameName}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : player.gameName)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted"
              >
                <RankNumber position={i + 1} />
                <ProfileIcon iconId={player.profileIconId} version={version} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{player.gameName}</span>
                  <span className="block text-xs text-faint">{player.stats.totalGames} games</span>
                </span>
                <span className="num text-sm font-semibold">
                  <StatValue player={player} sortKey={sortBy} version={version} />
                </span>
                <ChevronDown className={cn("size-4 text-faint transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <dl className="appear grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border bg-background/40 px-5 py-4 sm:grid-cols-4 lg:grid-cols-6">
                  {SORT_OPTIONS.map((opt) => (
                    <div key={opt.key} className="min-w-0 text-center">
                      <dt className="text-[10px] uppercase tracking-wider text-faint">{opt.label}</dt>
                      <dd className={cn("num font-display text-sm font-semibold", rankTone(ranks[opt.key], players.length))}>
                        #{ranks[opt.key]}
                      </dd>
                      <dd className="num truncate text-[11px] text-muted-foreground">
                        <StatValue player={player} sortKey={opt.key} version={version} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
