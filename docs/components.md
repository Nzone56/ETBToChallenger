# Components

Design rules (tokens, type, radius, motion, layout) live in [`CLAUDE.md` §4](../CLAUDE.md). This is the map of what exists.

## Shell — `components/layout/`

| Component                | Notes                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| `AppShell`               | Fixed sidebar (≥ `lg`) or top bar + drawer; content column `max-w-app` |
| `NavPanel`               | Sidebar body, shared by desktop sidebar and mobile drawer             |
| `NavLinks` (client)      | Section links with active state (`nav.ts` lists them)                 |
| `RosterNav` → `RosterNavList` (client) | Players by ladder position, streamed                   |
| `SyncStatus`             | Season label and last sync time, streamed                             |
| `MobileNav` (client)     | Top bar + drawer; closes on navigation and Escape                     |
| `Brand`, `PageHeader`, `PageSkeleton` | Wordmark, page heading, route loading state              |

## Primitives — `components/ui/`

| Component | Props of note |
| --- | --- |
| `Panel`, `PanelHeader` | `as`; header `title`, `icon`, `iconClassName`, `description`, `actions` |
| `SectionHeader` | `title`, `icon`, `description`, `actions` |
| `StatTile` | `label`, `value`, `sub`, `icon`, `size` (sm/md/lg), `variant` (card/plain), `valueClassName` |
| `SegmentedControl` (client) | `options`, `value`, `onChange`, `variant` (pill/underline), `fullWidth`, `wrap` |
| `LinkTabs` | URL tabs: `tabs` (`href`, `icon`, `locked`), `active` |
| `Badge` | `tone` (neutral/primary/accent/win/loss/remake), `size` |
| `ResultBadge` | `result`; also exports `RESULT_STRIPE`, `RESULT_TEXT` |
| `RankNumber` | `position`, `variant` (best/worst) |
| `CirBadge` | `score`, `detail` (letter/label), `size` |
| `Meter`, `WinrateBar`, `TierProgressBar` | Bars; the tier bar takes `pins` (avatars on the ladder) |
| `ProfileIcon` | `iconId`, `size`, `ringColor` (tier colour) |
| `ChampionIcon`, `ItemsDisplay`, `KdaDisplay`, `MatchStats` | Game atoms |
| `RankBadge`, `RankEmblem` | Tier + division + LP |
| `RoleIcon` | Also exports `ROLE_META`, `ROLE_ORDER`, `roleLabel` |
| `EmptyState`, `Skeleton`, `MoreButton`, `Spinner` | States |

## Dashboard — `components/dashboard/`

`ChallengeHero` (team average, LP to go, track with player pins) · `Standings` + `StandingsRow` (client; filters in `leaderboardRows.ts`; columns appear by `@container` width) · `RoleCirLeaderboard` · `LoneWolf` ("Divas") · `BestOfSection` + `StatCard` (configs in `statCardConfigs.ts`).

## Player — `components/player/`

`PlayerHero` · `RoleSpecialization` · `PlayerRadarChart` (math in `lib/playstyle.ts`) · `PlayerStatsGrid` (thresholds in `playerStatConfigs.tsx`) · `ChampionProficiency` · `MatchHistoryList` → `matchHistory/useMatchHistory`, `MatchFiltersBar`, `MatchRow`.

## Match — `components/match/`

`MatchHeader` · `MatchMVP` · `MatchTeamTable` → `ParticipantRow` · `MatchStats`. All read a `MatchView` from `lib/matchView.ts`.

## Team — `components/team/`

`TeamOverview` · `BestRoster` (solver in `lib/bestRoster.ts`) · `FinalRankings` · `InternalRankings` (client; `rankingUtils.ts`) · `GroupMatchHistory` (client paging over server rows) · `RukawaFiles` → `rukawa/DossierPanel`, `SynergyMatrix`, `DrainList`, `LineupList`, `RoleImpact`, `BronzeWall`.

## Records — `components/records/`

`RecordsTab` (`RecordCard`, `PentakillCard`) · `CirTab` (`CountRanking`, `CirLeaderboards` → `CirLeaderboardCard`) · `DeltaTab` (`DeltaLeaderboardCard`, `DeltaConfig.ts`). Grouping and counting in `RecordData.ts`.

## Awards — `components/awards/`

`Nominations` → `AwardBoard` (client; podium `NomineeCard`, list `NomineeRow`, art `NomineeArt`) · `WinnersBoard` · `ScoreFormula`. Nominees are mapped to one display shape in `nomineeViews.ts` / `awardCategories.ts`.
