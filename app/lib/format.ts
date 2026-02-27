import { Match, MatchParticipant } from "../types/riot";

// ─── Extract participant from match ───
export function getParticipant(
  match: Match,
  puuid: string,
): MatchParticipant | undefined {
  return match.info.participants.find((p) => p.puuid === puuid);
}

// ─── KDA ───
export function calcKda(
  kills: number,
  deaths: number,
  assists: number,
): number {
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

export function formatKda(kda: number): string {
  return kda.toFixed(2);
}

// ─── Winrate ───
export function calcWinrate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function formatWinrate(winrate: number): string {
  return `${winrate.toFixed(1)}%`;
}

// ─── CS per minute ───
export function calcCsPerMin(cs: number, gameDurationSeconds: number): number {
  const minutes = gameDurationSeconds / 60;
  if (minutes === 0) return 0;
  return cs / minutes;
}
