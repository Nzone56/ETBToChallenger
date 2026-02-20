import { NextRequest, NextResponse } from "next/server";
import {
  getRankedSnapshot,
  getPlayerStats,
  getMatchesByPuuid,
} from "@/app/lib/db";
import { getUserByRiotId } from "@/app/data/users";
import type {
  Summoner,
  LeagueEntry,
  PlayerAggregatedStats,
  Match,
} from "@/app/types/riot";

// GET /api/player/[gameName] — player data from DB (0 Riot API calls)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameName: string }> },
) {
  const { gameName } = await params;
  const decoded = decodeURIComponent(gameName);
  const user = getUserByRiotId(decoded, "ETB");

  if (!user) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const snap = await getRankedSnapshot(user.puuid);
  if (!snap) {
    return NextResponse.json(
      { error: "DB_EMPTY", message: "No data yet. Run /api/sync first." },
      { status: 503 },
    );
  }

  const summoner: Summoner | null = snap.summonerJson
    ? JSON.parse(snap.summonerJson)
    : null;
  const flexEntry: LeagueEntry | null = snap.flexEntryJson
    ? JSON.parse(snap.flexEntryJson)
    : null;

  const statsRow = await getPlayerStats(user.puuid);
  const stats: PlayerAggregatedStats | null = statsRow
    ? (statsRow as PlayerAggregatedStats)
    : null;

  const matches = (await getMatchesByPuuid(user.puuid)) as Match[];

  return NextResponse.json({
    puuid: user.puuid,
    gameName: user.gameName,
    tagLine: user.tagLine,
    summoner,
    flexEntry,
    stats,
    matches,
  });
}
