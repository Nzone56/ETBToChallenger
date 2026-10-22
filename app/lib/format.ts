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

// ─── Remake detection (< 5 min = remake) ───
export const REMAKE_THRESHOLD_SECONDS = 300;

export function isRemake(gameDurationSeconds: number): boolean {
  return gameDurationSeconds < REMAKE_THRESHOLD_SECONDS;
}

// ─── Match result ───
export type MatchResult = "win" | "loss" | "remake";

export function matchResult(
  gameDurationSeconds: number,
  win: boolean,
): MatchResult {
  if (isRemake(gameDurationSeconds)) return "remake";
  return win ? "win" : "loss";
}

// ─── Display formatting ───

/** 1834 → "30:34" */
export function formatDuration(gameDurationSeconds: number): string {
  const m = Math.floor(gameDurationSeconds / 60);
  const s = Math.floor(gameDurationSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 12345 → "12,345" */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** 12345 → "12.3k" */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toString();
}

/** 450 → "+450", -120 → "-120" */
export function formatSigned(value: number, decimals = 0): string {
  const sign = value >= 0 ? "+" : "";
  return decimals > 0
    ? `${sign}${value.toFixed(decimals)}`
    : `${sign}${formatNumber(value)}`;
}

/** "EMERALD" + "II" → "Emerald II" */
export function formatTier(tier: string, division?: string): string {
  const name = tier.charAt(0) + tier.slice(1).toLowerCase();
  return division ? `${name} ${division}` : name;
}
