# Data & Constants

## File: `app/data/constants.ts`

Central configuration file for LP math, tier colors, queue IDs, season config, and DDragon helpers.

### LP System

The ranked ladder is modeled as a continuous LP scale:

| Tier        | LP Width          | Base LP | Divisions                    |
| ----------- | ----------------- | ------- | ---------------------------- |
| Iron        | 400               | 0       | IV, III, II, I (100 LP each) |
| Bronze      | 400               | 400     | IV, III, II, I               |
| Silver      | 400               | 800     | IV, III, II, I               |
| Gold        | 400               | 1200    | IV, III, II, I               |
| Platinum    | 400               | 1600    | IV, III, II, I               |
| Emerald     | 400               | 2000    | IV, III, II, I               |
| Diamond     | 400               | 2400    | IV, III, II, I               |
| Master      | 200               | 2800    | Single division              |
| Grandmaster | 300               | 3000    | Single division              |
| Challenger  | 500 (display cap) | 3300    | Single division              |

**Key functions:**

- `rankToLp(tier, division, lp)` — Converts a Riot tier/division/LP to a single total LP number.
- `lpToProgress(totalLp)` — Converts total LP to a 0–100% progress value for the bar.
- `tierWidthPercent(tier)` — Returns the proportional width of a tier segment as a percentage of the full bar.
- `tierStartPercent(tier)` — Returns where a tier starts on the progress bar.

These are defined in `constants.ts` and consumed by `ProgressBarSegmented`.

### Tier Colors

`TIER_COLORS` is the **single source of truth** for tier colors. All UI elements (progress bar segments, fill, rank emblems, badges) derive their colors from this record.

```ts
TIER_COLORS: Record<RankTier, string> = {
  IRON: "#6B5B4F",
  BRONZE: "#8B6914",
  SILVER: "#8E9AAF",
  GOLD: "#C8AA6E",
  PLATINUM: "#4E9996",
  EMERALD: "#009B5A",
  DIAMOND: "#576BCE",
  MASTER: "#9D48E0",
  GRANDMASTER: "#CD4545",
  CHALLENGER: "#F4C874",
};
```

`tierBgColor(tier)` returns the hex color for a given tier — use this instead of duplicating colors.

### Season Configuration

```ts
SEASON_START_EPOCH = new Date("2026-01-08T00:00:00Z").getTime();
```

All match fetching filters by this date. To change the season boundary, update this single value.

### Queue IDs

- `QUEUE_FLEX = 440` — Ranked Flex 5v5
- `QUEUE_SOLO = 420` — Ranked Solo/Duo (not currently used)

### Best-of Thresholds

- `MIN_GAMES_FOR_BEST = 5` — Minimum games for a player to appear in "Best of" cards.

---

## File: `app/data/users.ts`

Hardcoded list of tracked players. Each entry has:

```ts
interface User {
  gameName: string; // Riot game name
  tagLine: string; // Riot tag (e.g. "ETB")
  puuid: string; // Player UUID (from Riot Account API)
  region: string; // Display region
}
```

Helper functions:

- `getUserByRiotId(gameName, tagLine)` — Find a user by name + tag.
- `getUserByPuuid(puuid)` — Find a user by PUUID.

---

## File: `app/lib/helpers.ts`

Pure computation functions — no API calls.

### Stats Aggregation

`aggregatePlayerStats(puuid, matches)` processes an array of matches and returns:

- Win/loss/winrate
- Average kills, deaths, assists, KDA
- Average CS, CS/min, damage, vision score
- Average kill participation (%)
- Per-champion stats (sorted by games played)
- Per-role stats (sorted by games played)
- Primary role

### Best-of Computation

`computeBestOfChallenge(players)` finds the top performer across all players for each category, respecting minimum game thresholds.

### LP Helpers

- `lpToTierLabel(lp)` — Converts total LP to a human-readable label like "Emerald II".
- `lpToTier(lp)` — Returns the `RankTier` key (e.g. `"EMERALD"`) for a given LP value.
- `computeAverageElo(entries)` — Computes the team's average LP and tier label.

### Match Utilities

- `getParticipant(match, puuid)` — Extracts a player's data from a match.
- `findGroupMatches(allPlayerMatches)` — Finds matches where 2+ tracked players played together.
- `calcKda`, `calcWinrate`, `calcCsPerMin`, `formatKda`, `formatWinrate` — Formatting helpers.
