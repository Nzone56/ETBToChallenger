import { NextResponse } from "next/server";
import { getGroupMatches } from "@/app/lib/db";

// GET /api/group-matches — slim group match data for GroupMatchHistory component
export async function GET() {
  const groupMatches = await getGroupMatches();
  return NextResponse.json(groupMatches);
}
