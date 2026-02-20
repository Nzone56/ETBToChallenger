# Architecture

## Overview

ETB to Challenger is a **Next.js 16 App Router** application. All pages are **server components** by default — data is fetched on the server from a **Turso SQLite database** and passed to client components only when interactivity is needed (sorting, dropdowns, load-more).

**Data source:** All match and player data is stored in Turso DB and synced periodically via background jobs. Pages **never call the Riot API directly** — they only read from the cached database.

## Routing

| Route                | File                             | Description                                                                 |
| -------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `/`                  | `app/page.tsx`                   | Dashboard — challenge progress, best-of cards, leaderboards, player cards   |
| `/team`              | `app/team/page.tsx`              | Team analytics — stack stats, internal rankings, group match history        |
| `/player/[gameName]` | `app/player/[gameName]/page.tsx` | Player detail — full stats, champion table, role performance, match history |
| `/api/matches`       | `app/api/matches/route.ts`       | API route for client-side paginated match loading                           |

Each route segment has a `loading.tsx` that renders a spinner during server-side data fetching.

## Data Flow

```
Riot API  →  sync.ts  →  Turso DB (SQLite)  →  db.ts (cached queries)  →  Server Components
                                                                                    ↓
                                                                              helpers.ts (aggregation)
                                                                                    ↓
                                                                              Client Components (UI)
```

1. **`sync.ts`** — Background sync orchestration. Fetches match data from Riot API and stores in Turso DB. Called via `/api/sync` route.
2. **`db.ts`** — All database queries. Uses `unstable_cache` with 15-minute revalidation to minimize Turso reads. Cache is invalidated after every sync.
3. **`helpers.ts`** — Pure functions: `aggregatePlayerStats()`, `computeBestOfChallenge()`, `computeAverageElo()`, LP conversion.
4. **Server components** fetch cached data from `db.ts`, compute derived data, and pass it as props to client components.
5. **Riot API** is only called during background sync (POST `/api/sync`), never from page loads.

## Component Architecture

Components are organized by page context:

- **`components/dashboard/`** — Dashboard-specific: `ChallengeHeader`, `BestOfSection`, `Leaderboard`, `PlayerCard`, `RoleLeaderboard`
- **`components/player/`** — Player detail: `PlayerHeader`, `AggregatedStats`, `ChampionStatsTable`, `RolePerformance`, `MatchHistoryList`
- **`components/team/`** — Team analytics: `TeamOverview`, `InternalRankings`, `GroupMatchHistory`
- **`components/ui/`** — Shared/reusable: `ChampionIcon`, `KdaDisplay`, `NavHeader`, `ProgressBarSegmented`, `RankBadge`, `RankEmblem`, `Spinner`, `StatCard`, `WinrateBar`

### Client vs Server Components

Only components that need interactivity use `"use client"`:

| Client Component     | Why                               |
| -------------------- | --------------------------------- |
| `NavHeader`          | Dropdown state, router navigation |
| `ChallengeHeader`    | Expandable per-player section     |
| `ChampionStatsTable` | Column sorting                    |
| `InternalRankings`   | Sort-by toggle                    |
| `RoleLeaderboard`    | Role selector tabs                |
| `MatchHistoryList`   | Load-more pagination              |

## Database & Caching Strategy

### Turso DB (SQLite)

The app uses **Turso** (libSQL) as a cloud-hosted SQLite database for storing:

- Match details (`matches` table)
- Player-match links (`player_matches` table)
- Ranked snapshots (`ranked_snapshots` table)
- Aggregated player stats (`player_stats` table)
- Sync log (`sync_log` table)

**Environment variables:**

- `TURSO_DATABASE_URL` — Turso database URL (or `file:data/cache.db` for local dev)
- `TURSO_AUTH_TOKEN` — Turso authentication token

### 15-Minute Cache Strategy

All database queries use **Next.js `unstable_cache`** with:

- **15-minute revalidation** (`revalidate: 900`)
- **Cache tag** `"db"` — invalidated after every sync via `revalidateTag(DB_TAG, "default")`

This means:

- **10,000 page reloads within 15 minutes = 1 set of Turso queries** (not 10,000)
- All pages (`/`, `/team`, `/player/*`) share the same cached data
- After a sync completes, cache is immediately busted and fresh data is loaded on the next page visit

**Page-level ISR:**

- All pages use `export const revalidate = 900` (15-minute ISR)
- Next.js caches the entire rendered HTML for 15 minutes
- In production, this means zero server execution for cached pages

## Animations

CSS animations are defined in `globals.css`:

- **`stagger-children`** — Applied to page content wrappers; each child fades in with increasing delay.
- **`animate-fade-in`** — Single element fade-in with upward slide.
- **`animate-slide-down`** — Used for dropdown menus.
