import { getDb, ensureSchema } from "./db";
import { SEASON_START_EPOCH, QUEUE_FLEX } from "../data/constants";
import { users } from "../data/users";
import { Match } from "../types/riot";
import { computeCIR_v3 } from "./cir";
import { isRemake } from "./helpers";

const RUKAWA_PUUID =
  "11oD1XEZFGtPP3XbD5U6MwlXu8BCBl2y0J3WLBRGPfZ4IUT7Z2BuvF3Mg5HLl6KMSFkkp0ItuNeqZA";

export interface SynergyData {
  teammate: string;
  puuid: string;
  gamesWithRukawa: number;
  winsWithRukawa: number;
  winrateWithRukawa: number;
}

export interface RukawaTaxData {
  teammate: string;
  puuid: string;
  avgCirWithRukawa: number;
  avgCirWithoutRukawa: number;
  cirDrain: number;
}

export interface WinrateImpactData {
  teammate: string;
  puuid: string;
  wrWithRukawa: number;
  wrWithoutRukawa: number;
  wrDrain: number;
  gamesWithRukawa: number;
  gamesWithoutRukawa: number;
}

export interface StackCombo {
  players: string[];
  puuids: string[];
  games: number;
  wins: number;
  winrate: number;
  avgCirDifference: number; // Avg CIR of teammates minus Rukawa's CIR (positive = they carried)
}

export interface RolePerformance {
  role: string;
  games: number;
  avgCir: number;
  winrate: number;
}

export interface RukawaAnalytics {
  synergyMatrix: SynergyData[];
  rukawaTax: RukawaTaxData[];
  winrateImpact: WinrateImpactData[];
  stack3Combos: StackCombo[];
  stack5Combos: StackCombo[];
  rolePerformance: RolePerformance[];
  lpDonated: number;
  lowestCirMatches: string[]; // Match IDs where Rukawa had lowest CIR
  totalSeasonGames: number;
}

export async function getRukawaAnalytics(): Promise<RukawaAnalytics> {
  await ensureSchema();
  const db = getDb();

  const teammates = users.filter((u) => u.puuid !== RUKAWA_PUUID);

  // Get all group matches
  const groupRes = await db.execute(
    "SELECT match_data, player_list FROM group_matches",
  );

  const groupMatchMap = new Map<
    string,
    { puuid: string; gameName: string }[]
  >();
  for (const row of groupRes.rows) {
    const match = JSON.parse(row.match_data as string);
    const players = JSON.parse(row.player_list as string);
    groupMatchMap.set(match.metadata.matchId, players);
  }

  // Get all Rukawa's matches
  const rukawaMatchesRes = await db.execute({
    sql: `SELECT DISTINCT m.match_id, m.data FROM matches m
          JOIN player_matches pm ON pm.match_id = m.match_id
          WHERE pm.puuid = ?
          ORDER BY pm.played_at DESC`,
    args: [RUKAWA_PUUID],
  });

  const synergyMap = new Map<string, { games: number; wins: number }>();
  const cirWithMap = new Map<string, number[]>(); // teammate -> CIR values when with Rukawa
  const cirWithoutMap = new Map<string, number[]>(); // teammate -> CIR values when without Rukawa
  const wrWithMap = new Map<string, { games: number; wins: number }>(); // teammate -> WR when with Rukawa
  const wrWithoutMap = new Map<string, { games: number; wins: number }>(); // teammate -> WR when without Rukawa
  const stack3Map = new Map<
    string,
    { games: number; wins: number; cirDiffs: number[] }
  >();
  const stack5Map = new Map<
    string,
    { games: number; wins: number; cirDiffs: number[] }
  >();
  const roleMap = new Map<
    string,
    { games: number; totalCir: number; wins: number }
  >();

  let lpDonated = 0;
  let totalSeasonGames = 0;
  const lowestCirMatches: string[] = [];

  // Initialize synergy map
  teammates.forEach((t) => {
    synergyMap.set(t.puuid, { games: 0, wins: 0 });
    cirWithMap.set(t.puuid, []);
    cirWithoutMap.set(t.puuid, []);
    wrWithMap.set(t.puuid, { games: 0, wins: 0 });
    wrWithoutMap.set(t.puuid, { games: 0, wins: 0 });
  });

  // Process Rukawa's matches
  for (const row of rukawaMatchesRes.rows) {
    const match = JSON.parse(row.data as string) as Match;

    if (
      match.info.gameStartTimestamp < SEASON_START_EPOCH ||
      match.info.queueId !== QUEUE_FLEX ||
      isRemake(match.info.gameDuration)
    ) {
      continue;
    }

    const matchId = match.metadata.matchId;
    const groupPlayers = groupMatchMap.get(matchId) || [];
    const rukawaPart = match.info.participants.find(
      (p) => p.puuid === RUKAWA_PUUID,
    );

    if (!rukawaPart) continue;

    totalSeasonGames++;
    const durationMin = match.info.gameDuration / 60;

    // Calculate Rukawa's CIR
    const teamKills = match.info.participants
      .filter((p) => p.teamId === rukawaPart.teamId)
      .reduce((sum, p) => sum + p.kills, 0);
    const teamTotalDmg = match.info.participants
      .filter((p) => p.teamId === rukawaPart.teamId)
      .reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
    const maxGPM = Math.max(
      ...match.info.participants.map((p) => p.goldEarned / durationMin),
    );
    const opponent = match.info.participants.find(
      (p) =>
        p.teamId !== rukawaPart.teamId &&
        p.teamPosition === rukawaPart.teamPosition,
    );

    const rukawaCir = computeCIR_v3({
      kills: rukawaPart.kills,
      deaths: rukawaPart.deaths,
      assists: rukawaPart.assists,
      killParticipation:
        teamKills > 0
          ? ((rukawaPart.kills + rukawaPart.assists) / teamKills) * 100
          : 0,
      visionPerMin: rukawaPart.visionScore / durationMin,
      dmgToObjectives: rukawaPart.damageDealtToObjectives ?? 0,
      firstBloodParticipation:
        rukawaPart.firstBloodKill || rukawaPart.firstBloodAssist ? 100 : 0,
      goldPerMin: rukawaPart.goldEarned / durationMin,
      csPerMin:
        (rukawaPart.totalMinionsKilled + rukawaPart.neutralMinionsKilled) /
        durationMin,
      goldLead: opponent ? rukawaPart.goldEarned - opponent.goldEarned : 0,
      dmgPerMin: rukawaPart.totalDamageDealtToChampions / durationMin,
      dmgToBuildings: rukawaPart.damageDealtToBuildings ?? 0,
      dmgLead: opponent
        ? rukawaPart.totalDamageDealtToChampions -
          opponent.totalDamageDealtToChampions
        : 0,
      teamDamagePercent:
        teamTotalDmg > 0
          ? (rukawaPart.totalDamageDealtToChampions / teamTotalDmg) * 100
          : 0,
      maxGameGoldPerMin: maxGPM,
      teamPosition: rukawaPart.teamPosition,
    }).score;

    // Track role performance
    const role = rukawaPart.teamPosition || "UNKNOWN";
    const roleData = roleMap.get(role) || { games: 0, totalCir: 0, wins: 0 };
    roleData.games++;
    roleData.totalCir += rukawaCir;
    if (rukawaPart.win) roleData.wins++;
    roleMap.set(role, roleData);

    // LP donated (losses only)
    if (!rukawaPart.win) {
      lpDonated += 20; // Approximate LP loss per game
    }

    // Check if Rukawa had lowest CIR in the match
    let lowestCir = Infinity;
    for (const p of match.info.participants) {
      const pCir = computeCIR_v3({
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        killParticipation:
          teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0,
        visionPerMin: p.visionScore / durationMin,
        dmgToObjectives: p.damageDealtToObjectives ?? 0,
        firstBloodParticipation:
          p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
        goldPerMin: p.goldEarned / durationMin,
        csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
        goldLead: 0,
        dmgPerMin: p.totalDamageDealtToChampions / durationMin,
        dmgToBuildings: p.damageDealtToBuildings ?? 0,
        dmgLead: 0,
        teamDamagePercent:
          teamTotalDmg > 0
            ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
            : 0,
        maxGameGoldPerMin: maxGPM,
        teamPosition: p.teamPosition,
      }).score;

      if (pCir < lowestCir) lowestCir = pCir;
    }

    if (rukawaCir <= lowestCir) {
      lowestCirMatches.push(matchId);
    }

    // Process teammates in this match
    const teammatesPuuids = groupPlayers
      .map((p) => p.puuid)
      .filter((p) => p !== RUKAWA_PUUID);

    // Synergy matrix (duo combinations) and WR tracking
    teammatesPuuids.forEach((tPuuid) => {
      const synergy = synergyMap.get(tPuuid);
      if (synergy) {
        synergy.games++;
        if (rukawaPart.win) synergy.wins++;
      }

      // Track WR with Rukawa
      const wrWith = wrWithMap.get(tPuuid);
      if (wrWith) {
        wrWith.games++;
        if (rukawaPart.win) wrWith.wins++;
      }
    });

    // Calculate teammate CIRs
    for (const p of match.info.participants) {
      if (p.puuid === RUKAWA_PUUID) continue;

      const isTeammate = teammates.some((t) => t.puuid === p.puuid);
      if (!isTeammate) continue;

      const pTeamKills = match.info.participants
        .filter((pt) => pt.teamId === p.teamId)
        .reduce((sum, pt) => sum + pt.kills, 0);
      const pTeamTotalDmg = match.info.participants
        .filter((pt) => pt.teamId === p.teamId)
        .reduce((sum, pt) => sum + pt.totalDamageDealtToChampions, 0);
      const pOpponent = match.info.participants.find(
        (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
      );

      const pCir = computeCIR_v3({
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        killParticipation:
          pTeamKills > 0 ? ((p.kills + p.assists) / pTeamKills) * 100 : 0,
        visionPerMin: p.visionScore / durationMin,
        dmgToObjectives: p.damageDealtToObjectives ?? 0,
        firstBloodParticipation:
          p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
        goldPerMin: p.goldEarned / durationMin,
        csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
        goldLead: pOpponent ? p.goldEarned - pOpponent.goldEarned : 0,
        dmgPerMin: p.totalDamageDealtToChampions / durationMin,
        dmgToBuildings: p.damageDealtToBuildings ?? 0,
        dmgLead: pOpponent
          ? p.totalDamageDealtToChampions -
            pOpponent.totalDamageDealtToChampions
          : 0,
        teamDamagePercent:
          pTeamTotalDmg > 0
            ? (p.totalDamageDealtToChampions / pTeamTotalDmg) * 100
            : 0,
        maxGameGoldPerMin: maxGPM,
        teamPosition: p.teamPosition,
      }).score;

      // Track CIR with/without Rukawa
      const playedWithRukawa = teammatesPuuids.includes(p.puuid);
      if (playedWithRukawa) {
        cirWithMap.get(p.puuid)?.push(pCir);
      }
    }

    // Stack combinations
    if (groupPlayers.length === 3) {
      const key = groupPlayers
        .map((p) => p.puuid)
        .sort()
        .join(",");
      const combo = stack3Map.get(key) || { games: 0, wins: 0, cirDiffs: [] };
      combo.games++;
      if (rukawaPart.win) combo.wins++;

      // Calculate avg CIR difference (teammates - Rukawa)
      const teammateCirs = teammatesPuuids.map((tPuuid) => {
        const p = match.info.participants.find((pt) => pt.puuid === tPuuid);
        if (!p) return 0;

        const pTeamKills = match.info.participants
          .filter((pt) => pt.teamId === p.teamId)
          .reduce((sum, pt) => sum + pt.kills, 0);
        const pTeamTotalDmg = match.info.participants
          .filter((pt) => pt.teamId === p.teamId)
          .reduce((sum, pt) => sum + pt.totalDamageDealtToChampions, 0);

        return computeCIR_v3({
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          killParticipation:
            pTeamKills > 0 ? ((p.kills + p.assists) / pTeamKills) * 100 : 0,
          visionPerMin: p.visionScore / durationMin,
          dmgToObjectives: p.damageDealtToObjectives ?? 0,
          firstBloodParticipation:
            p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
          goldPerMin: p.goldEarned / durationMin,
          csPerMin:
            (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
          goldLead: 0,
          dmgPerMin: p.totalDamageDealtToChampions / durationMin,
          dmgToBuildings: p.damageDealtToBuildings ?? 0,
          dmgLead: 0,
          teamDamagePercent:
            pTeamTotalDmg > 0
              ? (p.totalDamageDealtToChampions / pTeamTotalDmg) * 100
              : 0,
          maxGameGoldPerMin: maxGPM,
          teamPosition: p.teamPosition,
        }).score;
      });

      const avgTeammateCir =
        teammateCirs.reduce((a, b) => a + b, 0) / teammateCirs.length;
      combo.cirDiffs.push(avgTeammateCir - rukawaCir);
      stack3Map.set(key, combo);
    }

    if (groupPlayers.length >= 4) {
      const key = groupPlayers
        .map((p) => p.puuid)
        .sort()
        .join(",");
      const combo = stack5Map.get(key) || { games: 0, wins: 0, cirDiffs: [] };
      combo.games++;
      if (rukawaPart.win) combo.wins++;

      const teammateCirs = teammatesPuuids.map((tPuuid) => {
        const p = match.info.participants.find((pt) => pt.puuid === tPuuid);
        if (!p) return 0;

        const pTeamKills = match.info.participants
          .filter((pt) => pt.teamId === p.teamId)
          .reduce((sum, pt) => sum + pt.kills, 0);
        const pTeamTotalDmg = match.info.participants
          .filter((pt) => pt.teamId === p.teamId)
          .reduce((sum, pt) => sum + pt.totalDamageDealtToChampions, 0);

        return computeCIR_v3({
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          killParticipation:
            pTeamKills > 0 ? ((p.kills + p.assists) / pTeamKills) * 100 : 0,
          visionPerMin: p.visionScore / durationMin,
          dmgToObjectives: p.damageDealtToObjectives ?? 0,
          firstBloodParticipation:
            p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
          goldPerMin: p.goldEarned / durationMin,
          csPerMin:
            (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
          goldLead: 0,
          dmgPerMin: p.totalDamageDealtToChampions / durationMin,
          dmgToBuildings: p.damageDealtToBuildings ?? 0,
          dmgLead: 0,
          teamDamagePercent:
            pTeamTotalDmg > 0
              ? (p.totalDamageDealtToChampions / pTeamTotalDmg) * 100
              : 0,
          maxGameGoldPerMin: maxGPM,
          teamPosition: p.teamPosition,
        }).score;
      });

      const avgTeammateCir =
        teammateCirs.reduce((a, b) => a + b, 0) / teammateCirs.length;
      combo.cirDiffs.push(avgTeammateCir - rukawaCir);
      stack5Map.set(key, combo);
    }
  }

  // Get CIR without Rukawa for each teammate
  for (const teammate of teammates) {
    const teammateMatchesRes = await db.execute({
      sql: `SELECT DISTINCT m.match_id, m.data FROM matches m
            JOIN player_matches pm ON pm.match_id = m.match_id
            WHERE pm.puuid = ?
            ORDER BY pm.played_at DESC`,
      args: [teammate.puuid],
    });

    for (const row of teammateMatchesRes.rows) {
      const match = JSON.parse(row.data as string) as Match;

      if (
        match.info.gameStartTimestamp < SEASON_START_EPOCH ||
        match.info.queueId !== QUEUE_FLEX ||
        isRemake(match.info.gameDuration)
      ) {
        continue;
      }

      const matchId = match.metadata.matchId;
      const groupPlayers = groupMatchMap.get(matchId) || [];
      const playedWithRukawa = groupPlayers.some(
        (p) => p.puuid === RUKAWA_PUUID,
      );

      if (playedWithRukawa) continue; // Skip matches with Rukawa

      const p = match.info.participants.find(
        (pt) => pt.puuid === teammate.puuid,
      );
      if (!p) continue;

      const durationMin = match.info.gameDuration / 60;
      const pTeamKills = match.info.participants
        .filter((pt) => pt.teamId === p.teamId)
        .reduce((sum, pt) => sum + pt.kills, 0);
      const pTeamTotalDmg = match.info.participants
        .filter((pt) => pt.teamId === p.teamId)
        .reduce((sum, pt) => sum + pt.totalDamageDealtToChampions, 0);
      const maxGPM = Math.max(
        ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
      );
      const pOpponent = match.info.participants.find(
        (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
      );

      const pCir = computeCIR_v3({
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        killParticipation:
          pTeamKills > 0 ? ((p.kills + p.assists) / pTeamKills) * 100 : 0,
        visionPerMin: p.visionScore / durationMin,
        dmgToObjectives: p.damageDealtToObjectives ?? 0,
        firstBloodParticipation:
          p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
        goldPerMin: p.goldEarned / durationMin,
        csPerMin: (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
        goldLead: pOpponent ? p.goldEarned - pOpponent.goldEarned : 0,
        dmgPerMin: p.totalDamageDealtToChampions / durationMin,
        dmgToBuildings: p.damageDealtToBuildings ?? 0,
        dmgLead: pOpponent
          ? p.totalDamageDealtToChampions -
            pOpponent.totalDamageDealtToChampions
          : 0,
        teamDamagePercent:
          pTeamTotalDmg > 0
            ? (p.totalDamageDealtToChampions / pTeamTotalDmg) * 100
            : 0,
        maxGameGoldPerMin: maxGPM,
        teamPosition: p.teamPosition,
      }).score;

      cirWithoutMap.get(teammate.puuid)?.push(pCir);

      // Track WR without Rukawa
      const wrWithout = wrWithoutMap.get(teammate.puuid);
      if (wrWithout) {
        wrWithout.games++;
        if (p.win) wrWithout.wins++;
      }
    }
  }

  // Build synergy matrix
  const synergyMatrix: SynergyData[] = teammates.map((t) => {
    const synergy = synergyMap.get(t.puuid)!;
    return {
      teammate: t.gameName,
      puuid: t.puuid,
      gamesWithRukawa: synergy.games,
      winsWithRukawa: synergy.wins,
      winrateWithRukawa:
        synergy.games > 0 ? (synergy.wins / synergy.games) * 100 : 0,
    };
  });

  // Build Rukawa Tax
  const rukawaTax: RukawaTaxData[] = teammates.map((t) => {
    const cirWith = cirWithMap.get(t.puuid) || [];
    const cirWithout = cirWithoutMap.get(t.puuid) || [];

    const avgWith =
      cirWith.length > 0
        ? cirWith.reduce((a, b) => a + b, 0) / cirWith.length
        : 0;
    const avgWithout =
      cirWithout.length > 0
        ? cirWithout.reduce((a, b) => a + b, 0) / cirWithout.length
        : 0;

    return {
      teammate: t.gameName,
      puuid: t.puuid,
      avgCirWithRukawa: avgWith,
      avgCirWithoutRukawa: avgWithout,
      cirDrain: avgWithout - avgWith,
    };
  });

  // Build stack combos
  const stack3Combos: StackCombo[] = Array.from(stack3Map.entries())
    .map(([key, data]) => {
      const puuids = key.split(",");
      const players = puuids.map(
        (p) => users.find((u) => u.puuid === p)?.gameName || "Unknown",
      );
      const avgCirDiff =
        data.cirDiffs.reduce((a, b) => a + b, 0) / data.cirDiffs.length;

      return {
        players,
        puuids,
        games: data.games,
        wins: data.wins,
        winrate: data.games > 0 ? (data.wins / data.games) * 100 : 0,
        avgCirDifference: avgCirDiff,
      };
    })
    .sort((a, b) => b.winrate - a.winrate);

  const stack5Combos: StackCombo[] = Array.from(stack5Map.entries())
    .map(([key, data]) => {
      const puuids = key.split(",");
      const players = puuids.map(
        (p) => users.find((u) => u.puuid === p)?.gameName || "Unknown",
      );
      const avgCirDiff =
        data.cirDiffs.reduce((a, b) => a + b, 0) / data.cirDiffs.length;

      return {
        players,
        puuids,
        games: data.games,
        wins: data.wins,
        winrate: data.games > 0 ? (data.wins / data.games) * 100 : 0,
        avgCirDifference: avgCirDiff,
      };
    })
    .sort((a, b) => b.winrate - a.winrate);

  // Build role performance
  const rolePerformance: RolePerformance[] = Array.from(roleMap.entries()).map(
    ([role, data]) => ({
      role,
      games: data.games,
      avgCir: data.games > 0 ? data.totalCir / data.games : 0,
      winrate: data.games > 0 ? (data.wins / data.games) * 100 : 0,
    }),
  );

  // Build WR impact
  const winrateImpact: WinrateImpactData[] = teammates.map((t) => {
    const wrWith = wrWithMap.get(t.puuid)!;
    const wrWithout = wrWithoutMap.get(t.puuid)!;

    const wrWithRukawa =
      wrWith.games > 0 ? (wrWith.wins / wrWith.games) * 100 : 0;
    const wrWithoutRukawa =
      wrWithout.games > 0 ? (wrWithout.wins / wrWithout.games) * 100 : 0;

    return {
      teammate: t.gameName,
      puuid: t.puuid,
      wrWithRukawa,
      wrWithoutRukawa,
      wrDrain: wrWithoutRukawa - wrWithRukawa,
      gamesWithRukawa: wrWith.games,
      gamesWithoutRukawa: wrWithout.games,
    };
  });

  return {
    synergyMatrix,
    rukawaTax,
    winrateImpact,
    stack3Combos,
    stack5Combos,
    rolePerformance,
    lpDonated,
    lowestCirMatches,
    totalSeasonGames,
  };
}
