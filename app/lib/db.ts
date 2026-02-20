import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ─── DB path: project root /data/cache.db ───
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "cache.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- Raw match data (immutable once stored)
    CREATE TABLE IF NOT EXISTS matches (
      match_id   TEXT PRIMARY KEY,
      data       TEXT NOT NULL,          -- full JSON blob
      stored_at  INTEGER NOT NULL        -- unix ms
    );

    -- Which match IDs each player has played (season-filtered)
    CREATE TABLE IF NOT EXISTS player_matches (
      puuid      TEXT NOT NULL,
      match_id   TEXT NOT NULL,
      played_at  INTEGER NOT NULL,       -- gameStartTimestamp ms
      PRIMARY KEY (puuid, match_id)
    );

    -- Ranked snapshot per player (refreshed on sync)
    CREATE TABLE IF NOT EXISTS ranked_snapshots (
      puuid         TEXT PRIMARY KEY,
      game_name     TEXT NOT NULL,
      tag_line      TEXT NOT NULL,
      summoner_json TEXT,                -- Summoner object JSON
      flex_entry_json TEXT,              -- LeagueEntry JSON or NULL
      synced_at     INTEGER NOT NULL
    );

    -- Pre-computed aggregated stats per player (rebuilt after each sync)
    CREATE TABLE IF NOT EXISTS player_stats (
      puuid      TEXT PRIMARY KEY,
      game_name  TEXT NOT NULL,
      stats_json TEXT NOT NULL,          -- PlayerAggregatedStats JSON
      computed_at INTEGER NOT NULL
    );

    -- Sync log: track last sync time per player
    CREATE TABLE IF NOT EXISTS sync_log (
      puuid      TEXT PRIMARY KEY,
      last_sync  INTEGER NOT NULL,       -- unix ms
      match_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_player_matches_puuid ON player_matches(puuid);
    CREATE INDEX IF NOT EXISTS idx_player_matches_played ON player_matches(played_at);
  `);
}

// ─── Match helpers ───

// IDs already linked to this player in player_matches
export function getLinkedMatchIds(puuid: string): Set<string> {
  const db = getDb();
  const rows = db
    .prepare("SELECT match_id FROM player_matches WHERE puuid = ?")
    .all(puuid) as { match_id: string }[];
  return new Set(rows.map((r) => r.match_id));
}

// IDs whose full blob already exists in the matches table (any player)
export function getGlobalStoredMatchIds(): Set<string> {
  const db = getDb();
  const rows = db.prepare("SELECT match_id FROM matches").all() as {
    match_id: string;
  }[];
  return new Set(rows.map((r) => r.match_id));
}

// Keep old name as alias so nothing else breaks
export function getStoredMatchIds(puuid: string): Set<string> {
  return getLinkedMatchIds(puuid);
}

export function getMatchById(matchId: string): object | null {
  const db = getDb();
  const row = db
    .prepare("SELECT data FROM matches WHERE match_id = ?")
    .get(matchId) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

export function getMatchesByPuuid(puuid: string): object[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.data FROM matches m
       JOIN player_matches pm ON pm.match_id = m.match_id
       WHERE pm.puuid = ?
       ORDER BY pm.played_at DESC`,
    )
    .all(puuid) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data));
}

export function storeMatches(
  matches: { matchId: string; data: object; playedAt: number }[],
) {
  const db = getDb();
  const insertMatch = db.prepare(
    "INSERT OR IGNORE INTO matches (match_id, data, stored_at) VALUES (?, ?, ?)",
  );
  const now = Date.now();
  const tx = db.transaction(
    (items: { matchId: string; data: object; playedAt: number }[]) => {
      for (const item of items) {
        insertMatch.run(item.matchId, JSON.stringify(item.data), now);
      }
    },
  );
  tx(matches);
}

export function storePlayerMatchLinks(
  links: { puuid: string; matchId: string; playedAt: number }[],
) {
  const db = getDb();
  const insert = db.prepare(
    "INSERT OR IGNORE INTO player_matches (puuid, match_id, played_at) VALUES (?, ?, ?)",
  );
  const tx = db.transaction(
    (items: { puuid: string; matchId: string; playedAt: number }[]) => {
      for (const item of items) {
        insert.run(item.puuid, item.matchId, item.playedAt);
      }
    },
  );
  tx(links);
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

export function getRankedSnapshot(puuid: string): RankedSnapshot | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM ranked_snapshots WHERE puuid = ?")
    .get(puuid) as
    | {
        puuid: string;
        game_name: string;
        tag_line: string;
        summoner_json: string | null;
        flex_entry_json: string | null;
        synced_at: number;
      }
    | undefined;
  if (!row) return null;
  return {
    puuid: row.puuid,
    gameName: row.game_name,
    tagLine: row.tag_line,
    summonerJson: row.summoner_json,
    flexEntryJson: row.flex_entry_json,
    syncedAt: row.synced_at,
  };
}

export function getAllRankedSnapshots(): RankedSnapshot[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM ranked_snapshots").all() as {
    puuid: string;
    game_name: string;
    tag_line: string;
    summoner_json: string | null;
    flex_entry_json: string | null;
    synced_at: number;
  }[];
  return rows.map((row) => ({
    puuid: row.puuid,
    gameName: row.game_name,
    tagLine: row.tag_line,
    summonerJson: row.summoner_json,
    flexEntryJson: row.flex_entry_json,
    syncedAt: row.synced_at,
  }));
}

export function upsertRankedSnapshot(snap: RankedSnapshot) {
  const db = getDb();
  db.prepare(
    `INSERT INTO ranked_snapshots (puuid, game_name, tag_line, summoner_json, flex_entry_json, synced_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(puuid) DO UPDATE SET
       game_name = excluded.game_name,
       tag_line = excluded.tag_line,
       summoner_json = excluded.summoner_json,
       flex_entry_json = excluded.flex_entry_json,
       synced_at = excluded.synced_at`,
  ).run(
    snap.puuid,
    snap.gameName,
    snap.tagLine,
    snap.summonerJson,
    snap.flexEntryJson,
    snap.syncedAt,
  );
}

// ─── Player stats helpers ───

export function getPlayerStats(puuid: string): object | null {
  const db = getDb();
  const row = db
    .prepare("SELECT stats_json FROM player_stats WHERE puuid = ?")
    .get(puuid) as { stats_json: string } | undefined;
  return row ? JSON.parse(row.stats_json) : null;
}

export function getAllPlayerStats(): {
  puuid: string;
  gameName: string;
  statsJson: string;
}[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT puuid, game_name, stats_json FROM player_stats")
    .all() as { puuid: string; game_name: string; stats_json: string }[];
  return rows.map((r) => ({
    puuid: r.puuid,
    gameName: r.game_name,
    statsJson: r.stats_json,
  }));
}

export function upsertPlayerStats(
  puuid: string,
  gameName: string,
  stats: object,
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO player_stats (puuid, game_name, stats_json, computed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(puuid) DO UPDATE SET
       game_name = excluded.game_name,
       stats_json = excluded.stats_json,
       computed_at = excluded.computed_at`,
  ).run(puuid, gameName, JSON.stringify(stats), Date.now());
}

// ─── Sync log helpers ───

export function getSyncLog(
  puuid: string,
): { lastSync: number; matchCount: number } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT last_sync, match_count FROM sync_log WHERE puuid = ?")
    .get(puuid) as { last_sync: number; match_count: number } | undefined;
  return row ? { lastSync: row.last_sync, matchCount: row.match_count } : null;
}

export function upsertSyncLog(puuid: string, matchCount: number) {
  const db = getDb();
  db.prepare(
    `INSERT INTO sync_log (puuid, last_sync, match_count)
     VALUES (?, ?, ?)
     ON CONFLICT(puuid) DO UPDATE SET last_sync = excluded.last_sync, match_count = excluded.match_count`,
  ).run(puuid, Date.now(), matchCount);
}

// ─── Latest sync timestamp (oldest sync across all players = most stale) ───
export function getLatestSyncedAt(): number | null {
  const db = getDb();
  const row = db.prepare("SELECT MIN(last_sync) as t FROM sync_log").get() as
    | { t: number | null }
    | undefined;
  return row?.t ?? null;
}

// ─── DB stats (for debugging) ───

export function getDbStats() {
  const db = getDb();
  const matchCount = (
    db.prepare("SELECT COUNT(*) as c FROM matches").get() as { c: number }
  ).c;
  const playerMatchCount = (
    db.prepare("SELECT COUNT(*) as c FROM player_matches").get() as {
      c: number;
    }
  ).c;
  const snapshotCount = (
    db.prepare("SELECT COUNT(*) as c FROM ranked_snapshots").get() as {
      c: number;
    }
  ).c;
  return { matchCount, playerMatchCount, snapshotCount };
}
