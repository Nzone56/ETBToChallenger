import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/app/lib/db";
import { users } from "@/app/data/users";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get("name");
  
  if (!gameName) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }
  
  const user = users.find(u => u.gameName === gameName);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  await ensureSchema();
  const db = getDb();
  
  // Get match count for this player
  const matchRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM player_matches WHERE puuid = ?`,
    args: [user.puuid],
  });
  
  const matchCount = matchRes.rows[0]?.count as number || 0;
  
  // Get sync log
  const syncRes = await db.execute({
    sql: `SELECT last_sync, match_count FROM sync_log WHERE puuid = ?`,
    args: [user.puuid],
  });
  
  const syncLog = syncRes.rows[0] ? {
    lastSync: new Date(syncRes.rows[0].last_sync as number).toISOString(),
    matchCount: syncRes.rows[0].match_count as number,
  } : null;
  
  // Get a few sample match IDs
  const sampleRes = await db.execute({
    sql: `SELECT match_id, played_at FROM player_matches WHERE puuid = ? ORDER BY played_at DESC LIMIT 5`,
    args: [user.puuid],
  });
  
  const sampleMatches = sampleRes.rows.map(r => ({
    matchId: r.match_id as string,
    playedAt: new Date(r.played_at as number).toISOString(),
  }));
  
  return NextResponse.json({
    player: gameName,
    puuid: user.puuid,
    matchesInDb: matchCount,
    syncLog,
    sampleMatches,
  }, { status: 200 });
}
