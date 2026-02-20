import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";

export type SortKey =
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
  | "bestChampion"
  | "firstBloodParticipation"
  | "dmgToBuildings"
  | "dmgToObjectives"
  | "goldLead"
  | "dmgLead";

export interface PlayerData {
  gameName: string;
  profileIconId: number | null;
  stats: PlayerAggregatedStats;
}

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
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
  { key: "firstBloodParticipation", label: "FB%" },
  { key: "dmgToBuildings", label: "Bldg" },
  { key: "dmgToObjectives", label: "Obj" },
  { key: "goldLead", label: "G.Lead" },
  { key: "dmgLead", label: "D.Lead" },
];

export const STAT_MAP: Record<
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
  firstBloodParticipation: {
    field: "firstBloodParticipation",
    desc: true,
    format: (v) => `${v.toFixed(1)}%`,
  },
  dmgToBuildings: {
    field: "avgDmgToBuildings",
    desc: true,
    format: (v) => Math.round(v).toLocaleString(),
  },
  dmgToObjectives: {
    field: "avgDmgToObjectives",
    desc: true,
    format: (v) => Math.round(v).toLocaleString(),
  },
  goldLead: {
    field: "avgGoldLead",
    desc: true,
    format: (v) => {
      const sign = v >= 0 ? "+" : "";
      return `${sign}${Math.round(v).toLocaleString()}`;
    },
  },
  dmgLead: {
    field: "avgDmgLead",
    desc: true,
    format: (v) => {
      const sign = v >= 0 ? "+" : "";
      return `${sign}${Math.round(v).toLocaleString()}`;
    },
  },
};

export function getBestChamp(stats: PlayerAggregatedStats): {
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

export function sortWithTieBreak(
  players: PlayerData[],
  getValue: (p: PlayerData) => number,
  desc: boolean,
): PlayerData[] {
  return [...players].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    const diff = desc ? vb - va : va - vb;
    if (diff !== 0) return diff;
    // Tiebreaker: most matches played always wins (desc)
    return b.stats.totalGames - a.stats.totalGames;
  });
}

export function computeRanks(
  players: PlayerData[],
): Map<string, Record<SortKey, number>> {
  const ranks = new Map<string, Record<SortKey, number>>();
  for (const p of players) {
    ranks.set(p.gameName, {} as Record<SortKey, number>);
  }

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

  const champSorted = [...players].sort((a, b) => {
    const ac = getBestChamp(a.stats);
    const bc = getBestChamp(b.stats);
    const diff = (bc?.value ?? -Infinity) - (ac?.value ?? -Infinity);
    if (diff !== 0) return diff;
    // Tiebreaker: most total matches played always wins
    return b.stats.totalGames - a.stats.totalGames;
  });
  champSorted.forEach((p, i) => {
    ranks.get(p.gameName)!.bestChampion = i + 1;
  });

  return ranks;
}
