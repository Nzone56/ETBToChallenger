import { NextResponse } from "next/server";
import {
  getAllRankedSnapshots,
  getAllPlayerStats,
  getMatchesByPuuid,
} from "@/app/lib/db";
import { findGroupMatches, getParticipant } from "@/app/lib/helpers";
import { users } from "@/app/data/users";
import type { PlayerAggregatedStats, Summoner, Match } from "@/app/types/riot";

// GET /api/team — team analytics data from DB (0 Riot API calls)
export async function GET() {
  const snapshots = getAllRankedSnapshots();
  const statsRows = getAllPlayerStats();

  if (snapshots.length === 0) {
    return NextResponse.json(
      { error: "DB_EMPTY", message: "No data yet. Run /api/sync first." },
      { status: 503 },
    );
  }

  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));

  // Build per-player match + stats data
  const allPlayerMatches = users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const statsRow = statsMap.get(user.puuid);
    const summoner: Summoner | null = snap?.summonerJson
      ? JSON.parse(snap.summonerJson)
      : null;
    const stats: PlayerAggregatedStats | null = statsRow?.statsJson
      ? JSON.parse(statsRow.statsJson)
      : null;
    const matches = getMatchesByPuuid(user.puuid) as Match[];

    return {
      puuid: user.puuid,
      gameName: user.gameName,
      matches,
      profileIconId: summoner?.profileIconId ?? null,
      stats,
    };
  });

  // Group matches (2+ members played together)
  const groupMatches = findGroupMatches(allPlayerMatches);
  const groupWins = groupMatches.filter(({ match, players }) => {
    const p = getParticipant(match, players[0].puuid);
    return p?.win;
  }).length;

  // Player stats for InternalRankings
  const playerStatsData = allPlayerMatches.map((p) => ({
    gameName: p.gameName,
    profileIconId: p.profileIconId,
    stats: p.stats,
  }));

  return NextResponse.json({
    playerStatsData,
    groupMatches: groupMatches.map(({ match, players }) => ({
      match,
      players,
    })),
    totalGroupMatches: groupMatches.length,
    groupWins,
  });
}
