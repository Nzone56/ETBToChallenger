import { NextRequest, NextResponse } from "next/server";
import { getPlayerRoleStackStats } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const puuid = searchParams.get("puuid");
  const role = searchParams.get("role");
  const stackSizeStr = searchParams.get("stackSize");
  
  if (!puuid || !role || !stackSizeStr) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }
  
  const stackSize = parseInt(stackSizeStr, 10);
  if (isNaN(stackSize)) {
    return NextResponse.json(
      { error: "Invalid stackSize" },
      { status: 400 }
    );
  }
  
  try {
    const stats = await getPlayerRoleStackStats(puuid, role, stackSize);
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching role+stack stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
