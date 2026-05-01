import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import {
  createManualPlaceApprovalToken,
  MANUAL_IMPORT_SUPPORTED_CATEGORIES,
  previewManualPlaceWorkbook,
} from "@/lib/admin/manual-place-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const secret = request.nextUrl.searchParams.get("secret") ?? String(formData.get("secret") ?? "");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, message: "업로드할 XLSX 또는 CSV 파일을 선택해 주세요." }, { status: 400 });
  }

  const targetCategoryValue = String(formData.get("targetCategory") ?? "").trim();
  const expectedCategory = MANUAL_IMPORT_SUPPORTED_CATEGORIES.includes(targetCategoryValue as (typeof MANUAL_IMPORT_SUPPORTED_CATEGORIES)[number])
    ? targetCategoryValue as (typeof MANUAL_IMPORT_SUPPORTED_CATEGORIES)[number]
    : undefined;

  try {
    const preview = await previewManualPlaceWorkbook({
      buffer: Buffer.from(await file.arrayBuffer()),
      supportedCategories: MANUAL_IMPORT_SUPPORTED_CATEGORIES,
      expectedCategory,
    });

    return NextResponse.json({
      ok: true,
      preview: {
        ...preview,
        approvalToken: createManualPlaceApprovalToken(preview.rows),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}