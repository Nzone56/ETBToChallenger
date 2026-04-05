import { NextResponse } from "next/server";
import { users } from "@/app/data/users";
import { getDb, ensureSchema } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const db = getDb();
    
    console.log("[RESYNC-ALL] Starting full resync for all players...");
    
    // Delete sync logs for ALL players to force full re-sync from season start
    for (const user of users) {
      await db.execute({
        sql: "DELETE FROM sync_log WHERE puuid = ?",
        args: [user.puuid],
      });
      console.log(`[RESYNC-ALL] Deleted sync log for ${user.gameName}`);
    }
    
    // Trigger sync for all players
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin") || "http://localhost:3000";
    
    const syncResponse = await fetch(`${origin}/api/sync`, {
      method: 'POST',
    });
    
    const syncData = await syncResponse.json();
    
    // After sync, rebuild group matches
    console.log("[RESYNC-ALL] Rebuilding group matches...");
    const rebuildResponse = await fetch(`${origin}/api/rebuild-group-matches`, {
      method: 'POST',
    });
    
    const rebuildData = await rebuildResponse.json();
    
    return NextResponse.json({
      success: true,
      message: "All players re-synced from season start and group matches rebuilt",
      playersResynced: users.length,
      syncResult: syncData,
      rebuildResult: rebuildData,
    }, { status: 200 });
  } catch (error) {
    console.error("[RESYNC-ALL] Error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
