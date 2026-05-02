#!/usr/bin/env tsx
/**
 * 로컬 CSV/XLSX 파일을 직접 Place DB에 import하는 스크립트
 * 사용법: npx tsx scripts/import-places-from-file.ts --file=path/to/file.csv --category=ANIMAL_HOSPITAL [--limit=100]
 *
 * data.go.kr에서 다운로드한 CSV 파일을 로컬에서 직접 import할 때 사용.
 * admin 서버 없이 Prisma 직접 호출.
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import * as fs from "node:fs";
import * as path from "node:path";
import { parsePlaceFile } from "@/lib/place-import-parser";
import { importPlacesFromRows, logPlaceImportSync } from "@/lib/place-import-service";
import { PLACE_SOURCE_KEYS, getPlaceSourceEntry } from "@/lib/place-source-registry";

const CATEGORY_ALIAS: Record<string, string> = {
  hospital: "ANIMAL_HOSPITAL",
  grooming: "GROOMING",
  daycare: "DAYCARE",
  funeral: "FUNERAL",
  ANIMAL_HOSPITAL: "ANIMAL_HOSPITAL",
  GROOMING: "GROOMING",
  DAYCARE: "DAYCARE",
  FUNERAL: "FUNERAL",
};

function parseArgs() {
  let filePath: string | undefined;
  let categoryRaw: string | undefined;
  let limit: number | undefined;
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--file=")) {
      filePath = arg.slice("--file=".length).trim();
    } else if (arg === "--file") {
      filePath = argv[++i];
    } else if (arg.startsWith("--category=")) {
      categoryRaw = arg.slice("--category=".length).trim();
    } else if (arg === "--category") {
      categoryRaw = argv[++i];
    } else if (arg.startsWith("--limit=")) {
      limit = parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--limit") {
      limit = parseInt(argv[++i], 10);
    }
  }

  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-places-from-file.ts --file=<path> --category=<ANIMAL_HOSPITAL|GROOMING|DAYCARE|FUNERAL> [--limit=100]");
    console.error(`  Supported categories: ${PLACE_SOURCE_KEYS.join(", ")}`);
    process.exit(1);
  }

  const category = categoryRaw ? CATEGORY_ALIAS[categoryRaw.toUpperCase()] : undefined;
  if (!category) {
    console.error(`카테고리를 지정하세요. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}`);
    process.exit(1);
  }

  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`파일을 찾을 수 없습니다: ${absPath}`);
    process.exit(1);
  }

  return { filePath: absPath, category, limit };
}

async function main() {
  const { filePath, category, limit } = parseArgs();
  const entry = getPlaceSourceEntry(category);
  if (!entry) {
    console.error(`카테고리 정보를 찾을 수 없습니다: ${category}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  const formatHint = ext === ".xlsx" || ext === ".xls" ? "xlsx" as const : ext === ".csv" ? "csv" as const : undefined;

  console.log(`\n[import-places-from-file]`);
  console.log(`  파일:      ${filePath}`);
  console.log(`  카테고리:  ${category} (${entry.label})`);
  console.log(`  형식 힌트: ${formatHint ?? "자동 감지"}`);
  console.log(`  제한:      ${limit ?? "전체"}\n`);

  const buffer = Buffer.from(fs.readFileSync(filePath));
  const parseResult = parsePlaceFile(buffer, formatHint);

  console.log(`[파싱] ${parseResult.format} 형식, 총 ${parseResult.totalParsed}행, 스킵 ${parseResult.skippedCount}행, 유효 ${parseResult.rows.length}건`);

  if (parseResult.rows.length === 0) {
    console.error("파싱된 레코드가 없습니다. 파일 형식과 컬럼명을 확인하세요.");
    process.exit(1);
  }

  // limit 적용
  const rows = limit ? parseResult.rows.slice(0, limit) : parseResult.rows;
  if (limit) {
    console.log(`[제한] ${limit}건만 import합니다 (전체 ${parseResult.rows.length}건 중)\n`);
  }

  // DB import
  const result = await importPlacesFromRows(rows, {
    category: entry.category,
    syncSource: entry.syncSource,
    sourceUrl: `file-import:${path.basename(filePath)}`,
  });

  // SyncLog 기록
  await logPlaceImportSync({
    syncSource: entry.syncSource,
    mode: "local-file-import",
    result,
    sourceUrl: `file-import:${path.basename(filePath)}`,
  });

  console.log(`[결과]`);
  console.log(`  totalRows: ${result.totalRows}`);
  console.log(`  created:   ${result.created}`);
  console.log(`  updated:   ${result.updated}`);
  console.log(`  skipped:   ${result.skipped}`);
  console.log(`  failed:    ${result.failed}`);

  if (result.errors && result.errors.length > 0) {
    console.log(`  에러 (상위 10건):`);
    result.errors.slice(0, 10).forEach((e) => console.log(`    행 ${e.row}: ${e.name} — ${e.reason}`));
  }

  if (result.created === 0 && result.updated === 0 && result.failed > 0) {
    console.error("\n[WARNING] import된 건수가 0이고 실패가 있습니다. 컬럼 매핑을 확인하세요.");
    process.exit(1);
  }

  console.log(`\n[import-places-from-file] 완료 ✓`);
  console.log(`다음 단계:`);
  console.log(`  1. npm run geocode:places -- --category=${category} --limit=100`);
  console.log(`  2. npx tsx scripts/export-public-data.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
