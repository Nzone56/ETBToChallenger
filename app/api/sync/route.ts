import { NextRequest, NextResponse } from "next/server";
import { syncAllPlayers, syncPlayer } from "@/app/lib/sync";
import { getDbStats, initSchema, DB_TAG } from "@/app/lib/db";
import { revalidateTag } from "next/cache";
import { users } from "@/app/data/users";

// Ensure schema exists on cold start (Vercel serverless)
let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await initSchema();
  schemaReady = true;
}

// Global lock — prevents concurrent syncs from multiple page SyncTriggers
let syncInProgress = false;

// POST /api/sync          — sync all players
// POST /api/sync?puuid=X  — sync single player
export async function POST(request: NextRequest) {
  await ensureSchema();
  if (syncInProgress) {
    console.log(
      "[/api/sync] Sync already in progress — skipping duplicate request",
    );
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "sync_in_progress",
      db: await getDbStats(),
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
      revalidateTag(DB_TAG, "default");
      return NextResponse.json({
        ok: true,
        gameName: user.gameName,
        ...result,
        db: await getDbStats(),
      });
    }

    const result = await syncAllPlayers();
    revalidateTag(DB_TAG, "default");
    return NextResponse.json({ ok: true, ...result, db: await getDbStats() });
  } catch (err) {
    console.error("[/api/sync] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    syncInProgress = false;
  }
}

// GET /api/sync — return current DB stats (no Riot calls)
export async function GET() {
  await ensureSchema();
  return NextResponse.json({ ok: true, db: await getDbStats() });
}
