# ETB to Challenger

A **Next.js 16** site that follows seven friends (`#ETB`) on their climb to Challenger in **Ranked Flex**. Match data is synced from the Riot Games API into Turso and presented as a dashboard, player profiles, team analytics, season records and awards — in a dark, desktop-first "Hextech ledger" design.

## Sections

- **Dashboard** (`/`) — team average on the ladder with every player pinned on an Iron → Challenger track; LP and wins still needed; one **Standings** table (rank, ladder LP, record, last game with CIR) filterable by role or stack size; CIR leaders per role; the **Divas** (who keeps queueing alone); best and worst of the challenge across 17 categories.
- **Player** (`/player/[name]`) — splash-art banner with rank, winrate, CIR and KDA; role split; playstyle radar; season averages; champion pool; filterable, paginated match history.
- **Match** (`/match/[id]`) — scoreline, MVP, both scoreboards with per-player CIR and items, team comparison.
- **Team** (`/team`) — team and stacked-game totals, signature champions, best possible roster, final and internal rankings, every stacked game. `?view=rukawa` opens **The Rukawa Files**.
- **Records** (`/records`) — single-game records and anti-records, pentakills; `?tab=cir` top/worst 15 CIR games per role; `?tab=delta` biggest CIR gaps vs team and lane.
- **Awards** (`/awards`) — nominations per role and signature picks with podiums; `?tab=winners` the live frontrunners. Voting opens at season end.

## Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Framework | Next.js 16 (App Router, Turbopack, React 19)           |
| Language  | TypeScript                                             |
| Styling   | Tailwind CSS 4 with design tokens in `app/globals.css` |
| Fonts     | Geist, Geist Mono, Chakra Petch (`app/fonts.ts`)       |
| Icons     | lucide-react                                           |
| Data      | Turso (libSQL) ← Riot API (Account, League, Match V5)  |
| Assets    | DDragon (champions, items, profile icons, splash art)  |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm test
```

`.env` (no quotes around values):

```env
RIOT_API_KEY=RGAPI-…
TURSO_DATABASE_URL=libsql://…
TURSO_AUTH_TOKEN=…
```

Without `TURSO_DATABASE_URL` the app uses a local SQLite file (`data/cache.db`).

## Documentation

| Document                                     | What's in it                                          |
| -------------------------------------------- | ----------------------------------------------------- |
| [CLAUDE.md](./CLAUDE.md)                     | Project rules: architecture, design system, conventions |
| [Architecture](./docs/architecture.md)       | Routes, data flow, caching                             |
| [Components](./docs/components.md)           | UI primitives and feature components                   |
| [Database](./docs/database.md)               | Turso schema and sync                                  |
| [Riot API](./docs/riot-api.md)               | Endpoints, rate limits, season filtering               |
| [Data & Constants](./docs/data-constants.md) | LP math, tier colours, season config                   |
| [Match Details](./docs/match-details.md)     | The match page                                         |
| [Adding Players](./docs/adding-players.md)   | Adding or removing tracked players                     |
| [Debug API](./app/api/debug/README.md)       | Diagnostic endpoints                                   |

## License

Private project — not for redistribution.
