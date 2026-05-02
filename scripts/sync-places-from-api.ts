#!/usr/bin/env tsx
/**
 * 행정안전부 apis.data.go.kr API에서 동물 시설 데이터를 가져와 Place DB에 import
 * 사용법: npx tsx scripts/sync-places-from-api.ts --category=ANIMAL_HOSPITAL [--limit=100] [--dry-run]
 *
 * 환경변수: DATA_GO_KR_API_KEY (필수)
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { importPlacesFromRows, logPlaceImportSync } from "@/lib/place-import-service";
import { PLACE_SOURCE_KEYS, getPlaceSourceEntry } from "@/lib/place-source-registry";
import type { ParsedPlaceRow as PlaceRow } from "@/lib/place-import-parser";

const API_KEY = process.env.DATA_GO_KR_API_KEY ?? "";
const ROWS_PER_PAGE = 100;
const REQUEST_DELAY_MS = 300;

// 행정안전부 API JSON 응답 아이템 타입
interface ApiItem {
  BPLC_NM?: string;       // 사업장명
  TELNO?: string;          // 전화번호
  LOTNO_ADDR?: string;     // 지번주소
  ROAD_NM_ADDR?: string;   // 도로명주소
  SALS_STTS_NM?: string;   // 영업상태명 (영업/정상, 폐업 등)
  SALS_STTS_CD?: string;   // 영업상태코드
  CRD_INFO_X?: string;     // 좌표X (TM 좌표계)
  CRD_INFO_Y?: string;     // 좌표Y (TM 좌표계)
  MNG_NO?: string;         // 관리번호 (sourceId로 사용)
  DAT_UPDT_PNT?: string;   // 데이터업데이트시간
  // 시도/시군구는 주소에서 파싱
}

interface ApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: number;
      numOfRows: number;
      pageNo: number;
      items: { item: ApiItem | ApiItem[] } | string | null;
    };
  };
}

function parseArgs() {
  let categoryRaw: string | undefined;
  let limit: number | undefined;
  let dryRun = false;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--category=")) categoryRaw = arg.slice("--category=".length);
    else if (arg.startsWith("--limit=")) limit = parseInt(arg.slice("--limit=".length), 10);
    else if (arg === "--dry-run") dryRun = true;
  }

  if (!categoryRaw) {
    console.error(`카테고리를 지정하세요. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}`);
    console.error("사용법: npx tsx scripts/sync-places-from-api.ts --category=ANIMAL_HOSPITAL [--limit=100] [--dry-run]");
    process.exit(1);
  }

  const categoryMap: Record<string, string> = {
    hospital: "ANIMAL_HOSPITAL", grooming: "GROOMING", daycare: "DAYCARE",
    funeral: "FUNERAL", pharmacy: "PHARMACY",
    ANIMAL_HOSPITAL: "ANIMAL_HOSPITAL", PHARMACY: "PHARMACY",
    GROOMING: "GROOMING", DAYCARE: "DAYCARE", FUNERAL: "FUNERAL",
  };
  const category = categoryMap[categoryRaw.toLowerCase()] ?? categoryMap[categoryRaw.toUpperCase()] ?? categoryRaw.toUpperCase();

  return { category, limit, dryRun };
}

/** TM 중부원점 좌표 → WGS84 근사 변환 (오차 ±500m 수준, 빠른 표시용) */
function tmToWgs84(x: number, y: number): { lat: number; lng: number } | null {
  // TM 중부원점: false easting=200000, false northing=500000, 기준경도=127°E, 기준위도=38°N
  if (x < 50000 || x > 400000 || y < 100000 || y > 700000) return null;
  const lng = 127 + (x - 200000) / 88000;
  const lat = 38 + (y - 500000) / 111000;
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;
  return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 };
}

function parseSido(addr: string): { sido: string; sigungu: string } {
  const parts = addr.trim().split(/\s+/);
  return {
    sido: parts[0] ?? "",
    sigungu: parts[1] ?? "",
  };
}

function apiItemToPlaceRow(item: ApiItem): PlaceRow | null {
  const name = item.BPLC_NM?.trim();
  if (!name) return null;

  const address = item.LOTNO_ADDR?.trim() || item.ROAD_NM_ADDR?.trim() || "";
  const roadAddress = item.ROAD_NM_ADDR?.trim() || "";
  const { sido, sigungu } = parseSido(address);

  // 좌표 변환
  let lat: number | undefined;
  let lng: number | undefined;
  const rawX = parseFloat(item.CRD_INFO_X ?? "");
  const rawY = parseFloat(item.CRD_INFO_Y ?? "");
  if (!isNaN(rawX) && !isNaN(rawY) && rawX > 0 && rawY > 0) {
    const coords = tmToWgs84(rawX, rawY);
    if (coords) { lat = coords.lat; lng = coords.lng; }
  }

  // 영업상태 정규화
  const statusCode = item.SALS_STTS_CD ?? "";
  const businessStatus = statusCode === "01" ? "영업/정상"
    : statusCode === "02" ? "폐업"
    : statusCode === "03" ? "휴업"
    : item.SALS_STTS_NM?.trim() ?? "영업/정상";

  return {
    name,
    address: address || null,
    roadAddress: roadAddress || null,
    sido: sido || null,
    sigungu: sigungu || null,
    eupmyeondong: null,
    normalizedAddress: address || roadAddress || null,
    phone: item.TELNO?.trim() || null,
    businessStatus,
    lat: lat ?? null,
    lng: lng ?? null,
    licenseDate: null,
    sourceId: item.MNG_NO?.trim() || null,
    sourceUpdatedAt: item.DAT_UPDT_PNT ? new Date(item.DAT_UPDT_PNT.replace(" ", "T")) : null,
  };
}

async function fetchPage(apiBaseUrl: string, pageNo: number): Promise<{ items: ApiItem[]; totalCount: number }> {
  const url = `${apiBaseUrl}/info?serviceKey=${API_KEY}&numOfRows=${ROWS_PER_PAGE}&pageNo=${pageNo}&type=json`;
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });

  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${await r.text().then((t) => t.slice(0, 200))}`);
  }

  const data = (await r.json()) as ApiResponse;
  const header = data.response?.header;
  if (header?.resultCode !== "00" && header?.resultCode !== "0000" && header?.resultCode !== "0") {
    throw new Error(`API 오류 ${header?.resultCode}: ${header?.resultMsg}`);
  }

  const body = data.response?.body;
  const totalCount = body?.totalCount ?? 0;
  const rawItems = body?.items;

  if (!rawItems || typeof rawItems === "string") return { items: [], totalCount };

  const itemData = (rawItems as { item: ApiItem | ApiItem[] }).item;
  const items: ApiItem[] = Array.isArray(itemData) ? itemData : itemData ? [itemData] : [];
  return { items, totalCount };
}

async function fetchAllPages(apiBaseUrl: string, maxRows?: number): Promise<ApiItem[]> {
  console.log(`[API] 첫 페이지 조회 중...`);
  const { items: firstItems, totalCount } = await fetchPage(apiBaseUrl, 1);

  const effectiveTotal = maxRows ? Math.min(totalCount, maxRows) : totalCount;
  const totalPages = Math.ceil(effectiveTotal / ROWS_PER_PAGE);

  console.log(`[API] 전체 ${totalCount}건 → ${effectiveTotal}건 (${totalPages}페이지) 수집`);

  const allItems: ApiItem[] = [...firstItems];

  for (let page = 2; page <= totalPages; page++) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    console.log(`[API] 페이지 ${page}/${totalPages} 요청 중...`);
    const { items } = await fetchPage(apiBaseUrl, page);
    allItems.push(...items);

    if (maxRows && allItems.length >= maxRows) {
      return allItems.slice(0, maxRows);
    }
  }

  return allItems;
}

async function main() {
  const { category, limit, dryRun } = parseArgs();

  if (!API_KEY) {
    console.error("DATA_GO_KR_API_KEY 환경변수가 없습니다.");
    console.error(".env.local에 DATA_GO_KR_API_KEY=<키> 를 추가하세요.");
    process.exit(1);
  }

  const entry = getPlaceSourceEntry(category);
  if (!entry) {
    console.error(`카테고리 정보 없음: ${category}`);
    process.exit(1);
  }

  console.log(`\n[sync-places-from-api]`);
  console.log(`  카테고리: ${category} (${entry.label})`);
  console.log(`  API:      ${entry.apiBaseUrl}/info`);
  console.log(`  제한:     ${limit ?? "전체"}`);
  console.log(`  dry-run:  ${dryRun}\n`);

  // API에서 전체 데이터 수집
  const apiItems = await fetchAllPages(entry.apiBaseUrl, limit);
  console.log(`\n[파싱] API 응답 ${apiItems.length}건 변환 중...`);

  const rows: PlaceRow[] = [];
  let skipCount = 0;
  for (const item of apiItems) {
    const row = apiItemToPlaceRow(item);
    if (row) rows.push(row);
    else skipCount++;
  }

  console.log(`[파싱] 유효 ${rows.length}건, 스킵 ${skipCount}건`);

  if (rows.length === 0) {
    console.error("변환된 레코드가 없습니다.");
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n[dry-run] 샘플 3건:`);
    rows.slice(0, 3).forEach((r) =>
      console.log(`  ${r.name} | ${(r.address ?? "").slice(0, 30)} | lat:${r.lat} | ${r.businessStatus}`)
    );
    console.log("\n[dry-run] DB import 건너뜀 ✓");
    return;
  }

  // DB import
  const result = await importPlacesFromRows(rows, {
    category: entry.category,
    syncSource: entry.syncSource,
    sourceUrl: `${entry.apiBaseUrl}/info`,
  });

  await logPlaceImportSync({
    syncSource: entry.syncSource,
    mode: "api-sync",
    result,
    sourceUrl: `${entry.apiBaseUrl}/info`,
  });

  console.log(`\n[결과]`);
  console.log(`  totalRows: ${result.totalRows}`);
  console.log(`  created:   ${result.created}`);
  console.log(`  updated:   ${result.updated}`);
  console.log(`  skipped:   ${result.skipped}`);
  console.log(`  failed:    ${result.failed}`);
  if (result.errors?.length > 0) {
    console.log(`  에러 샘플:`, result.errors.slice(0, 5));
  }

  console.log(`\n[완료] 다음 단계: npx tsx scripts/export-public-data.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
