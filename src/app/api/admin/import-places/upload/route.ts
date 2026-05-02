import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { getPlaceSourceEntry, PLACE_SOURCE_KEYS } from "@/lib/place-source-registry";
import { parsePlaceFile } from "@/lib/place-import-parser";
import { importPlacesFromRows, logPlaceImportSync } from "@/lib/place-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 50MB 파일 크기 제한
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "multipart/form-data 파싱 실패" }, { status: 400 });
  }

  const file = formData.get("file");
  const categoryRaw = String(formData.get("category") ?? "").trim().toUpperCase();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, message: "업로드할 CSV 또는 XLSX 파일을 선택해 주세요." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, message: "파일 크기가 50MB를 초과합니다." }, { status: 413 });
  }

  if (!PLACE_SOURCE_KEYS.includes(categoryRaw as (typeof PLACE_SOURCE_KEYS)[number])) {
    return NextResponse.json(
      { ok: false, message: `지원하지 않는 카테고리입니다: ${categoryRaw}. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  const entry = getPlaceSourceEntry(categoryRaw);
  if (!entry) {
    return NextResponse.json({ ok: false, message: "카테고리 정보를 찾을 수 없습니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 확장자로 포맷 힌트
  const fileName = file.name.toLowerCase();
  const formatHint = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")
    ? "xlsx" as const
    : fileName.endsWith(".csv")
      ? "csv" as const
      : undefined;

  const parseResult = parsePlaceFile(buffer, formatHint);
  if (parseResult.rows.length === 0) {
    return NextResponse.json({
      ok: false,
      message: `파싱된 레코드가 없습니다 (총 ${parseResult.totalParsed}행 중 ${parseResult.skippedCount}행 스킵). 파일 형식 및 컬럼명을 확인해 주세요.`,
    }, { status: 422 });
  }

  // DB upsert
  const importResult = await importPlacesFromRows(parseResult.rows, {
    category: entry.category,
    syncSource: entry.syncSource,
    sourceUrl: `manual-upload:${entry.syncSource}`,
  });

  // SyncLog 기록
  await logPlaceImportSync({
    syncSource: entry.syncSource,
    mode: "admin-file-upload",
    result: importResult,
    sourceUrl: `manual-upload:${entry.syncSource}`,
  });

  return NextResponse.json({
    ok: true,
    category: categoryRaw,
    label: entry.label,
    fileName: file.name,
    parseFormat: parseResult.format,
    totalParsed: parseResult.totalParsed,
    skippedByParser: parseResult.skippedCount,
    ...importResult,
  });
}
