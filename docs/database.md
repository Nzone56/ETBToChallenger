# Database (Turso SQLite)

## Overview

The app uses **Turso** (libSQL) as a cloud-hosted SQLite database. All match and player data is stored in Turso and accessed via cached queries. Pages **never call the Riot API** — they only read from the database.

## Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

For local development without Turso, the app falls back to a local SQLite file:

```ts
const url = process.env.TURSO_DATABASE_URL ?? `file:data/cache.db`;
```

## Schema

Tables are auto-created via `initSchema()` in `app/lib/db.ts` on first startup.

### `matches`

Stores full match details from Riot API.

| Column | Type | Description |
|--------|------|-------------|
| `match_id` | TEXT PRIMARY KEY | Riot match ID (e.g., `LA1_1234567890`) |
| `data` | TEXT | Stringified JSON of full match object |
| `stored_at` | INTEGER | Unix timestamp (ms) when stored |

### `player_matches`

Links players to matches with played timestamp for sorting.

| Column | Type | Description |
|--------|------|-------------|
| `puuid` | TEXT | Player's PUUID |
| `match_id` | TEXT | Foreign key to `matches.match_id` |
| `played_at` | INTEGER | Unix timestamp (ms) when match was played |
| PRIMARY KEY | `(puuid, match_id)` | Composite key |

**Indexes:**
- `idx_player_matches_puuid` on `puuid`
- `idx_player_matches_played` on `played_at`

### `ranked_snapshots`

Stores ranked data snapshots (summoner + flex rank) for each player.

| Column | Type | Description |
|--------|------|-------------|
| `puuid` | TEXT PRIMARY KEY | Player's PUUID |
| `game_name` | TEXT | Riot ID game name |
| `tag_line` | TEXT | Riot ID tag line |
| `summoner_json` | TEXT | Stringified JSON of summoner object (name, level, icon ID) |
| `flex_entry_json` | TEXT | Stringified JSON of flex queue rank entry (tier, division, LP, wins, losses) |
| `synced_at` | INTEGER | Unix timestamp (ms) of last sync |

### `player_stats`

Stores pre-computed aggregated stats for each player.

| Column | Type | Description |
|--------|------|-------------|
| `puuid` | TEXT PRIMARY KEY | Player's PUUID |
| `game_name` | TEXT | Riot ID game name |
| `stats_json` | TEXT | Stringified JSON of `PlayerAggregatedStats` object (KDA, CS, damage, vision, winrate, champion stats, role stats, etc.) |
| `computed_at` | INTEGER | Unix timestamp (ms) when stats were computed |

### `sync_log`

Tracks last sync time and match count per player.

| Column | Type | Description |
|--------|------|-------------|
| `puuid` | TEXT PRIMARY KEY | Player's PUUID |
| `last_sync` | INTEGER | Unix timestamp (ms) of last sync |
| `match_count` | INTEGER | Total matches stored for this player |

## Caching Strategy

All database queries use **Next.js `unstable_cache`** with:

- **15-minute revalidation** (`revalidate: 900`)
- **Cache tag** `"db"` — invalidated after every sync via `revalidateTag(DB_TAG, "default")`

This means:
- **10,000 page reloads within 15 minutes = 1 set of Turso queries** (not 10,000)
- All pages (`/`, `/team`, `/player/*`) share the same cached data
- After a sync completes, cache is immediately busted and fresh data is loaded on the next page visit

## Database Functions

Located in `app/lib/db.ts`.

### Read Functions (All Cached)

| Function | Returns | Description |
|----------|---------|-------------|
| `getAllRankedSnapshots()` | `RankedSnapshot[]` | All players' ranked snapshots |
| `getRankedSnapshot(puuid)` | `RankedSnapshot \| null` | Single player's ranked snapshot |
| `getAllPlayerStats()` | `{puuid, gameName, statsJson}[]` | All players' aggregated stats |
| `getPlayerStats(puuid)` | `PlayerAggregatedStats \| null` | Single player's aggregated stats |
| `getMatchesByPuuid(puuid)` | `Match[]` | All matches for a player (descending by played_at) |
| `getLastMatchByPuuid(puuid)` | `Match \| null` | Most recent match for a player |
| `getLatestSyncedAt()` | `number \| null` | Unix timestamp of oldest player sync (used for staleness check) |
| `getLinkedMatchIds(puuid)` | `Set<string>` | Match IDs linked to a player (for deduplication during sync) |
| `getGlobalStoredMatchIds()` | `Set<string>` | All match IDs in the database (for deduplication during sync) |
| `getDbStats()` | `{matchCount, playerMatchCount, snapshotCount}` | Row counts for dashboard stats |

### Write Functions (Not Cached)

| Function | Description |
|----------|-------------|
| `storeMatches(matches)` | Batch insert match details |
| `storePlayerMatchLinks(links)` | Batch insert player-match links |
| `upsertRankedSnapshot(snap)` | Insert or update ranked snapshot |
| `upsertPlayerStats(puuid, gameName, stats)` | Insert or update aggregated stats |
| `upsertSyncLog(puuid, matchCount)` | Update sync log after successful sync |

## Sync Process

The sync job (`app/lib/sync.ts`) is triggered via `POST /api/sync` and:

1. Calls `getSyncLog(puuid)` to check if player needs sync (>15min stale)
2. Fetches ranked snapshot from Riot API (summoner + flex rank)
3. Calls `upsertRankedSnapshot()` to store it
4. Fetches match IDs from Riot API (with season start filter)
5. Calls `getLinkedMatchIds(puuid)` to get already-stored match IDs
6. Filters out duplicates (only new matches)
7. Fetches full match details for new matches from Riot API
8. Calls `storeMatches()` to batch insert match details
9. Calls `storePlayerMatchLinks()` to link matches to player
10. Aggregates stats from all matches via `aggregatePlayerStats()`
11. Calls `upsertPlayerStats()` to store aggregated stats
12. Calls `upsertSyncLog()` to record sync completion
13. After all players synced, calls `revalidateTag(DB_TAG, "default")` to bust cache

## Local Development

When `TURSO_DATABASE_URL` is not set, the app uses a local SQLite file at `data/cache.db`. This is auto-created on first run.

To reset your local database:
```powershell
Remove-Item data/cache.db
```

The next page load will create a fresh database and trigger a full sync.

## Production (Vercel)

1. Create a Turso database:
   ```bash
   turso db create etbtochallenger
   turso db show etbtochallenger --url
   turso db tokens create etbtochallenger
   ```

2. Add environment variables in Vercel:
   - `TURSO_DATABASE_URL` = output from `--url`
   - `TURSO_AUTH_TOKEN` = output from `tokens create`

3. Deploy. The schema is auto-created on first cold start via `initSchema()`.

## Monitoring

Check Turso dashboard for:
- **Reads** — should be minimal (cached for 15 min)
- **Writes** — only during sync jobs
- **Storage** — grows with match count (each match ~5-10KB)

Expected usage for 7 players with ~350 matches each:
- **Storage:** ~20-30 MB
- **Reads per 15-min window:** ~10-20 (one cache refresh)
- **Writes per sync:** ~50-200 (depending on new match count)
