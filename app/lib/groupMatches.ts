import { Match } from "../types/riot";

// ─── Find group matches (matches where 2+ members played together) ───
export function findGroupMatches(
  allPlayerMatches: { puuid: string; gameName: string; matches: Match[] }[],
): { match: Match; players: { puuid: string; gameName: string }[] }[] {
  const matchPlayerMap = new Map<
    string,
    { match: Match; players: { puuid: string; gameName: string }[] }
  >();

  for (const { puuid, gameName, matches } of allPlayerMatches) {
    for (const match of matches) {
      const matchId = match.metadata.matchId;
      if (!matchPlayerMap.has(matchId)) {
        matchPlayerMap.set(matchId, { match, players: [] });
      }
      matchPlayerMap.get(matchId)!.players.push({ puuid, gameName });
    }
  }

  return Array.from(matchPlayerMap.values())
    .filter((entry) => entry.players.length >= 2)
    .sort((a, b) => b.match.info.gameCreation - a.match.info.gameCreation);
}
