import { NextResponse } from "next/server";
import {
  getAllRankedSnapshots,
  getAllPlayerStats,
  getMatchesByPuuid,
} from "@/app/lib/db";
import { computeBestOfChallenge, computeAverageElo } from "@/app/lib/helpers";
import { users } from "@/app/data/users";
import type {
  PlayerAggregatedStats,
  Summoner,
  LeagueEntry,
  Match,
} from "@/app/types/riot";

// GET /api/dashboard — full dashboard data from DB (0 Riot API calls)
export async function GET() {
  const snapshots = getAllRankedSnapshots();
  const statsRows = getAllPlayerStats();

  // Build a map for quick lookup
  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));

  // Check if DB is empty (never synced)
  if (snapshots.length === 0) {
    return NextResponse.json(
      { error: "DB_EMPTY", message: "No data yet. Run /api/sync first." },
      { status: 503 },
    );
  }

  // Build per-player data
  const players = users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const statsRow = statsMap.get(user.puuid);

    const summoner: Summoner | null = snap?.summonerJson
      ? JSON.parse(snap.summonerJson)
      : null;
    const flexEntry: LeagueEntry | null = snap?.flexEntryJson
      ? JSON.parse(snap.flexEntryJson)
      : null;
    const stats: PlayerAggregatedStats | null = statsRow?.statsJson
      ? JSON.parse(statsRow.statsJson)
      : null;

    // Last match: most recent from DB
    const matches = getMatchesByPuuid(user.puuid) as Match[];
    const lastMatch = matches.length > 0 ? matches[0] : null;

    return {
      puuid: user.puuid,
      gameName: user.gameName,
      tagLine: user.tagLine,
      summoner,
      flexEntry,
      lastMatch,
      stats,
      profileIconId: summoner?.profileIconId ?? null,
    };
  });

  // Compute best-of from cached stats
  const eligibleForBestOf = players
    .filter((p) => p.stats !== null)
    .map((p) => ({
      gameName: p.gameName,
      stats: p.stats as PlayerAggregatedStats,
    }));

  const bestOf =
    eligibleForBestOf.length > 0
      ? computeBestOfChallenge(eligibleForBestOf)
      : null;

  const { avgLp, avgTierLabel } = computeAverageElo(
    players.map((p) => p.flexEntry),
  );

  return NextResponse.json({
    players,
    bestOf,
    avgLp,
    avgTierLabel,
    syncedAt: snapshots[0]?.syncedAt ?? null,
  });
}
