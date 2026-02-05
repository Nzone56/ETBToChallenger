import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches } from "@/app/lib/service";
import { QUEUE_FLEX, SEASON_START_EPOCH } from "@/app/data/constants";

// Season start as epoch seconds (Riot API uses seconds)
const SEASON_START_SECONDS = Math.floor(SEASON_START_EPOCH / 1000);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const puuid = searchParams.get("puuid");
  const start = parseInt(searchParams.get("start") ?? "0", 10);
  const count = parseInt(searchParams.get("count") ?? "10", 10);

  if (!puuid) {
    return NextResponse.json({ error: "puuid is required" }, { status: 400 });
  }

  try {
    const matches = await getPlayerMatches(
      puuid,
      QUEUE_FLEX,
      count,
      start,
      SEASON_START_SECONDS,
    );
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
