import { computeParticipantCir } from "./cir";
import { getParticipant, matchResult, type MatchResult } from "./format";
import type { Match } from "../types/riot";

/**
 * A player's last game, reduced to what a summary row shows. Built on the
 * server so a full Riot match payload (~10 KB each) never ships to the client
 * just to draw one line.
 */
export interface LastGame {
  matchId: string;
  championName: string;
  position: string;
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  /** null for a remake */
  cir: number | null;
  durationSec: number;
  playedAt: number;
}

export function summarizeLastGame(match: Match | null, puuid: string): LastGame | null {
  const p = match ? getParticipant(match, puuid) : undefined;
  if (!match || !p) return null;
  const result = matchResult(match.info.gameDuration, p.win);
  return {
    matchId: match.metadata.matchId,
    championName: p.championName,
    position: p.teamPosition,
    result,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cir: result === "remake" ? null : computeParticipantCir(match, p).score,
    durationSec: match.info.gameDuration,
    playedAt: match.info.gameStartTimestamp,
  };
}
