import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/app/lib/db";
import { SEASON_START_EPOCH, QUEUE_FLEX } from "@/app/data/constants";

export async function GET() {
  await ensureSchema();
  const db = getDb();

  const kushinadaPuuid =
    "lFyi_2UFJ-PMBJ08NTvWFX9XkUWHRr_XWMm4b3-Pa0xUDSMagvDmBwvi5t_cQBYS01LD06jQMM7fhQ";
  const starboyPuuid =
    "DTj7M1_aQ5JFUNJUTWgnA5oQNr-ugLzM2kzRwZw71zgd-n2R5x4gl0FKwpcT0JE-HlVbcDFhbVInHA";

  // Get all Kushinada's matches
  const kushMatchRes = await db.execute({
    sql: `SELECT m.match_id, m.data FROM matches m
          JOIN player_matches pm ON pm.match_id = m.match_id
          WHERE pm.puuid = ?
          ORDER BY pm.played_at DESC`,
    args: [kushinadaPuuid],
  });

  // Get all StarboyXO's matches
  const starboyMatchRes = await db.execute({
    sql: `SELECT match_id FROM player_matches WHERE puuid = ?`,
    args: [starboyPuuid],
  });

  const starboyMatchIds = new Set(
    starboyMatchRes.rows.map((r) => r.match_id as string),
  );

  // Find matches where Kushinada played with StarboyXO but StarboyXO's match is missing
  const missingMatches = [];

  for (const row of kushMatchRes.rows) {
    const match = JSON.parse(row.data as string);

    // Filter for current season + Flex queue
    if (
      match.info.gameStartTimestamp < SEASON_START_EPOCH ||
      match.info.queueId !== QUEUE_FLEX
    ) {
      continue;
    }

    const matchId = match.metadata.matchId;

    // Check if StarboyXO was in this match
    const starboyInMatch = match.info.participants.some(
      (p: { puuid: string }) => p.puuid === starboyPuuid,
    );

    if (starboyInMatch) {
      // Check if this match exists in StarboyXO's database
      const inStarboyDb = starboyMatchIds.has(matchId);

      if (!inStarboyDb) {
        missingMatches.push({
          matchId,
          shortId: matchId.split("_")[1],
          timestamp: match.info.gameStartTimestamp,
          date: new Date(match.info.gameStartTimestamp).toISOString(),
          inKushinadaDb: true,
          inStarboyDb: false,
        });
      }
    }
  }

  // Get StarboyXO's sync log
  const syncRes = await db.execute({
    sql: `SELECT last_sync, match_count FROM sync_log WHERE puuid = ?`,
    args: [starboyPuuid],
  });

  const syncLog = syncRes.rows[0]
    ? {
        lastSync: new Date(syncRes.rows[0].last_sync as number).toISOString(),
        matchCount: syncRes.rows[0].match_count as number,
      }
    : null;

  return NextResponse.json(
    {
      starboyXO: {
        puuid: starboyPuuid,
        totalMatchesInDb: starboyMatchIds.size,
        syncLog,
      },
      missingMatches: {
        count: missingMatches.length,
        matches: missingMatches,
      },
      analysis:
        missingMatches.length > 0
          ? "These matches exist in Kushinada's DB but not in StarboyXO's DB. This prevents them from being detected as group matches."
          : "No missing matches found - all shared matches are in both databases.",
    },
    { status: 200 },
  );
}
