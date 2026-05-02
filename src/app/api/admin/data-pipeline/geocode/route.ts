import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { geocodeRestaurantsBatch, MAX_RESTAURANT_GEOCODE_LIMIT } from "@/lib/restaurant-geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let limit = MAX_RESTAURANT_GEOCODE_LIMIT;
  try {
    const body = await request.json() as { limit?: number };
    if (typeof body.limit === "number") {
      limit = Math.min(Math.max(1, body.limit), MAX_RESTAURANT_GEOCODE_LIMIT);
    }
  } catch {
    // body 없으면 기본값 사용
  }

  try {
    const result = await geocodeRestaurantsBatch({ limit, dryRun: false });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
