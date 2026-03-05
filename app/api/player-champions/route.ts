import { NextRequest, NextResponse } from "next/server";
import { getPlayerStats } from "@/app/lib/db";

// GET /api/player-champions?puuid=X
// Returns all unique champion names a player has used this season
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const puuid = searchParams.get("puuid");

  if (!puuid) {
    return NextResponse.json({ error: "puuid is required" }, { status: 400 });
  }

  try {
    const stats = (await getPlayerStats(puuid)) as any;
    if (!stats || !stats.championStats) {
      return NextResponse.json({ champions: [] });
    }

    const champions = stats.championStats
      .map((c: any) => c.championName)
      .sort();

    return NextResponse.json({ champions });
  } catch (error) {
    console.error("[API ✗] /api/player-champions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch champions" },
      { status: 500 },
    );
  }
}
