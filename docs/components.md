# Components Reference

## Dashboard Components (`components/dashboard/`)

### ChallengeHeader

Displays the team's overall challenge progress with an expandable per-player section.

| Prop | Type | Description |
|------|------|-------------|
| `avgLp` | `number` | Team average LP |
| `avgTierLabel` | `string` | Formatted tier label (e.g. "Emerald II") |
| `avgTier` | `RankTier` | Tier key for rank emblem |
| `playerCount` | `number` | Number of tracked players |
| `players` | `PlayerLpData[]` | Per-player LP, tier label, and tier key |

Client component — toggles expanded state to show/hide individual player progress bars with rank emblems.

### BestOfSection

Renders 8 "Best of the Challenge" cards in a responsive grid.

| Prop | Type | Description |
|------|------|-------------|
| `best` | `BestOfChallenge` | Computed best-of stats object |

Cards: Top Winrate, Top KDA, Top Damage, Best Champion, Most Avg Kills, Least Avg Deaths, Most Avg Assists, Top Kill Participation.

### Leaderboard

LP-based player ranking with rank badges and hot-streak indicators.

| Prop | Type | Description |
|------|------|-------------|
| `players` | `PlayerRankedData[]` | All players' ranked data |

### RoleLeaderboard

Interactive winrate leaderboard with role selector tabs.

| Prop | Type | Description |
|------|------|-------------|
| `players` | `{ gameName, stats }[]` | Players with aggregated stats |

Client component — user selects a role (Top, Jungle, Mid, ADC, Support) to see winrate rankings for that position.

### PlayerCard

Quick-glance card for a single player on the dashboard.

| Prop | Type | Description |
|------|------|-------------|
| `player` | `PlayerDashboardData` | Ranked data + last match info |
| `version` | `string` | DDragon version for champion icons |

---

## Player Components (`components/player/`)

### PlayerHeader

Displays player name, rank badge, LP, and winrate.

| Prop | Type | Description |
|------|------|-------------|
| `player` | `PlayerRankedData` | Player's ranked data |

### AggregatedStats

Grid of stat cards (KDA, CS/min, Damage, Vision Score).

| Prop | Type | Description |
|------|------|-------------|
| `stats` | `PlayerAggregatedStats` | Aggregated match stats |

### ChampionStatsTable

Sortable table of champion performance.

| Prop | Type | Description |
|------|------|-------------|
| `champions` | `ChampionStats[]` | Per-champion stats |
| `version` | `string` | DDragon version for icons |

Client component — click column headers (Games, Winrate, KDA, Avg DMG) to sort. Click again to reverse order.

### RolePerformance

Horizontal bar chart of games and winrate per role.

| Prop | Type | Description |
|------|------|-------------|
| `roleStats` | `RoleStats[]` | Per-role stats |

### MatchHistoryList

Paginated match history with "Load More" button.

| Prop | Type | Description |
|------|------|-------------|
| `puuid` | `string` | Player's PUUID |
| `initialMatches` | `Match[]` | First page of matches (server-rendered) |
| `version` | `string` | DDragon version |
| `pageSize` | `number` | Matches per page (default 10) |

Client component — fetches additional matches from `/api/matches` on button click. Only loads matches from the current season.

---

## Team Components (`components/team/`)

### TeamOverview

Summary cards (team games, winrate, stack games, stack winrate) and team signature champions with icons.

| Prop | Type | Description |
|------|------|-------------|
| `players` | `{ gameName, stats }[]` | All players' aggregated stats |
| `totalGroupMatches` | `number` | Matches where 2+ members played together |
| `groupWins` | `number` | Wins in group matches |
| `version` | `string` | DDragon version for champion icons |

### InternalRankings

Sortable player ranking by Winrate, KDA, or Avg Damage.

| Prop | Type | Description |
|------|------|-------------|
| `players` | `{ gameName, stats }[]` | All players' aggregated stats |

Client component — toggle sort criteria with buttons.

### GroupMatchHistory

List of matches where 2+ tracked players played together.

| Prop | Type | Description |
|------|------|-------------|
| `groupMatches` | `{ match, players }[]` | Group match data |

---

## Shared UI Components (`components/ui/`)

### NavHeader
Global navigation bar with Dashboard, Team Analytics links and a Players dropdown for quick navigation to any player's detail page.

### ProgressBarSegmented
Segmented progress bar from Iron to Challenger with proportional tier widths and color-matched fill. Supports `label`, `sublabel`, and `compact` mode.

### RankEmblem
SVG rank emblem icon colored by tier. Used next to tier labels in ChallengeHeader.

### RankBadge
Text badge showing tier, division, and LP.

### ChampionIcon
Renders a champion square icon from DDragon.

### KdaDisplay
Formatted K/D/A display with color coding.

### WinrateBar
Horizontal win/loss bar with optional label.

### StatCard
Generic stat card with label, value, sublabel, and icon.

### Spinner
Loading spinner with optional label. Used in `loading.tsx` files.
