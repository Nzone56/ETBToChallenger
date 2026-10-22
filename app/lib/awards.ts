import { unstable_cache } from "next/cache";
import { getDb, ensureSchema, DB_TAG } from "./db";
import { SEASON_START_EPOCH, QUEUE_FLEX } from "../data/constants";
import { users } from "../data/users";
import { Match } from "../types/riot";
import { computeParticipantCir } from "./cir";
import { isRemake } from "./format";

/** Games a player needs in a role to be nominated for it. */
export const ROLE_AWARD_MIN_GAMES = 15;
/** Games a player needs on a champion, in one role, for a signature-pick nomination. */
export const PICK_AWARD_MIN_GAMES = 5;
/** Weight of avg CIR in the performance score; win rate takes the rest. */
export const AWARD_CIR_WEIGHT = 0.7;
/**
 * Confidence priors: before scoring, a nominee's averages are blended with the
 * roster's season average as if they had played this many extra, perfectly
 * average games. A 5–0 run is pulled hard toward the middle; a 40-game sample
 * barely moves. Picks qualify with fewer games, so they get the stronger
 * prior. Without it the top of every list was 5-game samples.
 */
export const AWARD_PRIOR_GAMES = { role: 10, pick: 15 } as const;

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
type AwardRole = (typeof ROLES)[number];

function isAwardRole(role: string): role is AwardRole {
  return (ROLES as readonly string[]).includes(role);
}

// Weighted Performance Score: (avgCIR × 0.7) + (WR × 0.3)
export function calculatePerformanceScore(avgCir: number, winrate: number): number {
  return avgCir * AWARD_CIR_WEIGHT + winrate * (1 - AWARD_CIR_WEIGHT);
}

/** Pull `value` (an average over `games`) toward `prior`, weighted as `priorGames` games. */
export function shrinkToward(value: number, games: number, prior: number, priorGames: number): number {
  return (value * games + prior * priorGames) / (games + priorGames);
}

export interface PlayerRoleNominee {
  gameName: string;
  puuid: string;
  role: string;
  avgCir: number;
  winrate: number;
  totalGames: number;
  kda: number;
  avgDmgPerMin: number;
  performanceScore: number;
}

export interface SignaturePickNominee {
  gameName: string;
  puuid: string;
  championName: string;
  championId: number;
  role: string;
  avgCir: number;
  winrate: number;
  totalGames: number;
  keyStatValue: number;
  keyStatLabel: string;
  performanceScore: number;
}

type ByRole<T> = { overall: T[] } & Record<AwardRole, T[]>;

export interface AwardsData {
  playerRoleAwards: ByRole<PlayerRoleNominee>;
  signaturePickAwards: ByRole<SignaturePickNominee>;
}

interface Bucket {
  games: number;
  wins: number;
  totalCir: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDmgPerMin: number;
  totalVision: number;
}

const emptyBucket = (): Bucket => ({
  games: 0,
  wins: 0,
  totalCir: 0,
  kills: 0,
  deaths: 0,
  assists: 0,
  totalDmgPerMin: 0,
  totalVision: 0,
});

function emptyByRole<T>(): ByRole<T> {
  return { overall: [], TOP: [], JUNGLE: [], MIDDLE: [], BOTTOM: [], UTILITY: [] };
}

/** Sort each list by score; signature picks keep their top 20 per list. */
function rank<T extends { performanceScore: number }>(all: T[], byRole: ByRole<T>, limit?: number): ByRole<T> {
  const sort = (list: T[]) => {
    const sorted = [...list].sort((a, b) => b.performanceScore - a.performanceScore);
    return limit ? sorted.slice(0, limit) : sorted;
  };
  const out = emptyByRole<T>();
  out.overall = sort(all);
  for (const role of ROLES) out[role] = sort(byRole[role]);
  return out;
}

async function computeAwardsData(): Promise<AwardsData> {
  await ensureSchema();
  const db = getDb();

  // puuid → role → bucket, and puuid → "champId|role" → bucket.
  // A champion played in two roles is two different signature picks.
  const roleBuckets = new Map<string, Map<string, Bucket>>();
  const pickBuckets = new Map<string, Map<string, Bucket & { championName: string; championId: number; role: string }>>();
  const season = emptyBucket();

  for (const user of users) {
    const roleMap = new Map<string, Bucket>();
    const pickMap = new Map<string, Bucket & { championName: string; championId: number; role: string }>();
    roleBuckets.set(user.puuid, roleMap);
    pickBuckets.set(user.puuid, pickMap);

    const res = await db.execute({
      sql: `SELECT DISTINCT m.match_id, m.data FROM matches m
            JOIN player_matches pm ON pm.match_id = m.match_id
            WHERE pm.puuid = ?`,
      args: [user.puuid],
    });

    for (const row of res.rows) {
      const match = JSON.parse(row.data as string) as Match;
      if (
        match.info.gameStartTimestamp < SEASON_START_EPOCH ||
        match.info.queueId !== QUEUE_FLEX ||
        isRemake(match.info.gameDuration)
      ) {
        continue;
      }
      const p = match.info.participants.find((pt) => pt.puuid === user.puuid);
      if (!p) continue;

      const role = p.teamPosition || "UNKNOWN";
      const cir = computeParticipantCir(match, p).score;
      const dmgPerMin = p.totalDamageDealtToChampions / (match.info.gameDuration / 60);

      const pickKey = `${p.championId}|${role}`;
      if (!roleMap.has(role)) roleMap.set(role, emptyBucket());
      if (!pickMap.has(pickKey)) {
        pickMap.set(pickKey, { ...emptyBucket(), championName: p.championName, championId: p.championId, role });
      }

      for (const b of [roleMap.get(role)!, pickMap.get(pickKey)!, season]) {
        b.games++;
        if (p.win) b.wins++;
        b.totalCir += cir;
        b.kills += p.kills;
        b.deaths += p.deaths;
        b.assists += p.assists;
        b.totalDmgPerMin += dmgPerMin;
        b.totalVision += p.visionScore;
      }
    }
  }

  // The prior every nominee is pulled toward: the whole roster's season.
  const priorCir = season.games > 0 ? season.totalCir / season.games : 0;
  const priorWr = season.games > 0 ? (season.wins / season.games) * 100 : 50;
  const score = (b: Bucket, priorGames: number) =>
    calculatePerformanceScore(
      shrinkToward(b.totalCir / b.games, b.games, priorCir, priorGames),
      shrinkToward((b.wins / b.games) * 100, b.games, priorWr, priorGames),
    );

  // Player awards: one nomination per qualifying role, so a player can be
  // nominated for MVP up to five times.
  const roleNominees = emptyByRole<PlayerRoleNominee>();
  const allRoleNominees: PlayerRoleNominee[] = [];
  for (const user of users) {
    for (const [role, b] of roleBuckets.get(user.puuid)!) {
      if (b.games < ROLE_AWARD_MIN_GAMES || !isAwardRole(role)) continue;
      const nominee: PlayerRoleNominee = {
        gameName: user.gameName,
        puuid: user.puuid,
        role,
        avgCir: b.totalCir / b.games,
        winrate: (b.wins / b.games) * 100,
        totalGames: b.games,
        kda: b.deaths > 0 ? (b.kills + b.assists) / b.deaths : b.kills + b.assists,
        avgDmgPerMin: b.totalDmgPerMin / b.games,
        performanceScore: score(b, AWARD_PRIOR_GAMES.role),
      };
      allRoleNominees.push(nominee);
      roleNominees[role].push(nominee);
    }
  }

  // Signature picks: one champion in one role.
  const pickNominees = emptyByRole<SignaturePickNominee>();
  const allPickNominees: SignaturePickNominee[] = [];
  for (const user of users) {
    for (const b of pickBuckets.get(user.puuid)!.values()) {
      if (b.games < PICK_AWARD_MIN_GAMES || !isAwardRole(b.role)) continue;
      const support = b.role === "UTILITY";
      const nominee: SignaturePickNominee = {
        gameName: user.gameName,
        puuid: user.puuid,
        championName: b.championName,
        championId: b.championId,
        role: b.role,
        avgCir: b.totalCir / b.games,
        winrate: (b.wins / b.games) * 100,
        totalGames: b.games,
        keyStatValue: support ? b.totalVision / b.games : b.totalDmgPerMin / b.games,
        keyStatLabel: support ? "Avg Vision Score" : "Avg Damage Per Min",
        performanceScore: score(b, AWARD_PRIOR_GAMES.pick),
      };
      allPickNominees.push(nominee);
      pickNominees[b.role].push(nominee);
    }
  }

  return {
    playerRoleAwards: rank(allRoleNominees, roleNominees),
    signaturePickAwards: rank(allPickNominees, pickNominees, 20),
  };
}

// One pass over every season match — cached with the other DB reads and
// invalidated by the same tag after each sync. The tuning is part of the key,
// so changing a prior recomputes immediately instead of serving old scores.
export const getAwardsData = unstable_cache(
  computeAwardsData,
  ["awards-data", `prior-${AWARD_PRIOR_GAMES.role}-${AWARD_PRIOR_GAMES.pick}`],
  { tags: [DB_TAG], revalidate: 900 },
);
