import {
  Match,
  PlayerAggregatedStats,
  ChampionStats,
  RoleStats,
  Position,
} from "../types/riot";
import { SEASON_START_EPOCH } from "../data/constants";
import { getParticipant, calcKda, calcWinrate, calcCsPerMin } from "./format";
import { computeCIR_v3 } from "./cir";

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
  avgCir: 0,
  championStats: [],
  roleStats: [],
  primaryRole: null,
};

const ZERO_STATS: PlayerAggregatedStats = { ...EMPTY_STATS };

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

  if (validMatches.length === 0) return { ...ZERO_STATS };

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
  let totalCir = 0;

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
      totalCir: number;
    }
  >();
  const roleMap = new Map<
    Position,
    { wins: number; losses: number; games: number; totalCir: number }
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
      totalCir: 0,
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
      const role = roleMap.get(pos) ?? {
        wins: 0,
        losses: 0,
        games: 0,
        totalCir: 0,
      };
      role.games++;
      if (p.win) role.wins++;
      else role.losses++;
      roleMap.set(pos, role);
    }

    // CIR v3
    const teamTotalDmg = match.info.participants
      .filter((tp) => tp.teamId === p.teamId)
      .reduce((sum, tp) => sum + tp.totalDamageDealtToChampions, 0);
    const teamDmgPct =
      teamTotalDmg > 0
        ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
        : 0;
    const maxGPM = Math.max(
      ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
    );
    const opponent = match.info.participants.find(
      (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
    );
    const goldLead = opponent ? p.goldEarned - opponent.goldEarned : 0;
    const dmgLead = opponent
      ? p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions
      : 0;
    const kp = teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0;

    const cirResult = computeCIR_v3({
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      killParticipation: kp,
      visionPerMin: durationMin > 0 ? p.visionScore / durationMin : 0,
      dmgToObjectives: p.damageDealtToObjectives ?? 0,
      firstBloodParticipation: p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
      goldPerMin: durationMin > 0 ? p.goldEarned / durationMin : 0,
      csPerMin: calcCsPerMin(cs, match.info.gameDuration),
      goldLead,
      dmgPerMin:
        durationMin > 0 ? p.totalDamageDealtToChampions / durationMin : 0,
      dmgToBuildings: p.damageDealtToBuildings ?? 0,
      dmgLead,
      teamDamagePercent: teamDmgPct,
      maxGameGoldPerMin: maxGPM,
      teamPosition: p.teamPosition,
    });
    totalCir += cirResult.score;

    // Update champion CIR
    const champForCir = champMap.get(p.championName);
    if (champForCir) {
      champForCir.totalCir += cirResult.score;
      champMap.set(p.championName, champForCir);
    }

    // Update role CIR
    if (pos && pos !== ("" as unknown as Position)) {
      const roleForCir = roleMap.get(pos);
      if (roleForCir) {
        roleForCir.totalCir += cirResult.score;
        roleMap.set(pos, roleForCir);
      }
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
      avgCir: s.totalCir / s.games,
    }))
    .sort((a, b) => b.games - a.games);

  const roleStats: RoleStats[] = Array.from(roleMap.entries())
    .map(([position, s]) => ({
      position,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      winrate: calcWinrate(s.wins, s.games),
      avgCir: s.totalCir / s.games,
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
    avgCir: total > 0 ? totalCir / total : 0,
    championStats,
    roleStats,
    primaryRole,
  };
}
