import { createClient, type Client } from "@libsql/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

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
    const res = await db.execute({
      sql: `SELECT m.data FROM matches m
          JOIN player_matches pm ON pm.match_id = m.match_id
          WHERE pm.puuid = ?
          ORDER BY pm.played_at DESC`,
      args: [puuid],
    });
    return res.rows.map((r) => JSON.parse(r.data as string));
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

export async function storeGroupMatches(
  entries: {
    matchId: string;
    matchData: object;
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

const _getGroupMatches = unstable_cache(
  async () => {
    await ensureSchema();
    const db = getDb();
    const res = await db.execute(
      "SELECT match_data, player_list FROM group_matches ORDER BY played_at DESC",
    );
    return res.rows.map((r) => ({
      match: JSON.parse(r.match_data as string),
      players: JSON.parse(r.player_list as string) as {
        puuid: string;
        gameName: string;
      }[],
    }));
  },
  ["group-matches"],
  { tags: [DB_TAG], revalidate: 900 },
);
export async function getGroupMatches(): Promise<
  { match: object; players: { puuid: string; gameName: string }[] }[]
> {
  return _getGroupMatches();
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
