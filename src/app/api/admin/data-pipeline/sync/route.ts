import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { syncPetRestaurants } from "@/lib/foodsafety/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPetRestaurants({ force: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
