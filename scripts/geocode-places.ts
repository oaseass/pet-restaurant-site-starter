#!/usr/bin/env tsx
/**
 * Place 좌표화 CLI 스크립트
 * 사용법: npm run geocode:places -- [--category=ANIMAL_HOSPITAL] [--limit=100] [--dry-run]
 */
import { geocodePlacesBatch } from "@/lib/place-geocode";
import { PLACE_SOURCE_KEYS } from "@/lib/place-source-registry";

const CATEGORY_MAP: Record<string, string> = {
  hospital: "ANIMAL_HOSPITAL",
  grooming: "GROOMING",
  daycare: "DAYCARE",
  funeral: "FUNERAL",
  ANIMAL_HOSPITAL: "ANIMAL_HOSPITAL",
  GROOMING: "GROOMING",
  DAYCARE: "DAYCARE",
  FUNERAL: "FUNERAL",
};

function parseArgs(argv: string[]): { category?: string; limit: number; dryRun: boolean } {
  let category: string | undefined;
  let limit = 100;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--category=")) {
      const raw = arg.slice("--category=".length).trim().toUpperCase();
      category = CATEGORY_MAP[raw];
      if (!category) {
        throw new Error(`알 수 없는 카테고리: ${raw}. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}, hospital, grooming, daycare, funeral`);
      }
      continue;
    }

    if (arg === "--category") {
      const next = argv[i + 1];
      if (!next) throw new Error("--category 다음에 값을 입력하세요.");
      const raw = next.trim().toUpperCase();
      category = CATEGORY_MAP[raw];
      if (!category) {
        throw new Error(`알 수 없는 카테고리: ${raw}. 가능한 값: ${PLACE_SOURCE_KEYS.join(", ")}`);
      }
      i++;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const raw = arg.slice("--limit=".length).trim();
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed <= 0) throw new Error(`--limit 값이 유효하지 않습니다: ${raw}`);
      limit = parsed;
      continue;
    }

    if (arg === "--limit") {
      const next = argv[i + 1];
      if (!next) throw new Error("--limit 다음에 숫자를 입력하세요.");
      const parsed = parseInt(next, 10);
      if (isNaN(parsed) || parsed <= 0) throw new Error(`--limit 값이 유효하지 않습니다: ${next}`);
      limit = parsed;
      i++;
      continue;
    }
  }

  return { category, limit, dryRun };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[geocode-places] 시작 — category=${args.category ?? "전체"}, limit=${args.limit}, dryRun=${args.dryRun}`);

  const result = await geocodePlacesBatch(args);

  if (!result.providerConfigured) {
    console.error("[geocode-places] Kakao geocode 환경변수가 설정되지 않았습니다 (KAKAO_REST_API_KEY).");
    process.exit(1);
  }

  console.log(JSON.stringify(
    {
      ...result,
      // 상세 processed 목록은 줄이기
      processed: result.processed.length > 20
        ? [...result.processed.slice(0, 20), { note: `...외 ${result.processed.length - 20}건` }]
        : result.processed,
    },
    null,
    2,
  ));

  if (result.failedCount > 0 && result.updatedCount === 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
