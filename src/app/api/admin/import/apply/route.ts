import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import {
  applyManualPlaceImportRows,
  isManualPlaceApprovalTokenValid,
  MANUAL_IMPORT_SUPPORTED_CATEGORIES,
  type ManualPlaceImportRow,
} from "@/lib/admin/manual-place-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplyRequestBody = {
  rows?: ManualPlaceImportRow[];
  approvalToken?: string;
  targetCategory?: string | null;
};

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as ApplyRequestBody;
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, message: "승인할 preview 데이터가 없습니다." }, { status: 400 });
  }

  if (!isManualPlaceApprovalTokenValid(rows, String(body.approvalToken ?? ""))) {
    return NextResponse.json({ ok: false, message: "preview 승인 토큰이 유효하지 않습니다." }, { status: 400 });
  }

  const targetCategory = body.targetCategory && MANUAL_IMPORT_SUPPORTED_CATEGORIES.includes(body.targetCategory as (typeof MANUAL_IMPORT_SUPPORTED_CATEGORIES)[number])
    ? body.targetCategory as (typeof MANUAL_IMPORT_SUPPORTED_CATEGORIES)[number]
    : undefined;

  try {
    const result = await applyManualPlaceImportRows(rows, {
      supportedCategories: MANUAL_IMPORT_SUPPORTED_CATEGORIES,
      expectedCategory: targetCategory,
    });

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/search");
    revalidatePath("/places");
    revalidatePath("/admin");
    revalidatePath("/admin/import");
    revalidatePath("/admin/places");

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}