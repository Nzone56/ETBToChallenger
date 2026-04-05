import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/app/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("id");

  if (!matchId) {
    return NextResponse.json({ error: "Missing match id" }, { status: 400 });
  }

  await ensureSchema();
  const db = getDb();

  // Check if match exists
  const matchRes = await db.execute({
    sql: "SELECT data FROM matches WHERE match_id = ?",
    args: [matchId],
  });

  if (matchRes.rows.length === 0) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const match = JSON.parse(matchRes.rows[0].data as string);

  // Check which team members played in this match
  const teamPuuids = [
    "lFyi_2UFJ-PMBJ08NTvWFX9XkUWHRr_XWMm4b3-Pa0xUDSMagvDmBwvi5t_cQBYS01LD06jQMM7fhQ", // Kushinada
    "o-eueo_Rj3kNgxS_gsEGqe4NNpnDff7zkBVBegb2ExHZgcj9LAUmxD75drbOAytQ7zKJgF8qYX5Gmg", // Androw
    "11oD1XEZFGtPP3XbD5U6MwlXu8BCBl2y0J3WLBRGPfZ4IUT7Z2BuvF3Mg5HLl6KMSFkkp0ItuNeqZA", // Rukawa
    "CvuR8LbbBF1ZsbgVww1Db_c4dCNi_F-RSTaG__FPQEmhNthP3B4cieAmNBu-pdX-tNkM5iEt6LOQrg", // Bloomer
    "DTj7M1_aQ5JFUNJUTWgnA5oQNr-ugLzM2kzRwZw71zgd-n2R5x4gl0FKwpcT0JE-HlVbcDFhbVInHA", // StarboyXO
    "BjkZo4bvEmVaIC4QP3zF8dVROR-wd18zRuykZq3PgjXj3f0LwgMm0eF6awBVrnUIJVBgKy4iR1hAdg", // 7Fabian
    "KtOzHG-noTJT6ZQIm41XZCzxxPUc-TrhJSOCBNyaclfwUvdzJ_SBzFMsVwFLXPIN9Zr_Hh53uUItqQ", // Trafalgar
  ];

  const teamNames = [
    "Kushinada Lucyna",
    "Androw",
    "Rukawa Kaede",
    "Bloomer",
    "StarboyXO",
    "7Fabian",
    "Trafalgar D Cam",
  ];

  const teamMembersInMatch = [];
  for (let i = 0; i < teamPuuids.length; i++) {
    const participant = match.info.participants.find(
      (p: { puuid: string }) => p.puuid === teamPuuids[i],
    );
    if (participant) {
      teamMembersInMatch.push({
        name: teamNames[i],
        puuid: teamPuuids[i],
        champion: participant.championName,
        win: participant.win,
      });
    }
  }

  // Check if in group_matches table
  const groupRes = await db.execute({
    sql: "SELECT player_list FROM group_matches WHERE match_id = ?",
    args: [matchId],
  });

  const inGroupTable = groupRes.rows.length > 0;
  const groupPlayers = inGroupTable
    ? JSON.parse(groupRes.rows[0].player_list as string)
    : [];

  // Check player_matches table
  const playerMatchesRes = await db.execute({
    sql: "SELECT puuid FROM player_matches WHERE match_id = ?",
    args: [matchId],
  });

  const linkedPuuids = playerMatchesRes.rows.map((r) => r.puuid as string);

  return NextResponse.json(
    {
      matchId,
      teamMembersInMatch: teamMembersInMatch.length,
      teamMembers: teamMembersInMatch,
      inGroupTable,
      groupTablePlayers: groupPlayers,
      linkedInPlayerMatches: linkedPuuids.length,
      linkedPuuids,
      shouldBeInGroupTable: teamMembersInMatch.length >= 2,
      issue:
        teamMembersInMatch.length >= 2 && !inGroupTable
          ? "MISSING FROM GROUP_MATCHES"
          : null,
    },
    { status: 200 },
  );
}
