import { NextRequest, NextResponse } from "next/server";
import { syncAllPlayers, syncPlayer } from "@/app/lib/sync";
import { getDbStats } from "@/app/lib/db";
import { users } from "@/app/data/users";

// Global lock — prevents concurrent syncs from multiple page SyncTriggers
let syncInProgress = false;

// POST /api/sync          — sync all players
// POST /api/sync?puuid=X  — sync single player
export async function POST(request: NextRequest) {
  if (syncInProgress) {
    console.log(
      "[/api/sync] Sync already in progress — skipping duplicate request",
    );
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "sync_in_progress",
      db: getDbStats(),
    });
  }

  const puuid = request.nextUrl.searchParams.get("puuid");
  syncInProgress = true;

  try {
    if (puuid) {
      const user = users.find((u) => u.puuid === puuid);
      if (!user) {
        return NextResponse.json({ error: "Unknown puuid" }, { status: 404 });
      }
      const result = await syncPlayer(puuid);
      return NextResponse.json({
        ok: true,
        gameName: user.gameName,
        ...result,
        db: getDbStats(),
      });
    }

    const result = await syncAllPlayers();
    return NextResponse.json({ ok: true, ...result, db: getDbStats() });
  } catch (err) {
    console.error("[/api/sync] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    syncInProgress = false;
  }
}

// GET /api/sync — return current DB stats (no Riot calls)
export async function GET() {
  return NextResponse.json({ ok: true, db: getDbStats() });
}
