import { NextRequest, NextResponse } from "next/server";
import { getMatchesByPuuid } from "@/app/lib/db";
import type { Match } from "@/app/types/riot";

// GET /api/matches?puuid=X&start=0&count=10
// Serves paginated match history from SQLite — zero Riot API calls.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const puuid = searchParams.get("puuid");
  const start = parseInt(searchParams.get("start") ?? "0", 10);
  const count = parseInt(searchParams.get("count") ?? "10", 10);

  if (!puuid) {
    return NextResponse.json({ error: "puuid is required" }, { status: 400 });
  }

  console.log(
    `[DB  →] /api/matches  puuid=${puuid.slice(0, 12)}… start=${start} count=${count}`,
  );

  try {
    const all = (await getMatchesByPuuid(puuid)) as Match[];
    const matches = all.slice(start, start + count);
    console.log(
      `[DB  ✓] /api/matches  returned ${matches.length}/${all.length} matches`,
    );
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[DB  ✗] /api/matches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
