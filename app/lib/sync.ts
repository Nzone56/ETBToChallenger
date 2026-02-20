import { users } from "../data/users";
import { QUEUE_FLEX, SEASON_START_EPOCH } from "../data/constants";
import { riotFetch, riotFetchMatch } from "./client";
import { riotEndpoints } from "./endpoints";
import {
  getLinkedMatchIds,
  getGlobalStoredMatchIds,
  storeMatches,
  upsertRankedSnapshot,
  upsertPlayerStats,
  upsertSyncLog,
  getMatchesByPuuid,
  getDb,
} from "./db";
import { aggregatePlayerStats } from "./helpers";
import type { LeagueEntry, Match, Summoner } from "../types/riot";

const SEASON_START_SECONDS = Math.floor(SEASON_START_EPOCH / 1000);
const PAGE_SIZE = 100;
const BATCH_SIZE = 10;

// ─── Rate limit: track timestamps for both windows ───
const reqTimestamps: number[] = [];
const SHORT_LIMIT = 15;
const SHORT_WINDOW = 1_000;
const LONG_LIMIT = 90;
const LONG_WINDOW = 120_000;

async function throttle(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (reqTimestamps.length > 0 && reqTimestamps[0] < now - LONG_WINDOW) {
      reqTimestamps.shift();
    }
    const shortCount = reqTimestamps.filter(
      (t) => t >= now - SHORT_WINDOW,
    ).length;
    const longCount = reqTimestamps.length;
    if (shortCount < SHORT_LIMIT && longCount < LONG_LIMIT) break;
    let wait = 50;
    if (shortCount >= SHORT_LIMIT) {
      const oldest = reqTimestamps.find((t) => t >= now - SHORT_WINDOW)!;
      wait = Math.max(wait, oldest + SHORT_WINDOW - now + 50);
    }
    if (longCount >= LONG_LIMIT) {
      wait = Math.max(wait, reqTimestamps[0] + LONG_WINDOW - now + 50);
    }
    await new Promise((r) => setTimeout(r, wait));
  }
  reqTimestamps.push(Date.now());
}

// ─── Riot API wrappers with clear logging ───
async function riotGet<T>(
  url: string,
  label: string,
  revalidate = 300,
): Promise<T> {
  await throttle();
  console.log(`[RIOT →] ${label}  ${url}`);
  const result = await riotFetch<T>(url, revalidate);
  console.log(`[RIOT ✓] ${label}`);
  return result;
}

async function riotGetMatch(matchId: string): Promise<Match> {
  await throttle();
  const url = riotEndpoints.matchById(matchId);
  console.log(`[RIOT →] MATCH_DETAIL  ${matchId}`);
  const result = await riotFetchMatch<Match>(url);
  console.log(`[RIOT ✓] MATCH_DETAIL  ${matchId}`);
  return result;
}

// ─── Fetch all season match IDs for a player from Riot ───
async function fetchAllMatchIds(
  puuid: string,
  gameName: string,
): Promise<string[]> {
  const all: string[] = [];
  let start = 0;
  let page = 1;
  for (;;) {
    const url = riotEndpoints.matchIdsByPuuid(
      puuid,
      QUEUE_FLEX,
      PAGE_SIZE,
      start,
      SEASON_START_SECONDS,
    );
    const ids = await riotGet<string[]>(
      url,
      `MATCH_IDS page ${page} (${gameName})`,
    );
    all.push(...ids);
    if (ids.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
    page++;
  }
  return all;
}

// ─── Sync a single player ───
// KEY LOGIC:
//   linkedIds  = match IDs already in player_matches for this puuid (already processed)
//   globalIds  = match IDs whose blob exists in matches table (any player)
//   toFetch    = riotIds NOT in globalIds  → must call Riot API
//   toLink     = riotIds IN globalIds but NOT in linkedIds → blob exists, just link
export async function syncPlayer(
  puuid: string,
): Promise<{ newMatches: number }> {
  const user = users.find((u) => u.puuid === puuid);
  if (!user) throw new Error(`Unknown puuid: ${puuid}`);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`[SYNC] Starting: ${user.gameName}`);

  // 1. Ranked + summoner (always refresh — 2 cheap Riot calls)
  const [entries, summoner] = await Promise.all([
    riotGet<LeagueEntry[]>(
      riotEndpoints.rankedByPuuid(puuid),
      `RANKED (${user.gameName})`,
      120,
    ).catch(() => [] as LeagueEntry[]),
    riotGet<Summoner>(
      riotEndpoints.summonerByPuuid(puuid),
      `SUMMONER (${user.gameName})`,
      3600,
    ).catch(() => null),
  ]);

  const flexEntry =
    entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;
  upsertRankedSnapshot({
    puuid,
    gameName: user.gameName,
    tagLine: user.tagLine,
    summonerJson: summoner ? JSON.stringify(summoner) : null,
    flexEntryJson: flexEntry ? JSON.stringify(flexEntry) : null,
    syncedAt: Date.now(),
  });
  console.log(`[DB  ✓] Upserted ranked snapshot for ${user.gameName}`);

  // 2. Get all season match IDs from Riot for this player
  const riotIds = await fetchAllMatchIds(puuid, user.gameName);

  // 3. Diff against DB
  const linkedIds = getLinkedMatchIds(puuid); // already in player_matches for this player
  const globalIds = getGlobalStoredMatchIds(); // blobs in matches table (any player)

  const toFetch = riotIds.filter((id) => !globalIds.has(id)); // need Riot API call
  const toLink = riotIds.filter(
    (id) => globalIds.has(id) && !linkedIds.has(id),
  ); // blob exists, just link
  const alreadyDone = riotIds.filter((id) => linkedIds.has(id)).length; // already linked this season

  console.log(
    `[SYNC] ${user.gameName}: ${riotIds.length} season IDs | ` +
      `${alreadyDone} up-to-date | ` +
      `${toLink.length} to link from cache | ` +
      `${toFetch.length} to fetch from Riot`,
  );

  // 4. Fetch only truly new match blobs from Riot
  const newMatches: Match[] = [];
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) => riotGetMatch(id)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") newMatches.push(r.value);
    }
  }

  // 5. Store new blobs in matches table
  if (newMatches.length > 0) {
    storeMatches(
      newMatches.map((m) => ({
        matchId: m.metadata.matchId,
        data: m,
        playedAt: m.info.gameStartTimestamp,
      })),
    );
    console.log(`[DB  ✓] Stored ${newMatches.length} new match blobs`);
  }

  // 6. Link all IDs (newly fetched + cached from other players) to this player
  const db = getDb();
  const tx = db.transaction(() => {
    const linkStmt = db.prepare(
      "INSERT OR IGNORE INTO player_matches (puuid, match_id, played_at) VALUES (?, ?, ?)",
    );
    const getBlob = db.prepare("SELECT data FROM matches WHERE match_id = ?");

    // Link newly fetched matches
    for (const m of newMatches) {
      linkStmt.run(puuid, m.metadata.matchId, m.info.gameStartTimestamp);
    }
    // Link matches already in DB from other players' syncs
    for (const id of toLink) {
      const row = getBlob.get(id) as { data: string } | undefined;
      if (row) {
        const m = JSON.parse(row.data) as Match;
        linkStmt.run(puuid, id, m.info.gameStartTimestamp);
      }
    }
  });
  tx();
  console.log(
    `[DB  ✓] Linked ${newMatches.length + toLink.length} matches to ${user.gameName} ` +
      `(${newMatches.length} new + ${toLink.length} from cache)`,
  );

  // 7. Recompute aggregated stats
  const allMatches = getMatchesByPuuid(puuid) as Match[];
  const stats = aggregatePlayerStats(puuid, allMatches);
  upsertPlayerStats(puuid, user.gameName, stats);
  console.log(
    `[DB  ✓] Recomputed stats for ${user.gameName} (${allMatches.length} matches)`,
  );

  // 8. Update sync log
  upsertSyncLog(puuid, riotIds.length);

  console.log(
    `[SYNC] Done: ${user.gameName} — fetched ${toFetch.length} from Riot, linked ${toLink.length} from cache`,
  );

  return { newMatches: toFetch.length };
}

// ─── Sync all players sequentially (to respect rate limits) ───
export async function syncAllPlayers(): Promise<{
  results: { gameName: string; newMatches: number }[];
  totalNew: number;
  riotCallsEstimate: number;
}> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`[SYNC] Starting full sync for ${users.length} players`);
  console.log(`${"═".repeat(60)}`);

  const results: { gameName: string; newMatches: number }[] = [];
  let totalNew = 0;

  for (const user of users) {
    try {
      const { newMatches } = await syncPlayer(user.puuid);
      results.push({ gameName: user.gameName, newMatches });
      totalNew += newMatches;
    } catch (err) {
      console.error(`[SYNC] ✗ Failed for ${user.gameName}:`, err);
      results.push({ gameName: user.gameName, newMatches: -1 });
    }
  }

  const riotCallsEstimate = users.length * 3 + totalNew;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[SYNC] Complete — ${totalNew} new matches fetched from Riot`);
  console.log(
    `[SYNC] Estimated Riot API calls this sync: ${riotCallsEstimate}`,
  );
  console.log(`${"═".repeat(60)}\n`);

  return { results, totalNew, riotCallsEstimate };
}
