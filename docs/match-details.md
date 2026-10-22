# Match Details Page

`/match/[matchId]` — e.g. `/match/LA1_1751504300`. Every game row in the app (player history, stacked games, records, CIR and delta leaderboards, pentakills, the dashboard's Standings) links here.

## Data

1. `getMatchById(matchId)` (`lib/db.ts`, React `cache()`) reads the stored Riot match.
2. `buildMatchView(match, rosterPuuids)` (`lib/matchView.ts`) computes everything the page renders, once:
   - each participant's CIR via `computeParticipantCir` (0 for remakes),
   - both teams in lane order with totals (K/D/A, damage dealt/taken, gold, CS, vision) and objectives (towers, dragons, barons, heralds),
   - the MVP (highest CIR in the game),
   - which participants are on the roster.
3. Unknown ids render an `EmptyState` with a back button.

## Components (`app/components/match/`)

| Component        | Shows                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `MatchHeader`    | Blue and red kill totals, Victory/Defeat/Remake, duration, date/time, roster players as links |
| `MatchMVP`       | The MVP's champion, KDA, damage, gold and CIR (hidden for remakes)                        |
| `MatchTeamTable` | One scoreboard per side: header totals + objectives, then a `ParticipantRow` per player    |
| `ParticipantRow` | Champion, name (roster players in teal, linked), KDA, damage/gold/CS/vision with per-minute, CIR, items |
| `MatchStats`     | Blue-vs-red bars for kills, damage, gold, CS, vision, towers, dragons (hidden for remakes) |

Sides use the `side-blue` / `side-red` tokens; results use `win` / `loss` / `remake`. Tables scroll horizontally below their minimum width.
