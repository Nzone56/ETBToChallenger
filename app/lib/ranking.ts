import {
  PlayerAggregatedStats,
  RankedEntry,
  StatCategory,
  BestOfChallenge,
} from "../types/riot";
import { MIN_GAMES_FOR_BEST } from "../data/constants";

// ─── Best / Worst of Challenge (across all players, ranked lists) ───
export function computeBestOfChallenge(
  players: { gameName: string; stats: PlayerAggregatedStats }[],
): BestOfChallenge {
  const eligible = players.filter(
    (p) => p.stats.totalGames >= MIN_GAMES_FOR_BEST,
  );

  function rank(
    extract: (s: PlayerAggregatedStats, gn: string) => RankedEntry[],
    desc: boolean,
  ): RankedEntry[] {
    const entries = eligible.flatMap(({ gameName, stats }) =>
      extract(stats, gameName),
    );
    entries.sort((a, b) => {
      const diff = desc ? b.value - a.value : a.value - b.value;
      if (diff !== 0) return diff;
      return b.games - a.games;
    });
    return entries.slice(0, 3);
  }

  const simple = (
    field: keyof PlayerAggregatedStats,
    desc: boolean,
  ): RankedEntry[] =>
    rank(
      (s, gn) => [
        { gameName: gn, value: s[field] as number, games: s.totalGames },
      ],
      desc,
    );

  const noSupp = (
    field: keyof PlayerAggregatedStats,
    desc: boolean,
  ): RankedEntry[] =>
    rank(
      (s, gn) => [
        { gameName: gn, value: s[field] as number, games: s.nonSuppGames },
      ],
      desc,
    );

  function champRank(desc: boolean): RankedEntry[] {
    const entries: RankedEntry[] = [];
    for (const { gameName, stats } of eligible) {
      for (const c of stats.championStats) {
        entries.push({
          gameName,
          value: c.wins - c.losses,
          games: c.games,
          extra: c.championName,
          extra2: `${c.wins}W-${c.losses}L`,
        });
      }
    }
    entries.sort((a, b) => {
      const diff = desc ? b.value - a.value : a.value - b.value;
      if (diff !== 0) return diff;
      return b.games - a.games;
    });
    return entries.slice(0, 3);
  }

  const leadStat = (
    field: keyof PlayerAggregatedStats,
    desc: boolean,
  ): RankedEntry[] =>
    rank(
      (s, gn) => [
        { gameName: gn, value: s[field] as number, games: s.goldLeadGames },
      ],
      desc,
    );

  const best: Record<StatCategory, RankedEntry[]> = {
    winrate: simple("winrate", true),
    kda: simple("avgKda", true),
    dmgPerMin: noSupp("avgDmgPerMinNoSupp", true),
    csPerMin: noSupp("avgCsPerMinNoSupp", true),
    goldPerMin: noSupp("avgGoldPerMinNoSupp", true),
    kills: simple("avgKills", true),
    deaths: simple("avgDeaths", false),
    assists: simple("avgAssists", true),
    killParticipation: simple("avgKillParticipation", true),
    vision: simple("avgVisionScore", true),
    bestChampion: champRank(true),
    firstBloodParticipation: simple("firstBloodParticipation", true),
    dmgToBuildings: noSupp("avgDmgToBuildings", true),
    dmgToObjectives: noSupp("avgDmgToObjectives", true),
    goldLead: leadStat("avgGoldLead", true),
    dmgLead: leadStat("avgDmgLead", true),
    cirAvg: simple("avgCir", true),
  };

  const worst: Record<StatCategory, RankedEntry[]> = {
    winrate: simple("winrate", false),
    kda: simple("avgKda", false),
    dmgPerMin: noSupp("avgDmgPerMinNoSupp", false),
    csPerMin: noSupp("avgCsPerMinNoSupp", false),
    goldPerMin: noSupp("avgGoldPerMinNoSupp", false),
    kills: simple("avgKills", false),
    deaths: simple("avgDeaths", true),
    assists: simple("avgAssists", false),
    killParticipation: simple("avgKillParticipation", false),
    vision: simple("avgVisionScore", false),
    bestChampion: champRank(false),
    firstBloodParticipation: simple("firstBloodParticipation", false),
    dmgToBuildings: noSupp("avgDmgToBuildings", false),
    dmgToObjectives: noSupp("avgDmgToObjectives", false),
    goldLead: leadStat("avgGoldLead", false),
    dmgLead: leadStat("avgDmgLead", false),
    cirAvg: simple("avgCir", false),
  };

  return { best, worst };
}
