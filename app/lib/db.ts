import { createClient, type Client } from "@libsql/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Match } from "../types/riot";

// ─── Turso client (works locally with file: URL and on Vercel with remote URL) ───
let _client: Client | null = null;
let _schemaReady: Promise<void> | null = null;

// ─── Cache tag used by unstable_cache — revalidated from route handlers after sync ───
export const DB_TAG = "db";

export function getDb(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL ?? `file:data/cache.db`;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  _client = createClient({ url, authToken });
  return _client;
}

// Returns a promise that resolves once the schema is ready.
// Safe to call concurrently — only runs once per process.
export function ensureSchema(): Promise<void> {
  if (_schemaReady) return _schemaReady;
  _schemaReady = initSchema();
  return _schemaReady;
}

// ─── Schema init (call once at startup) ───
export async function initSchema(): Promise<void> {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS matches (
      match_id   TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      stored_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS player_matches (
      puuid      TEXT NOT NULL,
      match_id   TEXT NOT NULL,
      played_at  INTEGER NOT NULL,
      PRIMARY KEY (puuid, match_id)
    );
    CREATE TABLE IF NOT EXISTS ranked_snapshots (
      puuid           TEXT PRIMARY KEY,
      game_name       TEXT NOT NULL,
      tag_line        TEXT NOT NULL,
      summoner_json   TEXT,
      flex_entry_json TEXT,
      synced_at       INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS player_stats (
      puuid       TEXT PRIMARY KEY,
      game_name   TEXT NOT NULL,
      stats_json  TEXT NOT NULL,
      computed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_log (
      puuid       TEXT PRIMARY KEY,
      last_sync   INTEGER NOT NULL,
      match_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_player_matches_puuid   ON player_matches(puuid);
    CREATE INDEX IF NOT EXISTS idx_player_matches_played  ON player_matches(played_at);
    CREATE TABLE IF NOT EXISTS group_matches (
      match_id    TEXT PRIMARY KEY,
      match_data  TEXT NOT NULL,
      player_list TEXT NOT NULL,
      played_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_group_matches_played ON group_matches(played_at);
  `);
}

// ─── Match helpers ───

export async function getLinkedMatchIds(puuid: string): Promise<Set<string>> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT match_id FROM player_matches WHERE puuid = ?",
    args: [puuid],
  });
  return new Set(res.rows.map((r) => r.match_id as string));
}

export async function getGlobalStoredMatchIds(): Promise<Set<string>> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute("SELECT match_id FROM matches");
  return new Set(res.rows.map((r) => r.match_id as string));
}

// Large payload (5-25MB per player) — too large for unstable_cache (2MB limit).
// React cache() deduplicates within a single request.
// Cross-request caching is handled by ISR (revalidate=900) on pages that use this.
export const getMatchesByPuuid = cache(
  async (puuid: string): Promise<object[]> => {
    await ensureSchema();
    const db = getDb();
    const { SEASON_START_EPOCH, QUEUE_FLEX } =
      await import("../data/constants");
    const res = await db.execute({
      sql: `SELECT m.data FROM matches m
          JOIN player_matches pm ON pm.match_id = m.match_id
          WHERE pm.puuid = ?
          ORDER BY pm.played_at DESC`,
      args: [puuid],
    });
    // Filter for current season + Flex queue
    return res.rows
      .map((r) => JSON.parse(r.data as string))
      .filter((match: Match) => {
        return (
          match.info.gameStartTimestamp >= SEASON_START_EPOCH &&
          match.info.queueId === QUEUE_FLEX
        );
      });
  },
);

// Small payload — first N matches only, fits in unstable_cache.
// Used by player page for initial render (rest loaded via /api/matches).
const _getMatchesByPuuidPaged = unstable_cache(
  async (puuid: string, limit: number) => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT m.data FROM matches m
            JOIN player_matches pm ON pm.match_id = m.match_id
            WHERE pm.puuid = ?
            ORDER BY pm.played_at DESC
            LIMIT ?`,
      args: [puuid, limit],
    });
    return res.rows.map((r) => JSON.parse(r.data as string));
  },
  ["matches-by-puuid-paged"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getMatchesByPuuidPaged(
  puuid: string,
  limit: number,
): Promise<object[]> {
  return _getMatchesByPuuidPaged(puuid, limit);
}

const _getLastMatchByPuuid = unstable_cache(
  async (puuid: string) => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT m.data FROM matches m
            JOIN player_matches pm ON pm.match_id = m.match_id
            WHERE pm.puuid = ?
            ORDER BY pm.played_at DESC
            LIMIT 1`,
      args: [puuid],
    });
    const row = res.rows[0];
    return row ? JSON.parse(row.data as string) : null;
  },
  ["last-match-by-puuid"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getLastMatchByPuuid(
  puuid: string,
): Promise<object | null> {
  return _getLastMatchByPuuid(puuid);
}

// React cache() for request-level deduplication (similar to getMatchesByPuuid)
// Match data is static once stored, so this is safe
export const getMatchById = cache(
  async (matchId: string): Promise<object | null> => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT data FROM matches WHERE match_id = ?",
      args: [matchId],
    });
    const row = res.rows[0];
    return row ? JSON.parse(row.data as string) : null;
  },
);

export interface PentakillEvent {
  gameName: string;
  puuid: string;
  championName: string;
  pentaKills: number;
  playedAt: number;
  matchId: string;
}

const _getPentakillEvents = unstable_cache(
  async (puuids: string[]): Promise<PentakillEvent[]> => {
    await ensureSchema();
    const db = getDb();
    const { SEASON_START_EPOCH, QUEUE_FLEX } =
      await import("../data/constants");
    const events: PentakillEvent[] = [];
    for (const puuid of puuids) {
      const res = await db.execute({
        sql: `SELECT m.match_id, m.data, pm.played_at FROM matches m
              JOIN player_matches pm ON pm.match_id = m.match_id
              WHERE pm.puuid = ?
              ORDER BY pm.played_at DESC`,
        args: [puuid],
      });
      for (const row of res.rows) {
        const match = JSON.parse(row.data as string) as {
          metadata: { matchId: string };
          info: {
            gameStartTimestamp: number;
            queueId: number;
            participants: {
              puuid: string;
              pentaKills: number;
              championName: string;
              riotIdGameName?: string;
            }[];
          };
        };
        if (match.info.gameStartTimestamp < SEASON_START_EPOCH) continue;
        if (match.info.queueId !== QUEUE_FLEX) continue;
        const p = match.info.participants.find((pt) => pt.puuid === puuid);
        if (p && p.pentaKills > 0) {
          events.push({
            gameName: p.riotIdGameName ?? puuid,
            puuid,
            championName: p.championName,
            pentaKills: p.pentaKills,
            playedAt: row.played_at as number,
            matchId: match.metadata.matchId,
          });
        }
      }
    }
    events.sort((a, b) => b.playedAt - a.playedAt);
    return events;
  },
  ["pentakill-events"],
  { tags: [DB_TAG], revalidate: 900 },
);

export async function getPentakillEvents(
  puuids: string[],
): Promise<PentakillEvent[]> {
  return _getPentakillEvents(puuids);
}

export async function storeMatches(
  matches: { matchId: string; data: object; playedAt: number }[],
): Promise<void> {
  if (matches.length === 0) return;
  await ensureSchema();
  const db = getDb();
  const now = Date.now();
  const stmts = matches.map((m) => ({
    sql: "INSERT OR IGNORE INTO matches (match_id, data, stored_at) VALUES (?, ?, ?)",
    args: [m.matchId, JSON.stringify(m.data), now],
  }));
  await db.batch(stmts, "write");
}

export async function storePlayerMatchLinks(
  links: { puuid: string; matchId: string; playedAt: number }[],
): Promise<void> {
  if (links.length === 0) return;
  await ensureSchema();
  const db = getDb();
  const stmts = links.map((l) => ({
    sql: "INSERT OR IGNORE INTO player_matches (puuid, match_id, played_at) VALUES (?, ?, ?)",
    args: [l.puuid, l.matchId, l.playedAt],
  }));
  await db.batch(stmts, "write");
}

// ─── Ranked snapshot helpers ───

export interface RankedSnapshot {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerJson: string | null;
  flexEntryJson: string | null;
  syncedAt: number;
}

const _getRankedSnapshot = unstable_cache(
  async (puuid: string) => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM ranked_snapshots WHERE puuid = ?",
      args: [puuid],
    });
    const row = res.rows[0];
    if (!row) return null;
    return {
      puuid: row.puuid as string,
      gameName: row.game_name as string,
      tagLine: row.tag_line as string,
      summonerJson: row.summoner_json as string | null,
      flexEntryJson: row.flex_entry_json as string | null,
      syncedAt: row.synced_at as number,
    };
  },
  ["ranked-snapshot"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getRankedSnapshot(
  puuid: string,
): Promise<RankedSnapshot | null> {
  return _getRankedSnapshot(puuid);
}

const _getAllRankedSnapshots = unstable_cache(
  async () => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute("SELECT * FROM ranked_snapshots");
    return res.rows.map((row) => ({
      puuid: row.puuid as string,
      gameName: row.game_name as string,
      tagLine: row.tag_line as string,
      summonerJson: row.summoner_json as string | null,
      flexEntryJson: row.flex_entry_json as string | null,
      syncedAt: row.synced_at as number,
    }));
  },
  ["all-ranked-snapshots"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getAllRankedSnapshots(): Promise<RankedSnapshot[]> {
  return _getAllRankedSnapshots();
}

export async function upsertRankedSnapshot(
  snap: RankedSnapshot,
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO ranked_snapshots (puuid, game_name, tag_line, summoner_json, flex_entry_json, synced_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            game_name       = excluded.game_name,
            tag_line        = excluded.tag_line,
            summoner_json   = excluded.summoner_json,
            flex_entry_json = excluded.flex_entry_json,
            synced_at       = excluded.synced_at`,
    args: [
      snap.puuid,
      snap.gameName,
      snap.tagLine,
      snap.summonerJson,
      snap.flexEntryJson,
      snap.syncedAt,
    ],
  });
}

// ─── Player stats helpers ───

const _getPlayerStats = unstable_cache(
  async (puuid: string) => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT stats_json FROM player_stats WHERE puuid = ?",
      args: [puuid],
    });
    const row = res.rows[0];
    return row ? JSON.parse(row.stats_json as string) : null;
  },
  ["player-stats"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getPlayerStats(puuid: string): Promise<object | null> {
  return _getPlayerStats(puuid);
}

const _getAllPlayerStats = unstable_cache(
  async () => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute(
      "SELECT puuid, game_name, stats_json FROM player_stats",
    );
    return res.rows.map((r) => ({
      puuid: r.puuid as string,
      gameName: r.game_name as string,
      statsJson: r.stats_json as string,
    }));
  },
  ["all-player-stats"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getAllPlayerStats(): Promise<
  { puuid: string; gameName: string; statsJson: string }[]
> {
  return _getAllPlayerStats();
}

export async function upsertPlayerStats(
  puuid: string,
  gameName: string,
  stats: object,
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO player_stats (puuid, game_name, stats_json, computed_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            game_name   = excluded.game_name,
            stats_json  = excluded.stats_json,
            computed_at = excluded.computed_at`,
    args: [puuid, gameName, JSON.stringify(stats), Date.now()],
  });
}

// ─── Sync log helpers ───

export async function getSyncLog(
  puuid: string,
): Promise<{ lastSync: number; matchCount: number } | null> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT last_sync, match_count FROM sync_log WHERE puuid = ?",
    args: [puuid],
  });
  const row = res.rows[0];
  return row
    ? {
        lastSync: row.last_sync as number,
        matchCount: row.match_count as number,
      }
    : null;
}

export async function upsertSyncLog(
  puuid: string,
  matchCount: number,
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO sync_log (puuid, last_sync, match_count)
          VALUES (?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET last_sync = excluded.last_sync, match_count = excluded.match_count`,
    args: [puuid, Date.now(), matchCount],
  });
}

const _getLatestSyncedAt = unstable_cache(
  async () => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute("SELECT MIN(last_sync) as t FROM sync_log");
    const row = res.rows[0];
    return row ? (row.t as number | null) : null;
  },
  ["latest-synced-at"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getLatestSyncedAt(): Promise<number | null> {
  return _getLatestSyncedAt();
}

// ─── Group matches (precomputed during sync) ───

export interface SlimGroupMatch {
  metadata: { matchId: string };
  info: {
    gameDuration: number;
    participants: {
      puuid: string;
      win: boolean;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
    }[];
  };
}

export async function storeGroupMatches(
  entries: {
    matchId: string;
    matchData: SlimGroupMatch;
    playerList: { puuid: string; gameName: string }[];
    playedAt: number;
  }[],
): Promise<void> {
  await ensureSchema();
  if (entries.length === 0) return;
  const db = getDb();
  for (const e of entries) {
    await db.execute({
      sql: `INSERT INTO group_matches (match_id, match_data, player_list, played_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET match_data = excluded.match_data, player_list = excluded.player_list, played_at = excluded.played_at`,
      args: [
        e.matchId,
        JSON.stringify(e.matchData),
        JSON.stringify(e.playerList),
        e.playedAt,
      ],
    });
  }
}

// Slim payload after first sync (~50KB), but may be large with old full-blob rows.
// React cache() deduplicates within a single request.
// Cross-request caching handled by ISR (revalidate=900) on /team page.
const _getGroupMatchCount = unstable_cache(
  async (): Promise<number> => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute("SELECT COUNT(*) as c FROM group_matches");
    return (res.rows[0]?.c as number) ?? 0;
  },
  ["group-match-count"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getGroupMatchCount(): Promise<number> {
  return _getGroupMatchCount();
}

const _getGroupMatchWins = unstable_cache(
  async (): Promise<number> => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute(
      "SELECT match_data, player_list FROM group_matches",
    );
    let wins = 0;
    for (const row of res.rows) {
      const match = JSON.parse(row.match_data as string) as SlimGroupMatch;
      const players = JSON.parse(row.player_list as string) as {
        puuid: string;
        gameName: string;
      }[];
      if (players.length === 0) continue;
      const p = match.info.participants.find(
        (pt) => pt.puuid === players[0].puuid,
      );
      if (p?.win) wins++;
    }
    return wins;
  },
  ["group-match-wins"],
  { tags: [DB_TAG], revalidate: 900 },
);

export async function getGroupMatchWins(): Promise<number> {
  return _getGroupMatchWins();
}

export const getGroupMatches = cache(
  async (): Promise<
    { match: SlimGroupMatch; players: { puuid: string; gameName: string }[] }[]
  > => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute(
      "SELECT match_data, player_list FROM group_matches ORDER BY played_at DESC",
    );
    return res.rows.map((r) => ({
      match: JSON.parse(r.match_data as string) as SlimGroupMatch,
      players: JSON.parse(r.player_list as string) as {
        puuid: string;
        gameName: string;
      }[],
    }));
  },
);

// ─── Match Records ───

export interface MatchRecord {
  category: string;
  gameName: string;
  puuid: string;
  value: number;
  championName: string;
  playedAt: number;
  matchId: string;
  win: boolean;
  // Extra context shown in the card
  kills: number;
  deaths: number;
  assists: number;
  durationMin?: number;
  // CIR-specific
  teamPosition?: string;
  cirBreakdown?: {
    combat: number;
    utility: number;
    economy: number;
    pressure: number;
  };
  cirStats?: {
    killParticipation: number;
    visionPerMin: number;
    dmgToObjectives: number;
    firstBloodParticipation: number;
    goldPerMin: number;
    csPerMin: number;
    goldLead: number;
    dmgPerMin: number;
    dmgToBuildings: number;
    dmgLead: number;
    teamDamagePercent: number;
    maxGameGoldPerMin: number;
  };
  // Delta leaderboards context
  contextValue?: number; // Team avg CIR or opponent CIR
  playerCIR?: number; // Player's CIR for delta calculations
  opponentChampionName?: string; // Lane opponent champion (for king/gap)
  opponentPosition?: string; // Lane opponent position (for king/gap)
}

const _getMatchRecords = unstable_cache(
  async (puuids: string[]): Promise<MatchRecord[]> => {
    await ensureSchema();
    const db = getDb();
    const { SEASON_START_EPOCH, QUEUE_FLEX } =
      await import("../data/constants");

    // Track best per category: key → MatchRecord
    const best: Record<string, MatchRecord> = {};
    // Top 15 CIR performances overall + per position
    const cirAll: MatchRecord[] = [];

    function trySet(
      category: string,
      value: number,
      candidate: Omit<MatchRecord, "category" | "value">,
      higherIsBetter = true,
    ) {
      const current = best[category];
      const isBetter =
        !current ||
        (higherIsBetter ? value > current.value : value < current.value);
      if (isBetter) best[category] = { category, value, ...candidate };
    }

    for (const puuid of puuids) {
      const res = await db.execute({
        sql: `SELECT m.match_id, m.data, pm.played_at FROM matches m
              JOIN player_matches pm ON pm.match_id = m.match_id
              WHERE pm.puuid = ?
              ORDER BY pm.played_at DESC`,
        args: [puuid],
      });

      for (const row of res.rows) {
        const match = JSON.parse(row.data as string) as {
          metadata: { matchId: string };
          info: {
            gameDuration: number;
            gameStartTimestamp: number;
            queueId: number;
            participants: {
              puuid: string;
              riotIdGameName?: string;
              championName: string;
              win: boolean;
              kills: number;
              deaths: number;
              assists: number;
              totalDamageDealtToChampions: number;
              goldEarned: number;
              totalMinionsKilled: number;
              neutralMinionsKilled: number;
              teamPosition: string;
              teamId: number;
              visionScore?: number;
              damageDealtToObjectives?: number;
              damageDealtToBuildings?: number;
              firstBloodKill?: boolean;
              firstBloodAssist?: boolean;
            }[];
          };
        };

        // Season + Flex queue filter + skip remakes (<5 min)
        if (match.info.gameStartTimestamp < SEASON_START_EPOCH) continue;
        if (match.info.queueId !== QUEUE_FLEX) continue;
        if (match.info.gameDuration < 300) continue;

        const p = match.info.participants.find((pt) => pt.puuid === puuid);
        if (!p) continue;

        const durationMin = match.info.gameDuration / 60;
        const gameName = p.riotIdGameName ?? puuid;
        const base = {
          gameName,
          puuid,
          championName: p.championName,
          playedAt: row.played_at as number,
          matchId: match.metadata.matchId,
          win: p.win,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          durationMin,
        };

        trySet("Most Kills", p.kills, base);
        trySet("Most Deaths", p.deaths, base);
        trySet("Most Assists", p.assists, base);

        if (durationMin > 0) {
          const dmgPerMin = p.totalDamageDealtToChampions / durationMin;
          const goldPerMin = p.goldEarned / durationMin;
          const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
          const csPerMin = cs / durationMin;
          trySet("Highest DMG/min", dmgPerMin, base);
          trySet("Highest Gold/min", goldPerMin, base);
          trySet("Highest CS/min", csPerMin, base);
          // Worst (excl supp)
          if (p.teamPosition !== "UTILITY") {
            trySet("Lowest DMG/min", dmgPerMin, base, false);
            trySet("Lowest Gold/min", goldPerMin, base, false);
            trySet("Lowest CS/min", csPerMin, base, false);
          }
        }

        // Gold lead & DMG lead vs lane opponent (non-support only)
        if (
          p.teamPosition &&
          p.teamPosition !== "" &&
          p.teamPosition !== "UTILITY"
        ) {
          const opponent = match.info.participants.find(
            (op) =>
              op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
          );
          if (opponent) {
            const goldLead = p.goldEarned - opponent.goldEarned;
            const dmgLead =
              p.totalDamageDealtToChampions -
              opponent.totalDamageDealtToChampions;
            trySet("Highest Gold Lead", goldLead, base);
            trySet("Highest DMG Lead", dmgLead, base);
            trySet("Lowest Gold Lead", goldLead, base, false);
            trySet("Lowest DMG Lead", dmgLead, base, false);
          }
        }

        // CIR v3 — top performances
        if (durationMin > 0) {
          const { computeCIR_v3 } = await import("../lib/cir");
          const teamKills = match.info.participants
            .filter((tp) => tp.teamId === p.teamId)
            .reduce((s, tp) => s + tp.kills, 0);
          const kp =
            teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0;
          const opponent = match.info.participants.find(
            (op) =>
              op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
          );
          const goldLead = opponent ? p.goldEarned - opponent.goldEarned : 0;
          const dmgLead = opponent
            ? p.totalDamageDealtToChampions -
              opponent.totalDamageDealtToChampions
            : 0;
          const teamTotalDmg = match.info.participants
            .filter((tp) => tp.teamId === p.teamId)
            .reduce((s, tp) => s + tp.totalDamageDealtToChampions, 0);
          const teamDmgPct =
            teamTotalDmg > 0
              ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
              : 0;
          const maxGPM = Math.max(
            ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
          );
          const cirResult = computeCIR_v3({
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            killParticipation: kp,
            visionPerMin: (p.visionScore ?? 0) / durationMin,
            dmgToObjectives: p.damageDealtToObjectives ?? 0,
            firstBloodParticipation:
              p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
            goldPerMin: p.goldEarned / durationMin,
            csPerMin:
              (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
            goldLead,
            dmgPerMin: p.totalDamageDealtToChampions / durationMin,
            dmgToBuildings: p.damageDealtToBuildings ?? 0,
            dmgLead,
            teamDamagePercent: teamDmgPct,
            maxGameGoldPerMin: maxGPM,
            teamPosition: p.teamPosition,
          });
          const cirEntry: MatchRecord = {
            category: "Top CIR",
            value: cirResult.score,
            ...base,
            teamPosition: p.teamPosition,
            cirBreakdown: cirResult.breakdown,
            cirStats: {
              killParticipation: kp,
              visionPerMin: (p.visionScore ?? 0) / durationMin,
              dmgToObjectives: p.damageDealtToObjectives ?? 0,
              firstBloodParticipation:
                p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
              goldPerMin: p.goldEarned / durationMin,
              csPerMin:
                (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
              goldLead,
              dmgPerMin: p.totalDamageDealtToChampions / durationMin,
              dmgToBuildings: p.damageDealtToBuildings ?? 0,
              dmgLead,
              teamDamagePercent: teamDmgPct,
              maxGameGoldPerMin: maxGPM,
            },
          };
          cirAll.push(cirEntry);
        }
      }
    }

    // Merge: existing single-best records + top 15 + worst 10 (overall + per position)
    cirAll.sort((a, b) => b.value - a.value);
    const cirOverall = cirAll.slice(0, 15);
    const positions = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
    const cirByPos: MatchRecord[] = positions.flatMap((pos) =>
      cirAll
        .filter((r) => r.teamPosition === pos)
        .slice(0, 15)
        .map((r) => ({ ...r, category: `Top CIR ${pos}` })),
    );

    // Worst 15 — ascending sort, take bottom 15
    const cirWorstAll = [...cirAll]
      .reverse()
      .slice(0, 15)
      .map((r) => ({ ...r, category: "Worst CIR" }));
    const cirWorstByPos: MatchRecord[] = positions.flatMap((pos) =>
      cirAll
        .filter((r) => r.teamPosition === pos)
        .slice(-15)
        .reverse()
        .map((r) => ({ ...r, category: `Worst CIR ${pos}` })),
    );

    // ── NEW: CIR Delta Leaderboards ──
    const deltaRecords: MatchRecord[] = [];

    for (const puuid of puuids) {
      const res = await db.execute({
        sql: `SELECT m.match_id, m.data, pm.played_at FROM matches m
              JOIN player_matches pm ON pm.match_id = m.match_id
              WHERE pm.puuid = ?
              ORDER BY pm.played_at DESC`,
        args: [puuid],
      });

      for (const row of res.rows) {
        const match = JSON.parse(row.data as string) as Match;

        if (match.info.gameStartTimestamp < SEASON_START_EPOCH) continue;
        if (match.info.queueId !== QUEUE_FLEX) continue;
        if (match.info.gameDuration < 300) continue;

        const p = match.info.participants.find((pt) => pt.puuid === puuid);
        if (!p) continue;

        const durationMin = match.info.gameDuration / 60;
        if (durationMin <= 0) continue;

        // Calculate player's CIR
        const { computeCIR_v3 } = await import("../lib/cir");
        const teamKills = match.info.participants
          .filter((tp) => tp.teamId === p.teamId)
          .reduce((s, tp) => s + tp.kills, 0);
        const kp =
          teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0;
        const opponent = match.info.participants.find(
          (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
        );
        const goldLead = opponent ? p.goldEarned - opponent.goldEarned : 0;
        const dmgLead = opponent
          ? p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions
          : 0;
        const teamTotalDmg = match.info.participants
          .filter((tp) => tp.teamId === p.teamId)
          .reduce((s, tp) => s + tp.totalDamageDealtToChampions, 0);
        const teamDmgPct =
          teamTotalDmg > 0
            ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
            : 0;
        const maxGPM = Math.max(
          ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
        );

        const playerCIR = computeCIR_v3({
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          killParticipation: kp,
          visionPerMin: (p.visionScore ?? 0) / durationMin,
          dmgToObjectives: p.damageDealtToObjectives ?? 0,
          firstBloodParticipation:
            p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
          goldPerMin: p.goldEarned / durationMin,
          csPerMin:
            (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
          goldLead,
          dmgPerMin: p.totalDamageDealtToChampions / durationMin,
          dmgToBuildings: p.damageDealtToBuildings ?? 0,
          dmgLead,
          teamDamagePercent: teamDmgPct,
          maxGameGoldPerMin: maxGPM,
          teamPosition: p.teamPosition,
        }).score;

        // Calculate team average CIR (excluding player)
        const teammates = match.info.participants.filter(
          (tp) => tp.teamId === p.teamId && tp.puuid !== puuid,
        );
        let teamCIRSum = 0;
        for (const tm of teammates) {
          const tmTeamKills = match.info.participants
            .filter((tp) => tp.teamId === tm.teamId)
            .reduce((s, tp) => s + tp.kills, 0);
          const tmKp =
            tmTeamKills > 0 ? ((tm.kills + tm.assists) / tmTeamKills) * 100 : 0;
          const tmOpponent = match.info.participants.find(
            (op) =>
              op.teamId !== tm.teamId && op.teamPosition === tm.teamPosition,
          );
          const tmGoldLead = tmOpponent
            ? tm.goldEarned - tmOpponent.goldEarned
            : 0;
          const tmDmgLead = tmOpponent
            ? tm.totalDamageDealtToChampions -
              tmOpponent.totalDamageDealtToChampions
            : 0;

          const tmCIR = computeCIR_v3({
            kills: tm.kills,
            deaths: tm.deaths,
            assists: tm.assists,
            killParticipation: tmKp,
            visionPerMin: (tm.visionScore ?? 0) / durationMin,
            dmgToObjectives: tm.damageDealtToObjectives ?? 0,
            firstBloodParticipation:
              tm.firstBloodKill || tm.firstBloodAssist ? 100 : 0,
            goldPerMin: tm.goldEarned / durationMin,
            csPerMin:
              (tm.totalMinionsKilled + tm.neutralMinionsKilled) / durationMin,
            goldLead: tmGoldLead,
            dmgPerMin: tm.totalDamageDealtToChampions / durationMin,
            dmgToBuildings: tm.damageDealtToBuildings ?? 0,
            dmgLead: tmDmgLead,
            teamDamagePercent:
              teamTotalDmg > 0
                ? (tm.totalDamageDealtToChampions / teamTotalDmg) * 100
                : 0,
            maxGameGoldPerMin: maxGPM,
            teamPosition: tm.teamPosition,
          }).score;
          teamCIRSum += tmCIR;
        }
        const teamAvgCIR =
          teammates.length > 0 ? teamCIRSum / teammates.length : 0;
        const teamDelta = playerCIR - teamAvgCIR;

        // Calculate lane opponent CIR delta
        let laneDelta = 0;
        let opponentCIR = 0;
        if (opponent) {
          const oppTeamKills = match.info.participants
            .filter((tp) => tp.teamId === opponent.teamId)
            .reduce((s, tp) => s + tp.kills, 0);
          const oppKp =
            oppTeamKills > 0
              ? ((opponent.kills + opponent.assists) / oppTeamKills) * 100
              : 0;
          const oppTeamTotalDmg = match.info.participants
            .filter((tp) => tp.teamId === opponent.teamId)
            .reduce((s, tp) => s + tp.totalDamageDealtToChampions, 0);
          const oppTeamDmgPct =
            oppTeamTotalDmg > 0
              ? (opponent.totalDamageDealtToChampions / oppTeamTotalDmg) * 100
              : 0;

          opponentCIR = computeCIR_v3({
            kills: opponent.kills,
            deaths: opponent.deaths,
            assists: opponent.assists,
            killParticipation: oppKp,
            visionPerMin: (opponent.visionScore ?? 0) / durationMin,
            dmgToObjectives: opponent.damageDealtToObjectives ?? 0,
            firstBloodParticipation:
              opponent.firstBloodKill || opponent.firstBloodAssist ? 100 : 0,
            goldPerMin: opponent.goldEarned / durationMin,
            csPerMin:
              (opponent.totalMinionsKilled + opponent.neutralMinionsKilled) /
              durationMin,
            goldLead: -goldLead,
            dmgPerMin: opponent.totalDamageDealtToChampions / durationMin,
            dmgToBuildings: opponent.damageDealtToBuildings ?? 0,
            dmgLead: -dmgLead,
            teamDamagePercent: oppTeamDmgPct,
            maxGameGoldPerMin: maxGPM,
            teamPosition: opponent.teamPosition,
          }).score;
          laneDelta = playerCIR - opponentCIR;
        }

        const gameName = p.riotIdGameName ?? puuid;
        const base = {
          gameName,
          puuid,
          championName: p.championName,
          playedAt: row.played_at as number,
          matchId: match.metadata.matchId,
          win: p.win,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          durationMin,
          teamPosition: p.teamPosition,
        };

        // Store delta records with context
        deltaRecords.push({
          ...base,
          category: "1vs9 GOAT",
          value: teamDelta,
          contextValue: teamAvgCIR,
          playerCIR,
        });
        deltaRecords.push({
          ...base,
          category: "Dead Weight Anchor",
          value: teamDelta,
          contextValue: teamAvgCIR,
          playerCIR,
        });
        if (opponent) {
          deltaRecords.push({
            ...base,
            category: "Lane Dominator King",
            value: laneDelta,
            contextValue: opponentCIR,
            playerCIR,
            opponentChampionName: opponent.championName,
            opponentPosition: opponent.teamPosition,
          });
          deltaRecords.push({
            ...base,
            category: "Diffed Gap",
            value: laneDelta,
            contextValue: opponentCIR,
            playerCIR,
            opponentChampionName: opponent.championName,
            opponentPosition: opponent.teamPosition,
          });
        }
      }
    }

    // Extract top 10 for each delta category
    const titanRecords = deltaRecords
      .filter((r) => r.category === "1vs9 GOAT")
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const anchorRecords = deltaRecords
      .filter((r) => r.category === "Dead Weight Anchor")
      .sort((a, b) => a.value - b.value)
      .slice(0, 10);
    const kingRecords = deltaRecords
      .filter((r) => r.category === "Lane Dominator King")
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const gapRecords = deltaRecords
      .filter((r) => r.category === "Diffed Gap")
      .sort((a, b) => a.value - b.value)
      .slice(0, 10);

    return [
      ...Object.values(best),
      ...cirOverall,
      ...cirByPos,
      ...cirWorstAll,
      ...cirWorstByPos,
      ...titanRecords,
      ...anchorRecords,
      ...kingRecords,
      ...gapRecords,
    ];
  },
  ["match-records"],
  { tags: [DB_TAG], revalidate: 900 },
);

export async function getMatchRecords(
  puuids: string[],
): Promise<MatchRecord[]> {
  return _getMatchRecords(puuids);
}

// ─── CIR role averages ───

export interface CirRoleEntry {
  gameName: string;
  puuid: string;
  position: string;
  avgCir: number;
  games: number;
}

const _getCirRoleAverages = unstable_cache(
  async (puuids: string[]): Promise<CirRoleEntry[]> => {
    await ensureSchema();
    const db = getDb();
    const { SEASON_START_EPOCH, QUEUE_FLEX } =
      await import("../data/constants");
    const { computeCIR_v3 } = await import("../lib/cir");

    // gameName+position → { sum, count }
    const acc = new Map<
      string,
      { gameName: string; puuid: string; sum: number; count: number }
    >();

    for (const puuid of puuids) {
      const res = await db.execute({
        sql: `SELECT m.match_id, m.data, pm.played_at FROM matches m
              JOIN player_matches pm ON pm.match_id = m.match_id
              WHERE pm.puuid = ?
              ORDER BY pm.played_at DESC`,
        args: [puuid],
      });

      for (const row of res.rows) {
        const match = JSON.parse(row.data as string) as {
          metadata: { matchId: string };
          info: {
            gameDuration: number;
            gameStartTimestamp: number;
            queueId: number;
            participants: {
              puuid: string;
              riotIdGameName?: string;
              championName: string;
              win: boolean;
              kills: number;
              deaths: number;
              assists: number;
              totalDamageDealtToChampions: number;
              goldEarned: number;
              totalMinionsKilled: number;
              neutralMinionsKilled: number;
              teamPosition: string;
              teamId: number;
              visionScore?: number;
              damageDealtToObjectives?: number;
              damageDealtToBuildings?: number;
              firstBloodKill?: boolean;
              firstBloodAssist?: boolean;
            }[];
          };
        };

        if (match.info.gameStartTimestamp < SEASON_START_EPOCH) continue;
        if (match.info.queueId !== QUEUE_FLEX) continue;
        if (match.info.gameDuration < 300) continue; // skip remakes (<5 min)

        const p = match.info.participants.find((pt) => pt.puuid === puuid);
        if (!p || !p.teamPosition) continue;

        const durationMin = match.info.gameDuration / 60;
        if (durationMin <= 0) continue;

        const gameName = p.riotIdGameName ?? puuid;
        const teamKills = match.info.participants
          .filter((tp) => tp.teamId === p.teamId)
          .reduce((s, tp) => s + tp.kills, 0);
        const kp =
          teamKills > 0 ? ((p.kills + p.assists) / teamKills) * 100 : 0;
        const opponent = match.info.participants.find(
          (op) => op.teamId !== p.teamId && op.teamPosition === p.teamPosition,
        );
        const goldLead = opponent ? p.goldEarned - opponent.goldEarned : 0;
        const dmgLead = opponent
          ? p.totalDamageDealtToChampions - opponent.totalDamageDealtToChampions
          : 0;
        const teamTotalDmg = match.info.participants
          .filter((tp) => tp.teamId === p.teamId)
          .reduce((s, tp) => s + tp.totalDamageDealtToChampions, 0);
        const teamDmgPct =
          teamTotalDmg > 0
            ? (p.totalDamageDealtToChampions / teamTotalDmg) * 100
            : 0;
        const maxGPM = Math.max(
          ...match.info.participants.map((pt) => pt.goldEarned / durationMin),
        );

        const cirResult = computeCIR_v3({
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          killParticipation: kp,
          visionPerMin: (p.visionScore ?? 0) / durationMin,
          dmgToObjectives: p.damageDealtToObjectives ?? 0,
          firstBloodParticipation:
            p.firstBloodKill || p.firstBloodAssist ? 100 : 0,
          goldPerMin: p.goldEarned / durationMin,
          csPerMin:
            (p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin,
          goldLead,
          dmgPerMin: p.totalDamageDealtToChampions / durationMin,
          dmgToBuildings: p.damageDealtToBuildings ?? 0,
          dmgLead,
          teamDamagePercent: teamDmgPct,
          maxGameGoldPerMin: maxGPM,
          teamPosition: p.teamPosition,
        });

        const key = `${puuid}::${p.teamPosition}`;
        const entry = acc.get(key) ?? { gameName, puuid, sum: 0, count: 0 };
        entry.sum += cirResult.score;
        entry.count += 1;
        acc.set(key, entry);
      }
    }

    return Array.from(acc.entries()).map(
      ([key, { gameName, puuid, sum, count }]) => {
        const position = key.split("::")[1];
        return { gameName, puuid, position, avgCir: sum / count, games: count };
      },
    );
  },
  ["cir-role-averages"],
  { tags: [DB_TAG], revalidate: 900 },
);

export async function getCirRoleAverages(
  puuids: string[],
): Promise<CirRoleEntry[]> {
  return _getCirRoleAverages(puuids);
}

export interface LoneWolfEntry {
  puuid: string;
  gameName: string;
  soloGames: number; // only this challenge player in the match
  duoGames: number; // exactly 2 challenge players in the match
  score: number; // soloGames * 5 + duoGames * 1
  profileIconId?: number | null;
}

const _getLoneWolfStats = unstable_cache(
  async (puuids: string[]): Promise<LoneWolfEntry[]> => {
    await ensureSchema();
    const db = getDb();
    const { SEASON_START_EPOCH, QUEUE_FLEX } =
      await import("../data/constants");
    const puuidSet = new Set(puuids);

    // Accumulate per-player counts
    const acc = new Map<
      string,
      {
        gameName: string;
        solo: number;
        duo: number;
        profileIconId?: number | null;
      }
    >();
    for (const puuid of puuids) {
      acc.set(puuid, { gameName: puuid, solo: 0, duo: 0 });
    }

    // Fetch all matches for all challenge players at once via group query
    const res = await db.execute(
      `SELECT DISTINCT m.match_id, m.data FROM matches m
       JOIN player_matches pm ON pm.match_id = m.match_id
       WHERE pm.puuid IN (${puuids.map(() => "?").join(",")})
       ORDER BY m.match_id`,
      puuids,
    );

    for (const row of res.rows) {
      const match = JSON.parse(row.data as string) as {
        info: {
          gameDuration: number;
          gameStartTimestamp: number;
          queueId: number;
          participants: {
            puuid: string;
            riotIdGameName?: string;
            profileIconId?: number | null;
          }[];
        };
      };

      if (match.info.gameStartTimestamp < SEASON_START_EPOCH) continue;
      if (match.info.queueId !== QUEUE_FLEX) continue;
      if (match.info.gameDuration < 300) continue; // skip remakes

      // Count how many challenge players participated
      const participatingPuuids = match.info.participants
        .filter((p) => puuidSet.has(p.puuid))
        .map((p) => p.puuid);

      const count = participatingPuuids.length;
      if (count === 0) continue;

      for (const p of match.info.participants) {
        if (!puuidSet.has(p.puuid)) continue;
        const entry = acc.get(p.puuid);
        if (!entry) continue;
        if (!entry.gameName || entry.gameName === p.puuid) {
          entry.gameName = p.riotIdGameName ?? p.puuid;
        }
        if (count === 1) entry.solo++;
        else if (count === 2) entry.duo++;
        // 3+ players together: not counted (group game)
      }
    }

    return Array.from(acc.entries()).map(
      ([puuid, { gameName, solo, duo }]) => ({
        puuid,
        gameName,
        soloGames: solo,
        duoGames: duo,
        score: solo * 5 + duo * 1,
      }),
    );
  },
  ["lone-wolf-stats"],
  { tags: [DB_TAG], revalidate: 900 },
);

export async function getLoneWolfStats(
  puuids: string[],
): Promise<LoneWolfEntry[]> {
  return _getLoneWolfStats(puuids);
}

// ─── DB stats ───

export async function getDbStats(): Promise<{
  matchCount: number;
  playerMatchCount: number;
  snapshotCount: number;
}> {
  await ensureSchema();
  const db = getDb();
  const [m, pm, s] = await Promise.all([
    db.execute("SELECT COUNT(*) as c FROM matches"),
    db.execute("SELECT COUNT(*) as c FROM player_matches"),
    db.execute("SELECT COUNT(*) as c FROM ranked_snapshots"),
  ]);
  return {
    matchCount: m.rows[0].c as number,
    playerMatchCount: pm.rows[0].c as number,
    snapshotCount: s.rows[0].c as number,
  };
}
