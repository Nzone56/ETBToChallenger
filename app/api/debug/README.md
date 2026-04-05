# Debug API Endpoints

This folder contains diagnostic and debugging endpoints for the ETBToChallenger application.

## Available Endpoints

### `/api/debug/resync-all`

**Purpose:** Force a complete re-sync of all players from season start and rebuild group matches.

**Usage:** `GET` or `POST` to `/api/debug/resync-all`

**What it does:**

1. Deletes sync logs for all players
2. Triggers full sync from season start for all players
3. Rebuilds the group_matches table

**When to use:** When you suspect data inconsistencies across multiple players or want to ensure all matches are properly synced.

---

### `/api/debug/player-stats?name={gameName}`

**Purpose:** Compare a player's aggregated stats with their stack stats breakdown.

**Usage:** `GET /api/debug/player-stats?name=Bloomer`

**Returns:**

- Aggregated stats (totalGames, wins, winrate)
- Stack breakdown (solo/duo/trio/penta counts)
- Match counts comparison
- Discrepancy analysis if totals don't match

**When to use:** To diagnose counting discrepancies between aggregated stats and stack filter stats.

---

### `/api/debug/match?id={matchId}`

**Purpose:** Inspect a specific match to see which team members played in it.

**Usage:** `GET /api/debug/match?id=LA1_1707436988`

**Returns:**

- Team members who played in the match
- Whether the match is in the group_matches table
- Linked puuids in player_matches table

---

### `/api/debug/missing-matches`

**Purpose:** Find matches that exist in one player's history but not another's.

**Usage:** `GET /api/debug/missing-matches`

**Returns:**

- Matches where Kushinada and StarboyXO played together
- Which matches are missing from StarboyXO's database
- Analysis of the discrepancy

**When to use:** To diagnose why group matches aren't being detected (matches missing from player histories).

---

### `/api/debug/player-matches?name={gameName}`

**Purpose:** Check a player's sync status and match count.

**Usage:** `GET /api/debug/player-matches?name=StarboyXO`

**Returns:**

- Total matches in database for the player
- Last sync timestamp
- Sample match IDs

---

### `/api/debug/stack-stats`

**Purpose:** View stack statistics for all players.

**Usage:** `GET /api/debug/stack-stats`

**Returns:**

- Solo/duo/trio/penta game counts and wins for all players

---

### `/api/debug/duplicate-matches`

**Purpose:** Check for duplicate match entries in the database.

**Usage:** `GET /api/debug/duplicate-matches`

**Returns:**

- Duplicate match_ids in matches table
- Duplicate entries in player_matches table
- Total vs unique counts

**When to use:** To diagnose overcounting issues in stack stats.

---

## Maintenance Endpoints (Outside Debug Folder)

### `/api/rebuild-group-matches`

**Purpose:** Rebuild the group_matches table from existing match data.

**Usage:** `GET` or `POST` to `/api/rebuild-group-matches`

---

## Notes

- All debug endpoints are safe to call and won't modify data unless explicitly stated
- The `resync-all` endpoint will trigger Riot API calls and may take several minutes
- Use these endpoints to diagnose data inconsistencies or verify sync status
- Most endpoints accept a `?name=PlayerName` query parameter to target specific players
