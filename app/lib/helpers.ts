import {
  Match,
  MatchParticipant,
  PlayerAggregatedStats,
  ChampionStats,
  RoleStats,
  RankedEntry,
  StatCategory,
  BestOfChallenge,
  Position,
  LeagueEntry,
} from "../types/riot";
import {
  rankToLp,
  MIN_GAMES_FOR_BEST,
  TIER_ORDER,
  TIER_BASE_LP,
  SEASON_START_EPOCH,
} from "../data/constants";

// ─── Extract participant from match ───
export function getParticipant(
  match: Match,
  puuid: string,
): MatchParticipant | undefined {
  return match.info.participants.find((p) => p.puuid === puuid);
}

// ─── KDA Calculation ───
export function calcKda(
  kills: number,
  deaths: number,
  assists: number,
): number {
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

export function formatKda(kda: number): string {
  return kda.toFixed(2);
}

// ─── Winrate ───
export function calcWinrate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function formatWinrate(winrate: number): string {
  return `${winrate.toFixed(1)}%`;
}

// ─── CS per minute ───
export function calcCsPerMin(cs: number, gameDurationSeconds: number): number {
  const minutes = gameDurationSeconds / 60;
  if (minutes === 0) return 0;
  return cs / minutes;
}

// ─── Empty stats sentinel (used when DB has no data yet) ───
export const EMPTY_STATS: PlayerAggregatedStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  winrate: 0,
  avgKills: 0,
  avgDeaths: 0,
  avgAssists: 0,
  avgKda: 0,
  avgCs: 0,
  avgCsPerMin: 0,
  avgDamage: 0,
  avgDmgPerMin: 0,
  avgGoldPerMin: 0,
  avgDmgPerMinNoSupp: 0,
  avgCsPerMinNoSupp: 0,
  avgGoldPerMinNoSupp: 0,
  nonSuppGames: 0,
  avgVisionScore: 0,
  avgKillParticipation: 0,
  firstBloodParticipation: 0,
  avgDmgToBuildings: 0,
  avgDmgToObjectives: 0,
  avgGoldLead: 0,
  avgDmgLead: 0,
  goldLeadGames: 0,
  championStats: [],
  roleStats: [],
  primaryRole: null,
};

// ─── Aggregate player stats from matches ───
export function aggregatePlayerStats(
  puuid: string,
  matches: Match[],
): PlayerAggregatedStats {
  const validMatches = matches.filter(
    (m) =>
      getParticipant(m, puuid) &&
      m.info.gameStartTimestamp >= SEASON_START_EPOCH,
  );

  if (validMatches.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      avgKda: 0,
      avgCs: 0,
      avgCsPerMin: 0,
      avgDamage: 0,
      avgDmgPerMin: 0,
      avgGoldPerMin: 0,
      avgDmgPerMinNoSupp: 0,
      avgCsPerMinNoSupp: 0,
      avgGoldPerMinNoSupp: 0,
      nonSuppGames: 0,
      avgVisionScore: 0,
      avgKillParticipation: 0,
      firstBloodParticipation: 0,
      avgDmgToBuildings: 0,
      avgDmgToObjectives: 0,
      avgGoldLead: 0,
      avgDmgLead: 0,
      goldLeadGames: 0,
      championStats: [],
      roleStats: [],
      primaryRole: null,
    };
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalDmgPerMin = 0;
  let totalGoldPerMin = 0;
  let totalCs = 0;
  let totalCsPerMin = 0;
  let totalDmgPerMinNoSupp = 0;
  let totalCsPerMinNoSupp = 0;
  let totalGoldPerMinNoSupp = 0;
  let nonSuppGames = 0;
  let totalVision = 0;
  let totalKillParticipation = 0;
  let wins = 0;
  let firstBloodCount = 0;
  let totalDmgToBuildings = 0;
  let totalDmgToObjectives = 0;
  let totalGoldLead = 0;
  let totalDmgLead = 0;
  let goldLeadGames = 0;

  const champMap = new Map<
    string,
    {
      wins: number;
      losses: number;
      kills: number;
      deaths: number;
      assists: number;
      damage: number;
      games: number;
    }
  >();
  const roleMap = new Map<
    Position,
    { wins: number; losses: number; games: number }
  >();

  for (const match of validMatches) {
    const p = getParticipant(match, puuid)!;

    totalKills += p.kills;
    totalDeaths += p.deaths;
    totalAssists += p.assists;
    totalDamage += p.totalDamageDealtToChampions;
    const durationMin = match.info.gameDuration / 60;
    totalDmgPerMin +=
      durationMin > 0 ? p.totalDamageDealtToChampions / durationMin : 0;
    totalGoldPerMin += durationMin > 0 ? p.goldEarned / durationMin : 0;
    const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
    totalCs += cs;
    totalCsPerMin += calcCsPerMin(cs, match.info.gameDuration);
    totalVision += durationMin > 0 ? p.visionScore / durationMin : 0;
    if (p.win) wins++;

    // Non-support stats (DMG/min, CS/min, Gold/min excluding support games)
    const isSupport = p.teamPosition === "UTILITY";
    if (!isSupport) {
      nonSuppGames++;
      totalDmgPerMinNoSupp +=
        durationMin > 0 ? p.totalDamageDealtToChampions / durationMin : 0;
      totalCsPerMinNoSupp += calcCsPerMin(cs, match.info.gameDuration);
      totalGoldPerMinNoSupp += durationMin > 0 ? p.goldEarned / durationMin : 0;
    }

    // Kill participation: (kills + assists) / team total kills
    const teamKills = match.info.participants
      .filter((tp) => tp.teamId === p.teamId)
      .reduce((sum, tp) => sum + tp.kills, 0);
    if (teamKills > 0) {
      totalKillParticipation += (p.kills + p.assists) / teamKills;
    }

    // First blood participation
    if (p.firstBloodKill || p.firstBloodAssist) firstBloodCount++;

    // Damage to buildings/objectives (no supp)
    if (!isSupport) {
      totalDmgToBuildings += p.damageDealtToBuildings ?? 0;
      totalDmgToObjectives += p.damageDealtToObjectives ?? 0;
    }

    // Gold lead & damage lead vs lane opponent (same teamPosition, enemy team)
    if (p.teamPosition && p.teamPosition !== "") {
      const opponent = match.info.participants.find(
        (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
      );
      if (opponent) {
        totalGoldLead += p.goldEarned - opponent.goldEarned;
        totalDmgLead +=
          p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions;
        goldLeadGames++;
      }
    }

    // Champion stats
    const champ = champMap.get(p.championName) ?? {
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      games: 0,
    };
    champ.games++;
    if (p.win) champ.wins++;
    else champ.losses++;
    champ.kills += p.kills;
    champ.deaths += p.deaths;
    champ.assists += p.assists;
    champ.damage += p.totalDamageDealtToChampions;
    champMap.set(p.championName, champ);

    // Role stats
    const pos = p.teamPosition as Position;
    if (pos && pos !== ("" as unknown as Position)) {
      const role = roleMap.get(pos) ?? { wins: 0, losses: 0, games: 0 };
      role.games++;
      if (p.win) role.wins++;
      else role.losses++;
      roleMap.set(pos, role);
    }
  }

  const total = validMatches.length;

  const championStats: ChampionStats[] = Array.from(champMap.entries())
    .map(([championName, s]) => ({
      championName,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      winrate: calcWinrate(s.wins, s.games),
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      avgKda: calcKda(s.kills, s.deaths, s.assists),
      avgDamage: s.damage / s.games,
    }))
    .sort((a, b) => b.games - a.games);

  const roleStats: RoleStats[] = Array.from(roleMap.entries())
    .map(([position, s]) => ({
      position,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      winrate: calcWinrate(s.wins, s.games),
    }))
    .sort((a, b) => b.games - a.games);

  const primaryRole = roleStats.length > 0 ? roleStats[0].position : null;

  return {
    totalGames: total,
    wins,
    losses: total - wins,
    winrate: calcWinrate(wins, total),
    avgKills: totalKills / total,
    avgDeaths: totalDeaths / total,
    avgAssists: totalAssists / total,
    avgKda: calcKda(totalKills, totalDeaths, totalAssists),
    avgCs: totalCs / total,
    avgCsPerMin: totalCsPerMin / total,
    avgDamage: totalDamage / total,
    avgDmgPerMin: totalDmgPerMin / total,
    avgGoldPerMin: totalGoldPerMin / total,
    avgDmgPerMinNoSupp:
      nonSuppGames > 0 ? totalDmgPerMinNoSupp / nonSuppGames : 0,
    avgCsPerMinNoSupp:
      nonSuppGames > 0 ? totalCsPerMinNoSupp / nonSuppGames : 0,
    avgGoldPerMinNoSupp:
      nonSuppGames > 0 ? totalGoldPerMinNoSupp / nonSuppGames : 0,
    nonSuppGames,
    avgVisionScore: totalVision / total,
    avgKillParticipation: (totalKillParticipation / total) * 100,
    firstBloodParticipation: (firstBloodCount / total) * 100,
    avgDmgToBuildings:
      nonSuppGames > 0 ? totalDmgToBuildings / nonSuppGames : 0,
    avgDmgToObjectives:
      nonSuppGames > 0 ? totalDmgToObjectives / nonSuppGames : 0,
    avgGoldLead: goldLeadGames > 0 ? totalGoldLead / goldLeadGames : 0,
    avgDmgLead: goldLeadGames > 0 ? totalDmgLead / goldLeadGames : 0,
    goldLeadGames,
    championStats,
    roleStats,
    primaryRole,
  };
}

// ─── Best / Worst of Challenge (across all players, ranked lists) ───

export function computeBestOfChallenge(
  players: { gameName: string; stats: PlayerAggregatedStats }[],
): BestOfChallenge {
  const eligible = players.filter(
    (p) => p.stats.totalGames >= MIN_GAMES_FOR_BEST,
  );

  // Helper: build sorted entries for a stat extractor
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
      return b.games - a.games; // tie-break: more games = higher rank
    });
    return entries.slice(0, 3);
  }

  // Simple stat: uses totalGames as game count
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

  // No-supp stat: uses nonSuppGames as game count
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

  // Best/worst champion: ranked by absolute points (wins - losses)
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

  // Gold/dmg lead: uses goldLeadGames as game count
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
    deaths: simple("avgDeaths", false), // best = least deaths
    assists: simple("avgAssists", true),
    killParticipation: simple("avgKillParticipation", true),
    vision: simple("avgVisionScore", true),
    bestChampion: champRank(true),
    firstBloodParticipation: simple("firstBloodParticipation", true),
    dmgToBuildings: noSupp("avgDmgToBuildings", true),
    dmgToObjectives: noSupp("avgDmgToObjectives", true),
    goldLead: leadStat("avgGoldLead", true),
    dmgLead: leadStat("avgDmgLead", true),
  };

  const worst: Record<StatCategory, RankedEntry[]> = {
    winrate: simple("winrate", false),
    kda: simple("avgKda", false),
    dmgPerMin: noSupp("avgDmgPerMinNoSupp", false),
    csPerMin: noSupp("avgCsPerMinNoSupp", false),
    goldPerMin: noSupp("avgGoldPerMinNoSupp", false),
    kills: simple("avgKills", false),
    deaths: simple("avgDeaths", true), // worst = most deaths
    assists: simple("avgAssists", false),
    killParticipation: simple("avgKillParticipation", false),
    vision: simple("avgVisionScore", false),
    bestChampion: champRank(false),
    firstBloodParticipation: simple("firstBloodParticipation", false),
    dmgToBuildings: noSupp("avgDmgToBuildings", false),
    dmgToObjectives: noSupp("avgDmgToObjectives", false),
    goldLead: leadStat("avgGoldLead", false),
    dmgLead: leadStat("avgDmgLead", false),
  };

  return { best, worst };
}

// ─── Average team Elo ───
export function computeAverageElo(entries: (LeagueEntry | null)[]): {
  avgLp: number;
  avgTierLabel: string;
} {
  const validEntries = entries.filter((e): e is LeagueEntry => e !== null);
  if (validEntries.length === 0) return { avgLp: 0, avgTierLabel: "Unranked" };

  const totalLp = validEntries.reduce(
    (sum, e) => sum + rankToLp(e.tier, e.rank, e.leaguePoints),
    0,
  );
  const avgLp = Math.round(totalLp / validEntries.length);

  // Reverse-map avgLp to a tier label
  const avgTierLabel = lpToTierLabel(avgLp);
  return { avgLp, avgTierLabel };
}

// Reverse-map total LP to a tier + division label using TIER_BASE_LP
export function lpToTierLabel(lp: number): string {
  let matchedTier = TIER_ORDER[0];
  for (const tier of TIER_ORDER) {
    if (lp >= TIER_BASE_LP[tier]) matchedTier = tier;
    else break;
  }

  const tierIndex = TIER_ORDER.indexOf(matchedTier);
  const formatted = matchedTier.charAt(0) + matchedTier.slice(1).toLowerCase();

  // Iron–Diamond (indices 0-6) have 4 divisions
  if (tierIndex <= 6) {
    const lpInTier = lp - TIER_BASE_LP[matchedTier];
    const divisions = ["IV", "III", "II", "I"];
    const divIndex = Math.min(Math.floor(lpInTier / 100), 3);
    return `${formatted} ${divisions[divIndex]}`;
  }

  return formatted;
}

// Get the RankTier key from total LP (for emblem rendering)
export function lpToTier(lp: number): string {
  let matchedTier = TIER_ORDER[0];
  for (const tier of TIER_ORDER) {
    if (lp >= TIER_BASE_LP[tier]) matchedTier = tier;
    else break;
  }
  return matchedTier;
}

// ─── Find group matches (matches where 2+ members played together) ───
export function findGroupMatches(
  allPlayerMatches: { puuid: string; gameName: string; matches: Match[] }[],
): { match: Match; players: { puuid: string; gameName: string }[] }[] {
  const matchPlayerMap = new Map<
    string,
    { match: Match; players: { puuid: string; gameName: string }[] }
  >();

  for (const { puuid, gameName, matches } of allPlayerMatches) {
    for (const match of matches) {
      const matchId = match.metadata.matchId;
      if (!matchPlayerMap.has(matchId)) {
        matchPlayerMap.set(matchId, { match, players: [] });
      }
      matchPlayerMap.get(matchId)!.players.push({ puuid, gameName });
    }
  }

  return Array.from(matchPlayerMap.values())
    .filter((entry) => entry.players.length >= 2)
    .sort((a, b) => b.match.info.gameCreation - a.match.info.gameCreation);
}
