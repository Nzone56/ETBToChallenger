# Adding Players

## How to Add a New Player

### 1. Get the Player's PUUID

You need the player's **PUUID** (Player Universally Unique Identifier). You can get it from the Riot Account API:

```
GET https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
```

The response includes a `puuid` field.

### 2. Add to `app/data/users.ts`

Add a new entry to the `users` array:

```ts
{
  gameName: "PlayerName",
  tagLine: "TAG",
  puuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  region: "LAN",  // Display region (cosmetic only)
}
```

### 3. That's It

The application automatically:
- Fetches ranked data for the new player
- Includes them in all leaderboards and "Best of" calculations
- Creates their player detail page at `/player/PlayerName`
- Adds them to the NavHeader player dropdown
- Includes them in team analytics

## How to Remove a Player

Simply remove their entry from the `users` array in `app/data/users.ts`.

## Notes

- The `tagLine` is used for player lookup on the player detail page (`getUserByRiotId`). All current players use `"ETB"` as their tag.
- If a player changes their Riot ID, update `gameName` and `tagLine` accordingly. The `puuid` never changes.
- The `region` field is for display purposes only. API routing is hardcoded to `LA1` (Latin America North) and `AMERICAS` in `endpoints.ts`. To support other regions, you would need to make the region configurable per-player in the endpoint builders.

## Changing the Season Start Date

If a new season starts, update the `SEASON_START_EPOCH` constant in `app/data/constants.ts`:

```ts
export const SEASON_START_EPOCH = new Date("2027-01-XX T00:00:00Z").getTime();
```

All match filtering will automatically use the new date.
