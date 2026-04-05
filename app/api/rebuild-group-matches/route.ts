import { NextResponse } from "next/server";
import {
  getMatchesByPuuid,
  storeGroupMatches,
  type SlimGroupMatch,
} from "@/app/lib/db";
import { findGroupMatches } from "@/app/lib/helpers";
import { users } from "@/app/data/users";
import type { Match } from "@/app/types/riot";

async function rebuildGroupMatches() {
  try {
    console.log("[REBUILD] Starting group_matches table rebuild...");

    // Load all matches for all players
    const allPlayerMatches = await Promise.all(
      users.map(async (u) => ({
        puuid: u.puuid,
        gameName: u.gameName,
        matches: (await getMatchesByPuuid(u.puuid)) as Match[],
      })),
    );

    console.log(`[REBUILD] Loaded matches for ${users.length} players`);

    // Find all group matches
    const grouped = findGroupMatches(allPlayerMatches);

    console.log(`[REBUILD] Found ${grouped.length} group matches`);

    // Store them
    await storeGroupMatches(
      grouped.map(({ match, players }) => {
        const slim: SlimGroupMatch = {
          metadata: { matchId: match.metadata.matchId },
          info: {
            gameDuration: match.info.gameDuration,
            participants: match.info.participants.map((p) => ({
              puuid: p.puuid,
              win: p.win,
              championName: p.championName,
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
            })),
          },
        };
        return {
          matchId: match.metadata.matchId,
          matchData: slim,
          playerList: players,
          playedAt: match.info.gameStartTimestamp,
        };
      }),
    );

    console.log(`[REBUILD] Stored ${grouped.length} group matches`);

    // Sample some matches to show what was found
    const sample = grouped.slice(0, 5).map(({ match, players }) => ({
      matchId: match.metadata.matchId,
      stackSize: players.length,
      players: players.map((p) => p.gameName),
    }));

    return NextResponse.json(
      {
        success: true,
        totalGroupMatches: grouped.length,
        sample,
        message: "group_matches table rebuilt successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[REBUILD] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return rebuildGroupMatches();
}

export async function POST() {
  return rebuildGroupMatches();
}
