import { NextResponse } from "next/server";
import { getPlayerStackStats } from "@/app/lib/db";
import { users } from "@/app/data/users";

export async function GET() {
  const puuids = users.map((u) => u.puuid);
  const stackStats = await getPlayerStackStats(puuids);
  
  // Map to game names for readability
  const userMap = new Map(users.map((u) => [u.puuid, u.gameName]));
  const readable = stackStats.map((s) => ({
    gameName: userMap.get(s.puuid) ?? s.puuid,
    solo: { games: s.soloGames, wins: s.soloWins },
    duo: { games: s.duoGames, wins: s.duoWins },
    trio: { games: s.trioGames, wins: s.trioWins },
    penta: { games: s.pentaGames, wins: s.pentaWins },
    total: s.soloGames + s.duoGames + s.trioGames + s.pentaGames,
  }));
  
  return NextResponse.json(readable, { status: 200 });
}
