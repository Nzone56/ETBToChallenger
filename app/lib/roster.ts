import { cache } from "react";
import { users } from "../data/users";
import { rankToLp } from "../data/constants";
import { getAllPlayerStats, getAllRankedSnapshots } from "./db";
import { EMPTY_STATS } from "./aggregation";
import type {
  LeagueEntry,
  PlayerAggregatedStats,
  RankTier,
  Summoner,
} from "../types/riot";

/**
 * One tracked player with everything a page usually needs: identity, ranked
 * snapshot and aggregated season stats. Built once per request from the two
 * cached tables, so pages and the sidebar never re-parse the JSON columns
 * themselves.
 */
export interface RosterPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner | null;
  flexEntry: LeagueEntry | null;
  profileIconId: number | null;
  /** Continuous ladder LP (0 when unranked) — see rankToLp */
  totalLp: number;
  tier: RankTier | null;
  stats: PlayerAggregatedStats;
  /** True when the player has a stats row (has synced at least once) */
  hasStats: boolean;
}

function parse<T>(json: string | null | undefined): T | null {
  return json ? (JSON.parse(json) as T) : null;
}

export const loadRoster = cache(async (): Promise<RosterPlayer[]> => {
  const [snapshots, statsRows] = await Promise.all([
    getAllRankedSnapshots(),
    getAllPlayerStats(),
  ]);
  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));

  return users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const summoner = parse<Summoner>(snap?.summonerJson);
    const flexEntry = parse<LeagueEntry>(snap?.flexEntryJson);
    const stats = parse<PlayerAggregatedStats>(statsMap.get(user.puuid)?.statsJson);
    return {
      puuid: user.puuid,
      gameName: user.gameName,
      tagLine: user.tagLine,
      summoner,
      flexEntry,
      profileIconId: summoner?.profileIconId ?? null,
      totalLp: flexEntry
        ? rankToLp(flexEntry.tier, flexEntry.rank, flexEntry.leaguePoints)
        : 0,
      tier: flexEntry?.tier ?? null,
      stats: stats ?? EMPTY_STATS,
      hasStats: stats !== null,
    };
  });
});

/** Roster sorted by ladder position, highest LP first. */
export function byLadder(players: RosterPlayer[]): RosterPlayer[] {
  return [...players].sort((a, b) => b.totalLp - a.totalLp);
}

export function playerHref(gameName: string): string {
  return `/player/${encodeURIComponent(gameName)}`;
}

export function matchHref(matchId: string): string {
  return `/match/${matchId}`;
}
