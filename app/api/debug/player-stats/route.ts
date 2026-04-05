import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/app/lib/db";
import { SEASON_START_EPOCH, QUEUE_FLEX } from "@/app/data/constants";
import { users } from "@/app/data/users";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get("name");
  
  if (!gameName) {
    return NextResponse.json({ error: "Missing name parameter. Usage: /api/debug/player-stats?name=PlayerName" }, { status: 400 });
  }
  
  const user = users.find(u => u.gameName === gameName);
  if (!user) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  
  await ensureSchema();
  const db = getDb();
  
  // Get aggregated stats
  const statsRes = await db.execute({
    sql: "SELECT stats_json FROM player_stats WHERE puuid = ?",
    args: [user.puuid],
  });
  
  const stats = statsRes.rows[0] ? JSON.parse(statsRes.rows[0].stats_json as string) : null;
  
  // Get all group matches
  const groupRes = await db.execute(
    "SELECT match_data, player_list FROM group_matches",
  );
  
  const groupMatchMap = new Map<string, number>();
  for (const row of groupRes.rows) {
    const match = JSON.parse(row.match_data as string);
    const players = JSON.parse(row.player_list as string);
    groupMatchMap.set(match.metadata.matchId, players.length);
  }
  
  // Get all matches for this player
  const matchRes = await db.execute({
    sql: `SELECT DISTINCT m.match_id, m.data FROM matches m
          JOIN player_matches pm ON pm.match_id = m.match_id
          WHERE pm.puuid = ?
          ORDER BY pm.played_at DESC`,
    args: [user.puuid],
  });
  
  let soloCount = 0;
  let duoCount = 0;
  let trioCount = 0;
  let pentaCount = 0;
  let totalSeasonMatches = 0;
  
  for (const row of matchRes.rows) {
    const match = JSON.parse(row.data as string);
    
    if (
      match.info.gameStartTimestamp >= SEASON_START_EPOCH &&
      match.info.queueId === QUEUE_FLEX
    ) {
      totalSeasonMatches++;
      
      const matchId = match.metadata.matchId;
      const stackSize = groupMatchMap.get(matchId) ?? 1;
      
      if (stackSize === 1) soloCount++;
      else if (stackSize === 2) duoCount++;
      else if (stackSize === 3) trioCount++;
      else if (stackSize >= 4) pentaCount++;
    }
  }
  
  const stackTotal = soloCount + duoCount + trioCount + pentaCount;
  
  return NextResponse.json({
    player: gameName,
    puuid: user.puuid,
    aggregatedStats: stats ? {
      totalGames: stats.totalGames,
      wins: stats.wins,
      winrate: stats.winrate,
    } : null,
    stackBreakdown: {
      solo: soloCount,
      duo: duoCount,
      trio: trioCount,
      penta: pentaCount,
      total: stackTotal,
    },
    matchCounts: {
      seasonFlexMatches: totalSeasonMatches,
      stackTotal: stackTotal,
    },
    discrepancy: stats && stackTotal !== stats.totalGames ? {
      aggregatedStatsShows: stats.totalGames,
      stackStatsShows: stackTotal,
      difference: stackTotal - stats.totalGames,
    } : null,
  }, { status: 200 });
}
