import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/app/lib/db";

export async function GET() {
  await ensureSchema();
  const db = getDb();
  
  // Check for duplicate match_ids in matches table
  const duplicatesRes = await db.execute(`
    SELECT match_id, COUNT(*) as count 
    FROM matches 
    GROUP BY match_id 
    HAVING COUNT(*) > 1
  `);
  
  const duplicates = duplicatesRes.rows.map(r => ({
    matchId: r.match_id as string,
    count: r.count as number,
  }));
  
  // Check for duplicate entries in player_matches
  const playerDuplicatesRes = await db.execute(`
    SELECT puuid, match_id, COUNT(*) as count 
    FROM player_matches 
    GROUP BY puuid, match_id 
    HAVING COUNT(*) > 1
  `);
  
  const playerDuplicates = playerDuplicatesRes.rows.map(r => ({
    puuid: r.puuid as string,
    matchId: r.match_id as string,
    count: r.count as number,
  }));
  
  // Get total counts
  const matchCountRes = await db.execute("SELECT COUNT(*) as c FROM matches");
  const playerMatchCountRes = await db.execute("SELECT COUNT(*) as c FROM player_matches");
  const uniqueMatchesRes = await db.execute("SELECT COUNT(DISTINCT match_id) as c FROM matches");
  const uniquePlayerMatchesRes = await db.execute("SELECT COUNT(DISTINCT match_id || '-' || puuid) as c FROM player_matches");
  
  return NextResponse.json({
    matches: {
      total: matchCountRes.rows[0]?.c as number,
      unique: uniqueMatchesRes.rows[0]?.c as number,
      duplicates: duplicates.length,
      duplicateEntries: duplicates,
    },
    playerMatches: {
      total: playerMatchCountRes.rows[0]?.c as number,
      unique: uniquePlayerMatchesRes.rows[0]?.c as number,
      duplicates: playerDuplicates.length,
      duplicateEntries: playerDuplicates.slice(0, 10), // Show first 10
    },
    analysis: duplicates.length > 0 || playerDuplicates.length > 0
      ? "FOUND DUPLICATES - This is causing overcounting in stack stats"
      : "No duplicates found - issue is elsewhere",
  }, { status: 200 });
}
