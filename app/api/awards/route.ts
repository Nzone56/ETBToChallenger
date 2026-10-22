import { NextResponse } from "next/server";
import { getAwardsData } from "@/app/lib/awards";

export const revalidate = 900;
export const dynamic = "force-static";

export async function GET() {
  try {
    const awards = await getAwardsData();
    return NextResponse.json(awards, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Awards data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch awards data" },
      { status: 500 },
    );
  }
}
