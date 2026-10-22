import { NextResponse } from "next/server";
import { getAwardsData } from "@/app/lib/awards";

// Rendered on request, never at build: the build must not touch Turso
// (see page.tsx). The data itself is cached via unstable_cache.
export const dynamic = "force-dynamic";

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
