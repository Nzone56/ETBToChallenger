import { NextRequest, NextResponse } from "next/server";
import { getMatchesByPuuid } from "@/app/lib/db";
import { getParticipant, isRemake } from "@/app/lib/helpers";
import type { Match } from "@/app/types/riot";

// GET /api/matches?puuid=X&start=0&count=10&result=win&champion=Ahri&companions=puuid1,puuid2
// Serves paginated match history from SQLite with optional filters — zero Riot API calls.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const puuid = searchParams.get("puuid");
  const start = parseInt(searchParams.get("start") ?? "0", 10);
  const count = parseInt(searchParams.get("count") ?? "10", 10);
  const resultFilter = searchParams.get("result") ?? "all"; // all | win | loss | remake
  const championFilter = searchParams.get("champion") ?? "";
  const companionsParam = searchParams.get("companions") ?? "";
  const companionPuuids = companionsParam ? companionsParam.split(",") : [];

  if (!puuid) {
    return NextResponse.json({ error: "puuid is required" }, { status: 400 });
  }

  console.log(
    `[DB  →] /api/matches  puuid=${puuid.slice(0, 12)}… start=${start} count=${count} result=${resultFilter} champ=${championFilter} companions=${companionPuuids.length}`,
  );

  try {
    const all = (await getMatchesByPuuid(puuid)) as Match[];

    // Apply filters
    const filtered = all.filter((match) => {
      const p = getParticipant(match, puuid);
      if (!p) return false;
      const remake = isRemake(match.info.gameDuration);

      // Result filter
      if (resultFilter === "remake" && !remake) return false;
      if (resultFilter === "win" && (remake || !p.win)) return false;
      if (resultFilter === "loss" && (remake || p.win)) return false;

      // Champion filter
      if (championFilter && p.championName !== championFilter) return false;

      // Companion filter — all selected companions must appear in the match
      if (companionPuuids.length > 0) {
        const matchPuuids = new Set(
          match.info.participants.map((pt) => pt.puuid),
        );
        if (!companionPuuids.every((cp) => matchPuuids.has(cp))) return false;
      }

      return true;
    });

    const matches = filtered.slice(start, start + count);
    console.log(
      `[DB  ✓] /api/matches  returned ${matches.length}/${filtered.length} filtered (${all.length} total)`,
    );
    return NextResponse.json({ matches, totalFiltered: filtered.length });
  } catch (error) {
    console.error("[DB  ✗] /api/matches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
