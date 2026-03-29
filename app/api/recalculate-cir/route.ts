import { NextRequest, NextResponse } from "next/server";
import { users } from "@/app/data/users";
import { getMatchesByPuuid, upsertPlayerStats, DB_TAG } from "@/app/lib/db";
import { aggregatePlayerStats } from "@/app/lib/aggregation";
import { revalidateTag } from "next/cache";
import type { Match } from "@/app/types/riot";

/**
 * POST /api/recalculate-cir
 *
 * Recalculates all player stats (including CIR) from existing match data.
 * Does NOT fetch new matches from Riot API - only re-aggregates what's already in DB.
 *
 * Safe for production: reads existing matches, recomputes stats with current algorithm.
 *
 * Query params:
 * - puuid: (optional) Recalculate for specific player only
 * - force: (optional) Set to "true" to bypass confirmation
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const targetPuuid = searchParams.get("puuid");

  try {
    const playersToRecalc = targetPuuid
      ? users.filter((u) => u.puuid === targetPuuid)
      : users;

    if (playersToRecalc.length === 0) {
      return NextResponse.json(
        { error: "No matching players found" },
        { status: 404 },
      );
    }

    console.log(
      `[CIR RECALC] Starting recalculation for ${playersToRecalc.length} player(s)...`,
    );

    const results = [];

    for (const user of playersToRecalc) {
      console.log(`[CIR RECALC] Processing ${user.gameName}...`);

      // Fetch all matches from DB (already filtered by season/queue)
      const matches = (await getMatchesByPuuid(user.puuid)) as Match[];

      if (matches.length === 0) {
        console.log(`[CIR RECALC] No matches found for ${user.gameName}`);
        results.push({
          puuid: user.puuid,
          gameName: user.gameName,
          matchCount: 0,
          status: "skipped",
        });
        continue;
      }

      // Re-aggregate with current CIR algorithm
      const stats = aggregatePlayerStats(user.puuid, matches);

      // Update player_stats table
      await upsertPlayerStats(user.puuid, user.gameName, stats);

      console.log(
        `[CIR RECALC] ✓ ${user.gameName}: ${matches.length} matches, avgCir=${stats.avgCir.toFixed(2)}`,
      );

      results.push({
        puuid: user.puuid,
        gameName: user.gameName,
        matchCount: matches.length,
        avgCir: stats.avgCir,
        status: "updated",
      });
    }

    // Invalidate Next.js caches
    console.log("[CIR RECALC] Invalidating caches...");
    revalidateTag(DB_TAG, "default"); // Invalidates all unstable_cache queries with DB_TAG

    console.log(`[CIR RECALC] ✓ Complete! Updated ${results.length} player(s)`);

    return NextResponse.json({
      success: true,
      message: `Recalculated CIR for ${results.length} player(s)`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CIR RECALC] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to recalculate CIR",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/recalculate-cir
 *
 * Returns info about what would be recalculated (dry run)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const targetPuuid = searchParams.get("puuid");

  const playersToRecalc = targetPuuid
    ? users.filter((u) => u.puuid === targetPuuid)
    : users;

  const preview = [];
  for (const user of playersToRecalc) {
    const matches = (await getMatchesByPuuid(user.puuid)) as Match[];
    preview.push({
      puuid: user.puuid,
      gameName: user.gameName,
      matchCount: matches.length,
    });
  }

  return NextResponse.json({
    message: "Dry run - no changes made",
    playersAffected: preview.length,
    totalMatches: preview.reduce((sum, p) => sum + p.matchCount, 0),
    players: preview,
    instructions: {
      recalculateAll: "POST /api/recalculate-cir",
      recalculateOne: "POST /api/recalculate-cir?puuid=XXXXX",
    },
  });
}
