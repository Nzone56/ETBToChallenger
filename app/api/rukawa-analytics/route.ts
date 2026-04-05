import { NextResponse } from "next/server";
import { getRukawaAnalytics } from "@/app/lib/rukawaAnalytics";

export const revalidate = 900;
export const dynamic = "force-static";

export async function GET() {
  try {
    const analytics = await getRukawaAnalytics();
    return NextResponse.json(analytics, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Rukawa analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Rukawa analytics" },
      { status: 500 },
    );
  }
}
