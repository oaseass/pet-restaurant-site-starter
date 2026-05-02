import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { getPlaceSourceEntry, PLACE_SOURCE_KEYS } from "@/lib/place-source-registry";
import { fetchOfficialPlaceSource } from "@/lib/place-source-fetch";
import { parsePlaceFile } from "@/lib/place-import-parser";
import { importPlacesFromRows, logPlaceImportSync } from "@/lib/place-import-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let category: string;
  try {
    const body = await request.json() as { category?: string };
    category = String(body.category ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ ok: false, message: "요청 본문이 유효하지 않습니다." }, { status: 400 });
  }

  if (!PLACE_SOURCE_KEYS.includes(category as (typeof PLACE_SOURCE_KEYS)[number])) {
    return NextResponse.json(
      { ok: false, message: `지원하지 않는 카테고리입니다: ${category}. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}` },
      { status: 400 },
    );
  }

  const entry = getPlaceSourceEntry(category);
  if (!entry) {
    return NextResponse.json({ ok: false, message: "카테고리 정보를 찾을 수 없습니다." }, { status: 400 });
  }

  // 공식 원천 fetch (1회, 재시도 없음)
  const fetchResult = await fetchOfficialPlaceSource(entry);
  if (!fetchResult.ok) {
    return NextResponse.json({
      ok: false,
      requiresManualUpload: true,
      message: fetchResult.error,
      sourceUrl: fetchResult.sourceUrl,
      dataGoKrId: entry.dataGoKrId,
    }, { status: 422 });
  }

  // 파싱
  const parseResult = parsePlaceFile(fetchResult.buffer, entry.expectedFormat);
  if (parseResult.rows.length === 0) {
    return NextResponse.json({
      ok: false,
      requiresManualUpload: true,
      message: `파싱된 레코드가 없습니다 (총 ${parseResult.totalParsed}행 중 ${parseResult.skippedCount}행 스킵). 파일 형식을 확인하거나 수동 업로드를 사용하세요.`,
      sourceUrl: fetchResult.sourceUrl,
    }, { status: 422 });
  }

  // DB upsert
  const importResult = await importPlacesFromRows(parseResult.rows, {
    category: entry.category,
    syncSource: entry.syncSource,
    sourceUrl: fetchResult.sourceUrl,
  });

  // SyncLog 기록
  await logPlaceImportSync({
    syncSource: entry.syncSource,
    mode: "admin-manual",
    result: importResult,
    sourceUrl: fetchResult.sourceUrl,
  });

  return NextResponse.json({
    ok: true,
    category,
    label: entry.label,
    sourceUrl: fetchResult.sourceUrl,
    parseFormat: parseResult.format,
    totalParsed: parseResult.totalParsed,
    skippedByParser: parseResult.skippedCount,
    ...importResult,
  });
}
