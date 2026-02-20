# Riot API Integration

## Overview

**Pages never call the Riot API directly.** All match and player data is stored in Turso DB and accessed via cached database queries. The Riot API is only called during background sync jobs triggered via `POST /api/sync`.

## Authentication

All Riot API requests (from the sync job) are authenticated via the `X-Riot-Token` header. The API key is read from the `RIOT_API_KEY` environment variable in `.env`.

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> Do **not** wrap the value in quotes — Next.js includes them literally.

The fetch wrapper is in `app/lib/client.ts`. It provides three functions:

| Function          | Region   | Used For                 |
| ----------------- | -------- | ------------------------ |
| `riotFetch`       | Americas | Account, Match endpoints |
| `riotFetchRanked` | LA1      | League/Ranked endpoints  |
| `riotFetchMatch`  | Americas | Match detail endpoints   |

## Endpoints

Defined in `app/lib/endpoints.ts`:

| Endpoint                                                  | API       | Description                             |
| --------------------------------------------------------- | --------- | --------------------------------------- |
| `rankedByPuuid(puuid)`                                    | League V4 | Ranked entries (flex, solo) by PUUID    |
| `matchIdsByPuuid(puuid, queue, count, start, startTime?)` | Match V5  | Match ID list with optional time filter |
| `matchById(matchId)`                                      | Match V5  | Full match detail                       |
| `ddragonVersions()`                                       | DDragon   | Latest game version for asset URLs      |
| `championIcon(name, version)`                             | DDragon   | Champion square icon URL                |
| `profileIcon(id, version)`                                | DDragon   | Summoner profile icon URL               |

## Season Filtering

The constant `SEASON_START_EPOCH` in `app/data/constants.ts` is set to **January 8, 2026 00:00 UTC**. This is the start of the 2026 ranked season.

All match fetching uses this as the `startTime` parameter (converted to epoch seconds) so the Riot API only returns matches from the current season. This applies to:

- `getAllSeasonMatchIds()` — Paginates through all season match IDs (100 per page).
- `getAllSeasonMatches()` — Fetches all season match details.
- `/api/matches` route — Client-side "Load More" also filters by season start.

## Pagination

The Riot Match V5 API returns a maximum of 100 match IDs per request. `getAllSeasonMatchIds()` in `service.ts` loops with `start` offset until fewer than 100 IDs are returned:

```
Page 1: start=0,   count=100, startTime=SEASON_START
Page 2: start=100, count=100, startTime=SEASON_START
...until ids.length < 100
```

## Request Tracking

`client.ts` tracks every API request with category labels (`RANKED`, `MATCH_IDS`, `MATCH_DETAIL`) and logs a summary via `logApiSummary()`. This is called after dashboard data fetching to monitor API usage in the server console.

## Background Sync Strategy

The sync job (`app/lib/sync.ts`) is triggered via `POST /api/sync` and:

1. Fetches ranked snapshots for all players (summoner data + flex rank)
2. Fetches new match IDs from Riot API (with `startTime` filter for current season)
3. Fetches full match details for any new matches not already in the DB
4. Stores everything in Turso DB
5. Calls `revalidateTag("db", "default")` to bust the Next.js cache

**Auto-sync trigger:** `SyncTrigger` component fires a POST `/api/sync` when:

- The database is empty, OR
- The last sync was >15 minutes ago

**Manual sync:** Visit any page and it will auto-trigger if stale, or call `POST /api/sync` directly.

## Database Cache (Not Riot API Cache)

All database queries use **Next.js `unstable_cache`** with:

- **15-minute revalidation** (`revalidate: 900`)
- **Cache tag** `"db"` — invalidated after every sync

This means Turso DB queries are cached for 15 minutes, not Riot API calls. Riot API is only called during sync, and those calls are **not cached** — the sync always fetches fresh data from Riot and writes it to the database.

## Rate Limits

Riot API keys have strict rate limits. The sync job is designed to stay within these limits:

| Key Type        | Per Second    | Per 2 Minutes    |
| --------------- | ------------- | ---------------- |
| **Development** | 20 requests   | 100 requests     |
| **Production**  | 500+ requests | 30,000+ requests |

Use a **production API key** for deployments with 7+ players — dev keys will hit rate limits on the first sync.

## Changing API Regions

The app is currently configured for **Latin America North (LA1)** and **Americas** routing:

```ts
// app/lib/endpoints.ts
const AMERICAS = "https://americas.api.riotgames.com"; // Account, Match APIs
const LA1 = "https://la1.api.riotgames.com"; // Summoner, League APIs
```

To support a different region:

1. Change `LA1` to your regional endpoint (e.g., `na1`, `euw1`, `kr`)
2. Change `AMERICAS` to your regional routing (e.g., `europe`, `asia`)
3. See [Riot Developer Portal](https://developer.riotgames.com/docs/lol#routing-values) for the full list

## Data Types

All Riot API response types are defined in `app/types/riot.ts`:

- `LeagueEntry` — Ranked queue entry (tier, rank, LP, wins, losses)
- `Summoner` — Summoner profile (profile icon ID, summoner level)
- `Match` — Full match data (metadata + info with participants)
- `MatchParticipant` — Per-player match stats (kills, deaths, assists, damage, etc.)
- `PlayerRankedData` — Aggregated ranked info for a player (includes summoner for profile icon)
- `PlayerDashboardData` — Dashboard card data (ranked + last match)
