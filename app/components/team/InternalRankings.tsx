"use client";

import { useState } from "react";
import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { ChevronDown } from "lucide-react";

type SortKey =
  | "winrate"
  | "kda"
  | "dmgPerMin"
  | "csPerMin"
  | "goldPerMin"
  | "kills"
  | "deaths"
  | "assists"
  | "killParticipation"
  | "vision"
  | "bestChampion";

interface PlayerData {
  gameName: string;
  profileIconId: number | null;
  stats: PlayerAggregatedStats;
}

interface InternalRankingsProps {
  players: PlayerData[];
  version: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "winrate", label: "WR" },
  { key: "kda", label: "KDA" },
  { key: "dmgPerMin", label: "DMG/m" },
  { key: "csPerMin", label: "CS/m" },
  { key: "goldPerMin", label: "Gold/m" },
  { key: "kills", label: "Kills" },
  { key: "deaths", label: "Deaths" },
  { key: "assists", label: "Assists" },
  { key: "killParticipation", label: "KP" },
  { key: "vision", label: "Vision" },
  { key: "bestChampion", label: "Champ" },
];

// Map sort key to stat field and whether higher is better
const STAT_MAP: Record<
  Exclude<SortKey, "bestChampion">,
  {
    field: keyof PlayerAggregatedStats;
    desc: boolean;
    format: (v: number) => string;
  }
> = {
  winrate: { field: "winrate", desc: true, format: (v) => formatWinrate(v) },
  kda: { field: "avgKda", desc: true, format: (v) => formatKda(v) },
  dmgPerMin: {
    field: "avgDmgPerMinNoSupp",
    desc: true,
    format: (v) => Math.round(v).toLocaleString(),
  },
  csPerMin: {
    field: "avgCsPerMinNoSupp",
    desc: true,
    format: (v) => v.toFixed(1),
  },
  goldPerMin: {
    field: "avgGoldPerMinNoSupp",
    desc: true,
    format: (v) => Math.round(v).toLocaleString(),
  },
  kills: { field: "avgKills", desc: true, format: (v) => v.toFixed(1) },
  deaths: { field: "avgDeaths", desc: false, format: (v) => v.toFixed(1) },
  assists: { field: "avgAssists", desc: true, format: (v) => v.toFixed(1) },
  killParticipation: {
    field: "avgKillParticipation",
    desc: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
  vision: {
    field: "avgVisionScore",
    desc: true,
    format: (v) => v.toFixed(1),
  },
};

// Get each player's best champion by absolute points (wins - losses), tie-break by games
function getBestChamp(stats: PlayerAggregatedStats): {
  name: string;
  value: number;
  games: number;
  record: string;
} | null {
  let best: {
    name: string;
    value: number;
    games: number;
    record: string;
  } | null = null;
  for (const c of stats.championStats) {
    const pts = c.wins - c.losses;
    if (
      !best ||
      pts > best.value ||
      (pts === best.value && c.games > best.games)
    ) {
      best = {
        name: c.championName,
        value: pts,
        games: c.games,
        record: `${c.wins}W-${c.losses}L`,
      };
    }
  }
  return best;
}

// Sort helper with tie-breaking by totalGames
function sortWithTieBreak(
  players: PlayerData[],
  getValue: (p: PlayerData) => number,
  desc: boolean,
): PlayerData[] {
  return [...players].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    const diff = desc ? vb - va : va - vb;
    if (diff !== 0) return diff;
    return b.stats.totalGames - a.stats.totalGames;
  });
}

function computeRanks(
  players: PlayerData[],
): Map<string, Record<SortKey, number>> {
  const ranks = new Map<string, Record<SortKey, number>>();
  for (const p of players) {
    ranks.set(p.gameName, {} as Record<SortKey, number>);
  }

  // Rank numeric stats with tie-breaking by totalGames
  for (const [key, { field, desc }] of Object.entries(STAT_MAP) as [
    Exclude<SortKey, "bestChampion">,
    (typeof STAT_MAP)[Exclude<SortKey, "bestChampion">],
  ][]) {
    const sorted = sortWithTieBreak(
      players,
      (p) => p.stats[field] as number,
      desc,
    );
    sorted.forEach((p, i) => {
      ranks.get(p.gameName)![key] = i + 1;
    });
  }

  // Rank best champion (by absolute points desc, tie-break by champ games)
  const champSorted = [...players].sort((a, b) => {
    const ac = getBestChamp(a.stats);
    const bc = getBestChamp(b.stats);
    const diff = (bc?.value ?? -Infinity) - (ac?.value ?? -Infinity);
    if (diff !== 0) return diff;
    return (bc?.games ?? 0) - (ac?.games ?? 0);
  });
  champSorted.forEach((p, i) => {
    ranks.get(p.gameName)!.bestChampion = i + 1;
  });

  return ranks;
}

function rankBadge(rank: number, total: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-zinc-200";
  if (rank === 3) return "text-amber-600";
  if (rank === total - 1) return "text-red-400";
  if (rank === total) return "text-red-600";
  return "text-zinc-500";
}

export default function InternalRankings({
  players,
  version,
}: InternalRankingsProps) {
  const [sortBy, setSortBy] = useState<SortKey>("winrate");
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Sort players with tie-breaking
  const sorted = (() => {
    if (sortBy === "bestChampion") {
      return [...players].sort((a, b) => {
        const ac = getBestChamp(a.stats);
        const bc = getBestChamp(b.stats);
        const diff = (bc?.value ?? -Infinity) - (ac?.value ?? -Infinity);
        if (diff !== 0) return diff;
        return (bc?.games ?? 0) - (ac?.games ?? 0);
      });
    }
    const { field, desc } = STAT_MAP[sortBy];
    return sortWithTieBreak(players, (p) => p.stats[field] as number, desc);
  })();

  // Format the currently selected stat for display
  function formatCurrent(player: PlayerData): React.ReactNode {
    if (sortBy === "bestChampion") {
      const bc = getBestChamp(player.stats);
      if (!bc) return "—";
      const sign = bc.value > 0 ? "+" : "";
      return (
        <span className="inline-flex items-center gap-1.5">
          <ChampionIcon
            championName={bc.name}
            version={version}
            size={20}
            className="rounded"
          />
          {bc.name} ({sign}
          {bc.value})
        </span>
      );
    }
    const { field, format } = STAT_MAP[sortBy];
    return format(player.stats[field] as number);
  }

  const allRanks = computeRanks(players);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Internal Rankings
        </h2>
        <div className="flex flex-wrap gap-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={cn(
                "rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                sortBy === option.key
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden divide-y divide-zinc-800/50 stagger-rows">
        {sorted.map((player, index) => {
          const isExpanded = expandedPlayer === player.gameName;
          const playerRanks = allRanks.get(player.gameName)!;

          return (
            <div key={player.gameName}>
              <div className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/40">
                <span
                  className={cn(
                    "w-6 text-center text-sm font-bold",
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                        ? "text-zinc-300"
                        : index === 2
                          ? "text-amber-600"
                          : "text-zinc-600",
                  )}
                >
                  {index + 1}
                </span>
                <ProfileIcon
                  iconId={player.profileIconId}
                  version={version}
                  size={28}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-zinc-200">
                    {player.gameName}
                  </span>
                  <div className="text-xs text-zinc-500">
                    {player.stats.totalGames} games
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-300">
                  {formatCurrent(player)}
                </span>
                <button
                  onClick={() =>
                    setExpandedPlayer(isExpanded ? null : player.gameName)
                  }
                  className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {/* Expanded: all stat ranks */}
              {isExpanded && (
                <div className="border-t border-zinc-800/30 bg-zinc-950/30 px-4 py-3">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-6">
                    {SORT_OPTIONS.map((opt) => {
                      const r = playerRanks[opt.key];
                      let valNode: React.ReactNode;
                      if (opt.key === "bestChampion") {
                        const bc = getBestChamp(player.stats);
                        if (bc) {
                          const sign = bc.value > 0 ? "+" : "";
                          valNode = (
                            <span className="inline-flex items-center gap-1">
                              <ChampionIcon
                                championName={bc.name}
                                version={version}
                                size={16}
                                className="rounded"
                              />
                              <span>
                                {bc.name} ({sign}
                                {bc.value})
                              </span>
                            </span>
                          );
                        } else {
                          valNode = "—";
                        }
                      } else {
                        const val = player.stats[
                          STAT_MAP[opt.key].field
                        ] as number;
                        valNode = STAT_MAP[opt.key].format(val);
                      }
                      return (
                        <div key={opt.key} className="text-center">
                          <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                            {opt.label}
                          </div>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              rankBadge(r, players.length),
                            )}
                          >
                            #{r}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            {valNode}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
