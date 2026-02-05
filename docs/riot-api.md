# Riot API Integration

## Authentication

All Riot API requests are authenticated via the `X-Riot-Token` header. The API key is read from the `RIOT_API_KEY` environment variable in `.env`.

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

## Caching Strategy

Next.js `fetch` with `next: { revalidate }` is used for all Riot API calls. Each data type has a different cache duration based on how often it changes:

| Data Type           | Cache Duration    | Rationale                                                              |
| ------------------- | ----------------- | ---------------------------------------------------------------------- |
| **DDragon version** | 1 hour (3600s)    | Game patches are infrequent                                            |
| **Summoner data**   | 1 hour (3600s)    | Profile icons rarely change                                            |
| **Ranked entries**  | 2 minutes (120s)  | LP/rank changes after every game                                       |
| **Match IDs**       | 5 minutes (300s)  | New matches appear frequently                                          |
| **Match details**   | 24 hours (86400s) | Match data is **immutable** — once a game ends, its data never changes |

These values are set in `app/lib/client.ts`:

```ts
riotFetch(url, 300); // Default: 5 min
riotFetchRanked(url); // 2 min — ranked data changes often
riotFetchMatch(url); // 24 hours — matches are immutable
```

**Page-level revalidation**: All pages export `revalidate = 120` (2 minutes). This means Next.js will serve a cached page for up to 2 minutes before regenerating it on the next request.

### How Caching Prevents Excessive Requests

When a user visits the dashboard:

1. **First visit**: All API calls are made fresh. This can be 200+ requests (7 players × ~25 matches each).
2. **Within 2 minutes**: The entire page is served from cache — **zero API requests**.
3. **After 2 minutes**: Next.js regenerates the page in the background (ISR). Ranked data is re-fetched (2-min cache expired), but match details are still cached (24-hour cache), so only ~20 new requests are made instead of 200+.

### Important: Match Details Are the Biggest Cost

Each match detail is a separate API call. With 7 players × 25 matches = 175 match detail requests on a cold start. However, since match data never changes, the 24-hour cache means these are only fetched once per day per match.

**If you see 429 (rate limited) errors**, it's likely because:

- The cache was cleared (e.g., redeployment)
- A new season started and all matches are new
- The dev server was restarted (in-memory cache lost)

## Rate Limits

Riot API keys have strict rate limits:

| Key Type        | Per Second    | Per 2 Minutes    |
| --------------- | ------------- | ---------------- |
| **Development** | 20 requests   | 100 requests     |
| **Production**  | 500+ requests | 30,000+ requests |

### Request Breakdown Per Route

| Route            | Requests (Cold)                                                                    | Requests (Warm)               |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| `/` (Dashboard)  | ~200 (7 ranked + 7 match IDs + 7 last matches + 7 summoners + ~175 season matches) | ~14 (ranked + summoners only) |
| `/team`          | ~190 (7 summoners + ~175 season matches + 7 match ID pages)                        | ~7 (summoners only)           |
| `/player/[name]` | ~30 (1 ranked + 1 summoner + ~25 match details)                                    | ~2 (ranked + summoner)        |

### Avoiding Rate Limit Issues

1. **Use a production API key** for any deployment — dev keys are too restrictive for 7+ players.
2. **Don't restart the dev server frequently** — each restart clears the fetch cache.
3. **Match details are the safest to cache aggressively** — they never change. Consider adding Redis or a database cache for match data in production.
4. **The `logApiSummary()` function** prints request counts to the server console after each dashboard load. Monitor this to understand your API usage.

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
