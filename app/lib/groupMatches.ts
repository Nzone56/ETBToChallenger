import { Match } from "../types/riot";
import { SEASON_START_EPOCH, QUEUE_FLEX } from "../data/constants";
import { isRemake } from "./format";
import type { SlimGroupMatch } from "./db";

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
      // Only consider season flex queue matches
      if (
        match.info.gameStartTimestamp < SEASON_START_EPOCH ||
        match.info.queueId !== QUEUE_FLEX
      ) {
        continue;
      }

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

// ─── Compact rows for the stacked-games list ───
// Only the roster's own participants travel to the client, which keeps a
// season of stacked games small enough to render server-side in one go.
export interface GroupMatchRowData {
  matchId: string;
  duration: number;
  outcome: "win" | "loss" | "remake" | "mixed";
  players: {
    puuid: string;
    gameName: string;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
  }[];
}

export function toGroupMatchRows(
  entries: {
    match: SlimGroupMatch;
    players: { puuid: string; gameName: string }[];
  }[],
): GroupMatchRowData[] {
  return entries.map(({ match, players }) => {
    const rows = players.flatMap((pl) => {
      const p = match.info.participants.find((pt) => pt.puuid === pl.puuid);
      return p
        ? [
            {
              puuid: pl.puuid,
              gameName: pl.gameName,
              championName: p.championName,
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
              win: p.win,
            },
          ]
        : [];
    });
    const outcome: GroupMatchRowData["outcome"] = isRemake(match.info.gameDuration)
      ? "remake"
      : rows.every((r) => r.win)
        ? "win"
        : rows.every((r) => !r.win)
          ? "loss"
          : "mixed";
    return {
      matchId: match.metadata.matchId,
      duration: match.info.gameDuration,
      outcome,
      players: rows,
    };
  });
}
