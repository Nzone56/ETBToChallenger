# Architecture

## Overview

ETB to Challenger is a **Next.js 16 App Router** application. All pages are **server components** by default — data is fetched on the server and passed to client components only when interactivity is needed (sorting, dropdowns, load-more).

## Routing

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Dashboard — challenge progress, best-of cards, leaderboards, player cards |
| `/team` | `app/team/page.tsx` | Team analytics — stack stats, internal rankings, group match history |
| `/player/[gameName]` | `app/player/[gameName]/page.tsx` | Player detail — full stats, champion table, role performance, match history |
| `/api/matches` | `app/api/matches/route.ts` | API route for client-side paginated match loading |

Each route segment has a `loading.tsx` that renders a spinner during server-side data fetching.

## Data Flow

```
Riot API  →  client.ts (riotFetch)  →  service.ts (orchestration)  →  Server Components
                                                                          ↓
                                                                    helpers.ts (aggregation)
                                                                          ↓
                                                                    Client Components (UI)
```

1. **`client.ts`** — Low-level fetch wrapper that attaches the API key header and tracks request counts.
2. **`endpoints.ts`** — Builds Riot API URLs for each endpoint (Account, League, Match, DDragon).
3. **`service.ts`** — High-level functions: `getDashboardData()`, `getAllSeasonMatches()`, `getPlayerFullData()`, etc.
4. **`helpers.ts`** — Pure functions: `aggregatePlayerStats()`, `computeBestOfChallenge()`, `computeAverageElo()`, LP conversion.
5. **Server components** call service functions, compute derived data, and pass it as props to client components.

## Component Architecture

Components are organized by page context:

- **`components/dashboard/`** — Dashboard-specific: `ChallengeHeader`, `BestOfSection`, `Leaderboard`, `PlayerCard`, `RoleLeaderboard`
- **`components/player/`** — Player detail: `PlayerHeader`, `AggregatedStats`, `ChampionStatsTable`, `RolePerformance`, `MatchHistoryList`
- **`components/team/`** — Team analytics: `TeamOverview`, `InternalRankings`, `GroupMatchHistory`
- **`components/ui/`** — Shared/reusable: `ChampionIcon`, `KdaDisplay`, `NavHeader`, `ProgressBarSegmented`, `RankBadge`, `RankEmblem`, `Spinner`, `StatCard`, `WinrateBar`

### Client vs Server Components

Only components that need interactivity use `"use client"`:

| Client Component | Why |
|-----------------|-----|
| `NavHeader` | Dropdown state, router navigation |
| `ChallengeHeader` | Expandable per-player section |
| `ChampionStatsTable` | Column sorting |
| `InternalRankings` | Sort-by toggle |
| `RoleLeaderboard` | Role selector tabs |
| `MatchHistoryList` | Load-more pagination |

## Caching & Revalidation

- All page-level data uses `export const revalidate = 120` (2-minute ISR).
- DDragon version is cached in-memory (`cachedVersion` in `service.ts`) with a 1-hour `next.revalidate`.
- The `/api/matches` route fetches fresh data on each request (client-side pagination).

## Animations

CSS animations are defined in `globals.css`:

- **`stagger-children`** — Applied to page content wrappers; each child fades in with increasing delay.
- **`animate-fade-in`** — Single element fade-in with upward slide.
- **`animate-slide-down`** — Used for dropdown menus.
