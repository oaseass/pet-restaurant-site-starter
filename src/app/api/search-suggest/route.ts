import { NextRequest, NextResponse } from "next/server";
import { getRestaurantsLightSnapshot } from "@/lib/public-data";
import { getSuggestions } from "@/lib/public-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  const restaurants = await getRestaurantsLightSnapshot();
  const suggestions = getSuggestions(restaurants, q, 8);

  return NextResponse.json(suggestions, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
