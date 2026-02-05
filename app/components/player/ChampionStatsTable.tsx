"use client";

import { useState } from "react";
import { ChampionStats } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import WinrateBar from "@/app/components/ui/WinrateBar";
import { cn } from "@/app/lib/utils";
import { ArrowUpDown } from "lucide-react";

type SortKey = "games" | "winrate" | "kda" | "damage";

interface ChampionStatsTableProps {
  champions: ChampionStats[];
  version: string;
}

export default function ChampionStatsTable({
  champions,
  version,
}: ChampionStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("games");
  const [sortAsc, setSortAsc] = useState(false);

  if (champions.length === 0) {
    return null;
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...champions].sort((a, b) => {
    let diff = 0;
    switch (sortKey) {
      case "games":
        diff = b.games - a.games;
        break;
      case "winrate":
        diff = b.winrate - a.winrate;
        break;
      case "kda":
        diff = b.avgKda - a.avgKda;
        break;
      case "damage":
        diff = b.avgDamage - a.avgDamage;
        break;
    }
    return sortAsc ? -diff : diff;
  });

  const thClass = (key: SortKey) =>
    cn(
      "px-4 py-3 text-center cursor-pointer select-none transition-colors hover:text-zinc-300",
      sortKey === key ? "text-zinc-200" : "",
    );

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Champion Stats
      </h2>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-x-auto">
        <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 text-left">Champion</th>
              <th
                className={thClass("games")}
                onClick={() => handleSort("games")}
              >
                <span className="inline-flex items-center gap-1">
                  Games
                  <ArrowUpDown
                    className={cn(
                      "h-3 w-3",
                      sortKey === "games" ? "text-zinc-300" : "text-zinc-600",
                    )}
                  />
                </span>
              </th>
              <th
                className={thClass("winrate")}
                onClick={() => handleSort("winrate")}
              >
                <span className="inline-flex items-center gap-1">
                  Winrate
                  <ArrowUpDown
                    className={cn(
                      "h-3 w-3",
                      sortKey === "winrate" ? "text-zinc-300" : "text-zinc-600",
                    )}
                  />
                </span>
              </th>
              <th className={thClass("kda")} onClick={() => handleSort("kda")}>
                <span className="inline-flex items-center gap-1">
                  KDA
                  <ArrowUpDown
                    className={cn(
                      "h-3 w-3",
                      sortKey === "kda" ? "text-zinc-300" : "text-zinc-600",
                    )}
                  />
                </span>
              </th>
              <th
                className={cn(thClass("damage"), "hidden sm:table-cell")}
                onClick={() => handleSort("damage")}
              >
                <span className="inline-flex items-center gap-1">
                  Avg DMG
                  <ArrowUpDown
                    className={cn(
                      "h-3 w-3",
                      sortKey === "damage" ? "text-zinc-300" : "text-zinc-600",
                    )}
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sorted.map((champ) => (
              <tr
                key={champ.championName}
                className="transition-colors hover:bg-zinc-800/30"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <ChampionIcon
                      championName={champ.championName}
                      version={version}
                      size={28}
                    />
                    <span className="font-medium text-zinc-200">
                      {champ.championName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center text-zinc-400">
                  {champ.games}
                </td>
                <td className="px-4 py-2.5">
                  <div className="mx-auto w-24">
                    <WinrateBar
                      wins={champ.wins}
                      losses={champ.losses}
                      showLabel={false}
                    />
                    <div className="mt-0.5 text-center text-xs text-zinc-400">
                      {formatWinrate(champ.winrate)}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center text-zinc-300">
                  {formatKda(champ.avgKda)}
                </td>
                <td className="hidden px-4 py-2.5 text-center text-zinc-400 sm:table-cell">
                  {Math.round(champ.avgDamage).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
