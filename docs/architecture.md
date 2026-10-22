# Architecture

## Overview

ETB to Challenger is a **Next.js 16 App Router** app. Pages are **Server Components** that read cached data from **Turso**; client components exist only for interactivity (filters, in-panel tabs, expanders, the mobile drawer, match-history paging).

**Pages never call the Riot API.** `SyncTrigger` posts `/api/sync` when data is older than 15 minutes; the sync writes Turso and revalidates the `db` cache tag.

## Routes

| Route                | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `/`                  | Dashboard: challenge hero, Standings, CIR by role, Divas, best/worst      |
| `/player/[gameName]` | Player profile and match history                                         |
| `/match/[matchId]`   | Match scoreboards, MVP, team comparison                                  |
| `/team`              | Team analytics · `?view=rukawa` for The Rukawa Files                     |
| `/records`           | Records · `?tab=cir` CIR leaderboards · `?tab=delta` delta leaderboards  |
| `/awards`            | Nominations · `?tab=winners` live frontrunners (voting locked)           |
| `/api/matches`       | Paginated, filtered match history for the player page                   |
| `/api/sync`          | Runs the Riot → Turso sync                                               |

Page-level tabs live in the URL (`LinkTabs`), so every view is linkable. Every route has a `loading.tsx` rendering `PageSkeleton`.

## App shell

`app/layout.tsx` → `AppShell`: a fixed sidebar on desktop (sections, live roster with rank and LP, last sync time) and a top bar + drawer below `lg`. The shell awaits nothing — the roster (`RosterNav`) and sync time (`SyncStatus`) stream in behind their own `Suspense`, so navigation paints immediately.

## Data flow

```
Riot API → lib/sync.ts → Turso → lib/db.ts (unstable_cache, tag "db", 15 min)
                                     ↓
           lib/roster.ts       loadRoster(): users + ranked snapshot + stats, parsed once per request
           lib/awards.ts       getAwardsData()        (cached)
           lib/rukawaAnalytics getRukawaAnalytics()   (cached)
           lib/matchView.ts    buildMatchView(match): per-player CIR, teams, totals, MVP
           lib/lastGame.ts     summarizeLastGame(): compact last game for the dashboard
           lib/groupMatches.ts toGroupMatchRows(): compact stacked-game rows
                                     ↓
                     Server Components → client islands (plain data only)
```

- Expensive reads are wrapped in `unstable_cache` with the `db` tag. Payloads over ~2 MB (all matches of a player) use React `cache()` per request.
- Raw Riot matches (~10 KB each) are reduced on the server before reaching client components.
- Pages render on request (none are prerendered at build); freshness comes from the 15-minute `unstable_cache`.

## Turso limits

Several queries read every season match's JSON. Running many at once returns `Resource exhausted: mem_hrana_response`, so DB-backed routes are `force-dynamic` and the build never queries Turso. Cache any new "read every match" query.

## Components

Organised by feature under `app/components/` with shared primitives in `ui/` and the shell in `layout/` — see [components.md](./components.md) and the design system in `CLAUDE.md`.
