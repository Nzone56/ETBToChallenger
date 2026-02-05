import {
  Match,
  MatchParticipant,
  PlayerAggregatedStats,
  ChampionStats,
  RoleStats,
  BestOfChallenge,
  Position,
  LeagueEntry,
} from "../types/riot";
import {
  rankToLp,
  MIN_GAMES_FOR_BEST,
  MIN_CHAMPION_GAMES,
  TIER_ORDER,
  TIER_BASE_LP,
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

// ─── Aggregate player stats from matches ───
export function aggregatePlayerStats(
  puuid: string,
  matches: Match[],
): PlayerAggregatedStats {
  const validMatches = matches.filter((m) => getParticipant(m, puuid));

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
      avgVisionScore: 0,
      avgKillParticipation: 0,
      championStats: [],
      roleStats: [],
      primaryRole: null,
    };
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalCs = 0;
  let totalCsPerMin = 0;
  let totalVision = 0;
  let totalKillParticipation = 0;
  let wins = 0;

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
    const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
    totalCs += cs;
    totalCsPerMin += calcCsPerMin(cs, match.info.gameDuration);
    totalVision += p.visionScore;
    if (p.win) wins++;

    // Kill participation: (kills + assists) / team total kills
    const teamKills = match.info.participants
      .filter((tp) => tp.teamId === p.teamId)
      .reduce((sum, tp) => sum + tp.kills, 0);
    if (teamKills > 0) {
      totalKillParticipation += (p.kills + p.assists) / teamKills;
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
    avgVisionScore: totalVision / total,
    avgKillParticipation: (totalKillParticipation / total) * 100,
    championStats,
    roleStats,
    primaryRole,
  };
}

// ─── Best of Challenge (across all players) ───
export function computeBestOfChallenge(
  players: { gameName: string; stats: PlayerAggregatedStats }[],
): BestOfChallenge {
  let topWinrate: BestOfChallenge["topWinrate"] = null;
  let topKda: BestOfChallenge["topKda"] = null;
  let topDamage: BestOfChallenge["topDamage"] = null;
  let bestChampion: BestOfChallenge["bestChampion"] = null;
  let mostAvgKills: BestOfChallenge["mostAvgKills"] = null;
  let leastAvgDeaths: BestOfChallenge["leastAvgDeaths"] = null;
  let mostAvgAssists: BestOfChallenge["mostAvgAssists"] = null;
  let topKillParticipation: BestOfChallenge["topKillParticipation"] = null;

  for (const { gameName, stats } of players) {
    if (stats.totalGames < MIN_GAMES_FOR_BEST) continue;

    if (!topWinrate || stats.winrate > topWinrate.value) {
      topWinrate = { gameName, value: stats.winrate, games: stats.totalGames };
    }
    if (!topKda || stats.avgKda > topKda.value) {
      topKda = { gameName, value: stats.avgKda, games: stats.totalGames };
    }
    if (!topDamage || stats.avgDamage > topDamage.value) {
      topDamage = { gameName, value: stats.avgDamage, games: stats.totalGames };
    }
    if (!mostAvgKills || stats.avgKills > mostAvgKills.value) {
      mostAvgKills = {
        gameName,
        value: stats.avgKills,
        games: stats.totalGames,
      };
    }
    if (!leastAvgDeaths || stats.avgDeaths < leastAvgDeaths.value) {
      leastAvgDeaths = {
        gameName,
        value: stats.avgDeaths,
        games: stats.totalGames,
      };
    }
    if (!mostAvgAssists || stats.avgAssists > mostAvgAssists.value) {
      mostAvgAssists = {
        gameName,
        value: stats.avgAssists,
        games: stats.totalGames,
      };
    }
    if (
      !topKillParticipation ||
      stats.avgKillParticipation > topKillParticipation.value
    ) {
      topKillParticipation = {
        gameName,
        value: stats.avgKillParticipation,
        games: stats.totalGames,
      };
    }

    for (const champ of stats.championStats) {
      if (champ.games < MIN_CHAMPION_GAMES) continue;
      if (!bestChampion || champ.winrate > bestChampion.winrate) {
        bestChampion = {
          gameName,
          championName: champ.championName,
          winrate: champ.winrate,
          games: champ.games,
        };
      }
    }
  }

  return {
    topWinrate,
    topKda,
    topDamage,
    bestChampion,
    mostAvgKills,
    leastAvgDeaths,
    mostAvgAssists,
    topKillParticipation,
  };
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
