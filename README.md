# ETB to Challenger

A **Next.js 16** dashboard that tracks a group of League of Legends players on their journey from their current rank to Challenger in **Flex Queue**. It pulls live data from the Riot Games API and presents ranked progress, match statistics, and team analytics in a modern dark-themed UI.

## Features

- **Challenge Progress** — Segmented progress bar showing the team's average LP from Iron to Challenger, with expandable per-player bars and rank emblems.
- **Best of the Challenge** — Cards highlighting top performers across winrate, KDA, damage, kills, deaths, assists, kill participation, and best champion.
- **LP Leaderboard** — Players ranked by total LP with hot-streak indicators.
- **Winrate by Role** — Interactive leaderboard showing each player's winrate per role (Top, Jungle, Mid, ADC, Support).
- **Player Cards** — Quick-glance cards with rank badge, winrate, and last match info.
- **Player Detail Pages** — Full stats, sortable champion table, role performance breakdown, and paginated match history.
- **Team Analytics** — Stack winrate, internal rankings, group match history, and team signature champions with icons.
- **Season Filtering** — All stats are computed from Flex matches played since the 2026 season start (January 8, 2026). Older matches are excluded.
- **Loading States** — Spinner loading screens for every route segment.
- **Animations** — Staggered fade-in animations on page load, slide-down dropdowns, and smooth transitions throughout.

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | Next.js 16 (App Router, React 19)                |
| Language  | TypeScript                                       |
| Styling   | Tailwind CSS 4                                   |
| Icons     | Lucide React                                     |
| Data      | Riot Games API (Account V1, League V4, Match V5) |
| Assets    | DDragon (champion icons, profile icons)          |

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- A **Riot Games API key** — get one at [developer.riotgames.com](https://developer.riotgames.com)

### Installation

```bash
git clone <repo-url>
cd etbtochallenger
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
RIOT_API_KEY=RGAPI-your-key-here
```

> **Important:** Do not wrap the value in quotes — Next.js will include them literally.

### Running

```bash
npm run dev        # Development server at http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Documentation

Detailed documentation is available in the [`docs/`](./docs/) folder:

| Document                                     | Description                                                    |
| -------------------------------------------- | -------------------------------------------------------------- |
| [Architecture](./docs/architecture.md)       | Project structure, routing, and data flow                      |
| [Riot API Integration](./docs/riot-api.md)   | Endpoints, authentication, rate limiting, and season filtering |
| [Components](./docs/components.md)           | UI component reference with props                              |
| [Data & Constants](./docs/data-constants.md) | LP math, tier colors, season config, and helper functions      |
| [Adding Players](./docs/adding-players.md)   | How to add or remove tracked players                           |

## Project Structure

```
app/
├── api/matches/         # API route for paginated match loading
├── components/
│   ├── dashboard/       # ChallengeHeader, BestOfSection, Leaderboard, PlayerCard, RoleLeaderboard
│   ├── player/          # PlayerHeader, AggregatedStats, ChampionStatsTable, RolePerformance, MatchHistoryList
│   ├── team/            # TeamOverview, InternalRankings, GroupMatchHistory
│   └── ui/              # Shared: ChampionIcon, KdaDisplay, NavHeader, ProgressBarSegmented, RankBadge, RankEmblem, Spinner, StatCard, WinrateBar
├── data/
│   ├── constants.ts     # LP math, tier colors, season epoch, queue IDs
│   └── users.ts         # Tracked player list (puuids, game names)
├── lib/
│   ├── client.ts        # Riot API fetch wrapper with request tracking
│   ├── endpoints.ts     # Riot API endpoint builders
│   ├── helpers.ts       # Stats aggregation, LP conversion, Best-of computation
│   ├── service.ts       # Data fetching orchestration (ranked, matches, dashboard)
│   └── utils.ts         # cn() utility (clsx + tailwind-merge)
├── player/[gameName]/   # Dynamic player detail page
├── team/                # Team analytics page
├── types/               # TypeScript interfaces (riot.ts, user.ts)
├── globals.css          # Tailwind imports + custom animations
├── layout.tsx           # Root layout with NavHeader
└── page.tsx             # Dashboard (home page)
```

## License

Private project — not for redistribution.
