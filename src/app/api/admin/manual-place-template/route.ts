import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { buildManualPlaceTemplateBuffer, MANUAL_PLACE_TEMPLATE_FILE_NAME } from "@/lib/admin/manual-place-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);
  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const buffer = buildManualPlaceTemplateBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${MANUAL_PLACE_TEMPLATE_FILE_NAME}"`,
      "Cache-Control": "no-store",
    },
  });
}