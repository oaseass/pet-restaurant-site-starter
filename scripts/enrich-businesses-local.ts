import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  calculateBusinessMatchScoreDetailed,
  buildBusinessEnrichmentKey,
  type BusinessEnrichmentEntry,
  type BusinessEnrichmentSnapshot,
  type BusinessMatchScoreDetails,
} from "../src/lib/business-enrichment";

loadEnvConfig(process.cwd());

const PLACE_TARGETS = ["ANIMAL_HOSPITAL", "PHARMACY", "GROOMING", "DAYCARE", "FUNERAL"] as const;
const TARGETS = ["ALL", "RESTAURANT", ...PLACE_TARGETS] as const;
type Target = (typeof TARGETS)[number];

type Args = {
  target: Target;
  limit: number;
  concurrency: number;
  skipExisting: boolean;
  dryRun: boolean;
  validateOnly: boolean;
  help: boolean;
};

type BusinessTarget = {
  targetType: "RESTAURANT" | "PLACE";
  targetId: string;
  category: Exclude<Target, "ALL">;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

type ExternalCandidate = {
  source: "KAKAO" | "NAVER" | "GOOGLE";
  name: string;
  category?: string | null;
  phone?: string | null;
  roadAddress?: string | null;
  address?: string | null;
  url?: string | null;
  lat?: number | null;
  lng?: number | null;
  score: number;
  assessment: BusinessMatchScoreDetails;
};

type ExternalCandidateDraft = Omit<ExternalCandidate, "score" | "assessment">;

type ProcessedTarget = {
  target: BusinessTarget;
  candidates: ExternalCandidate[];
  best?: ExternalCandidate;
  entry?: BusinessEnrichmentEntry;
  report: ReturnType<typeof toTargetReport>;
};

const SOURCE_PRIORITY: Record<ExternalCandidate["source"], number> = {
  KAKAO: 0,
  NAVER: 1,
  GOOGLE: 2,
};

function printHelp() {
  console.log(`댕냥지도 업체 외부 장소 정보 보강\n\n사용법:\n  npm run enrich:businesses -- --target=ALL --limit=20 --dry-run\n  npm run enrich:businesses -- --target=RESTAURANT --limit=500 --concurrency=3 --skip-existing\n  npm run enrich:businesses -- --validate-only\n\n옵션:\n  --target=ALL|RESTAURANT|ANIMAL_HOSPITAL|PHARMACY|GROOMING|DAYCARE|FUNERAL\n  --limit=1..1000\n  --concurrency=1..5 동시 API 처리 수입니다. 기본값은 3입니다.\n  --skip-existing  이미 public/data/business-enrichment.json에 있는 key는 API 호출 전 제외합니다. 기본값은 켜짐입니다.\n  --no-skip-existing 기존 항목도 다시 조회합니다.\n  --dry-run       API 조회와 매칭 결과만 출력하고 파일을 쓰지 않습니다. 원본/후보/matchScore/반영 가능 여부/거절 사유를 확인합니다.\n  --validate-only 인자, 스크립트 구조, API 키 존재 여부만 검증합니다. DB 연결이 없어도 실행됩니다.\n\n저장 정책:\n  matchScore 0.85 이상이면서 이름·주소 지역·카테고리 조건을 통과한 후보만 public/data/business-enrichment.json에 반영합니다.\n  matchScore 0.65~0.84 후보는 관리자 확인 필요 후보로만 dry-run에 기록하고 상세 페이지에는 자동 표시하지 않습니다.\n  matchScore 0.65 미만 후보는 저장하지 않습니다.\n\n환경변수:\n  KAKAO_REST_API_KEY\n  NAVER_CLIENT_ID\n  NAVER_CLIENT_SECRET\n  GOOGLE_PLACES_API_KEY 또는 GOOGLE_MAPS_API_KEY`);
}

function readOption(args: string[], name: string) {
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1];
  return undefined;
}

function parseArgs(argv: string[]): Args {
  const targetValue = (readOption(argv, "target") ?? "ALL").toUpperCase();
  if (!TARGETS.includes(targetValue as Target)) {
    throw new Error(`[enrich-businesses] 지원하지 않는 target입니다: ${targetValue}. 가능 값: ${TARGETS.join(", ")}`);
  }

  const rawLimit = readOption(argv, "limit") ?? "10";
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error("[enrich-businesses] --limit은 1부터 1000 사이의 정수여야 합니다.");
  }

  const rawConcurrency = readOption(argv, "concurrency") ?? "3";
  const concurrency = Number(rawConcurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) {
    throw new Error("[enrich-businesses] --concurrency는 1부터 5 사이의 정수여야 합니다.");
  }

  return {
    target: targetValue as Target,
    limit,
    concurrency,
    skipExisting: !argv.includes("--no-skip-existing"),
    dryRun: argv.includes("--dry-run"),
    validateOnly: argv.includes("--validate-only"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
}

function buildQuery(target: BusinessTarget) {
  const region = target.address?.split(" ").slice(0, 2).join(" ") ?? "";
  return `${region} ${target.name}`.trim();
}

function parseFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function assessCandidate(target: BusinessTarget, candidate: ExternalCandidateDraft): ExternalCandidate {
  const assessment = calculateBusinessMatchScoreDetailed(
    { name: target.name, address: target.address, category: target.category, lat: target.lat, lng: target.lng },
    candidate,
  );
  return { ...candidate, score: assessment.score, assessment };
}

async function fetchKakaoCandidates(target: BusinessTarget, apiKey: string | undefined): Promise<ExternalCandidate[]> {
  if (!apiKey) return [];
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", buildQuery(target));
  url.searchParams.set("size", "5");
  if (typeof target.lat === "number" && typeof target.lng === "number") {
    url.searchParams.set("x", String(target.lng));
    url.searchParams.set("y", String(target.lat));
    url.searchParams.set("radius", "2000");
  }

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`[enrich-businesses] Kakao Local API 오류: ${response.status} ${response.statusText}`);
  const json = await response.json() as { documents?: Array<{ place_name?: string; category_name?: string; phone?: string; road_address_name?: string; address_name?: string; place_url?: string; x?: string; y?: string }> };

  return (json.documents ?? []).map((item) => {
    const candidate = {
      source: "KAKAO" as const,
      name: item.place_name ?? "",
      category: item.category_name ?? null,
      phone: item.phone ?? null,
      roadAddress: item.road_address_name ?? null,
      address: item.address_name ?? null,
      url: item.place_url ?? null,
      lat: parseFiniteNumber(item.y),
      lng: parseFiniteNumber(item.x),
    };
    return assessCandidate(target, candidate);
  });
}

async function fetchNaverCandidates(target: BusinessTarget, clientId: string | undefined, clientSecret: string | undefined): Promise<ExternalCandidate[]> {
  if (!clientId || !clientSecret) return [];
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", buildQuery(target));
  url.searchParams.set("display", "5");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`[enrich-businesses] Naver Local API 오류: ${response.status} ${response.statusText}`);
  const json = await response.json() as { items?: Array<{ title?: string; category?: string; telephone?: string; roadAddress?: string; address?: string; link?: string }> };

  return (json.items ?? []).map((item) => {
    const candidate = {
      source: "NAVER" as const,
      name: stripHtml(item.title),
      category: stripHtml(item.category),
      phone: item.telephone ?? null,
      roadAddress: item.roadAddress ?? null,
      address: item.address ?? null,
      url: item.link ?? null,
      lat: null,
      lng: null,
    };
    return assessCandidate(target, candidate);
  });
}

async function fetchGoogleCandidates(target: BusinessTarget, apiKey: string | undefined): Promise<ExternalCandidate[]> {
  if (!apiKey) return [];
  const body: Record<string, unknown> = {
    textQuery: buildQuery(target),
    languageCode: "ko",
    regionCode: "KR",
    maxResultCount: 5,
  };
  if (typeof target.lat === "number" && typeof target.lng === "number") {
    body.locationBias = {
      circle: {
        center: { latitude: target.lat, longitude: target.lng },
        radius: 2000,
      },
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName,places.nationalPhoneNumber,places.location",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`[enrich-businesses] Google Places API 오류: ${response.status} ${response.statusText}`);
  const json = await response.json() as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      googleMapsUri?: string;
      primaryType?: string;
      primaryTypeDisplayName?: { text?: string };
      nationalPhoneNumber?: string;
      location?: { latitude?: number; longitude?: number };
    }>;
  };

  return (json.places ?? []).map((item) => {
    const candidate = {
      source: "GOOGLE" as const,
      name: item.displayName?.text ?? "",
      category: item.primaryTypeDisplayName?.text ?? item.primaryType ?? null,
      phone: item.nationalPhoneNumber ?? null,
      roadAddress: item.formattedAddress ?? null,
      address: item.formattedAddress ?? null,
      url: item.googleMapsUri ?? null,
      lat: parseFiniteNumber(item.location?.latitude),
      lng: parseFiniteNumber(item.location?.longitude),
    };
    return assessCandidate(target, candidate);
  });
}

function qualityBand(score: number) {
  if (score >= 0.85) return 2;
  if (score >= 0.65) return 1;
  return 0;
}

function sortCandidates(left: ExternalCandidate, right: ExternalCandidate) {
  const bandDiff = qualityBand(right.score) - qualityBand(left.score);
  if (bandDiff !== 0) return bandDiff;
  const priorityDiff = SOURCE_PRIORITY[left.source] - SOURCE_PRIORITY[right.source];
  if (priorityDiff !== 0) return priorityDiff;
  return right.score - left.score;
}

function getApiKeyStatus() {
  const naverReady = Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
  const googleReady = Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
  return {
    keys: {
      KAKAO_REST_API_KEY: Boolean(process.env.KAKAO_REST_API_KEY),
      NAVER_CLIENT_ID: Boolean(process.env.NAVER_CLIENT_ID),
      NAVER_CLIENT_SECRET: Boolean(process.env.NAVER_CLIENT_SECRET),
      GOOGLE_PLACES_API_KEY: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      GOOGLE_MAPS_API_KEY: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    },
    providers: {
      KAKAO: Boolean(process.env.KAKAO_REST_API_KEY),
      NAVER: naverReady,
      GOOGLE: googleReady,
    },
    missing: [
      process.env.KAKAO_REST_API_KEY ? null : "KAKAO_REST_API_KEY",
      process.env.NAVER_CLIENT_ID ? null : "NAVER_CLIENT_ID",
      process.env.NAVER_CLIENT_SECRET ? null : "NAVER_CLIENT_SECRET",
      googleReady ? null : "GOOGLE_PLACES_API_KEY 또는 GOOGLE_MAPS_API_KEY",
    ].filter(Boolean),
    hasAnyProvider: Boolean(process.env.KAKAO_REST_API_KEY || naverReady || googleReady),
  };
}

function toCandidateReport(candidate: ExternalCandidate) {
  return {
    source: candidate.source,
    candidateName: candidate.name,
    candidateCategory: candidate.category ?? null,
    candidatePhone: candidate.phone ?? null,
    candidateRoadAddress: candidate.roadAddress ?? null,
    candidateAddress: candidate.address ?? null,
    candidateUrl: candidate.url ?? null,
    candidateLat: candidate.lat ?? null,
    candidateLng: candidate.lng ?? null,
    matchScore: candidate.score,
    nameScore: candidate.assessment.nameScore,
    addressScore: candidate.assessment.addressScore,
    regionMatches: candidate.assessment.regionMatches,
    categoryMatches: candidate.assessment.categoryMatches,
    distanceKm: candidate.assessment.distanceKm,
    autoApplicable: candidate.assessment.autoApplicable,
    decision: candidate.assessment.decision,
    rejectReasons: candidate.assessment.rejectReasons,
  };
}

function groupCandidateReports(candidates: ExternalCandidate[]) {
  return {
    KAKAO: candidates.filter((candidate) => candidate.source === "KAKAO").map(toCandidateReport),
    NAVER: candidates.filter((candidate) => candidate.source === "NAVER").map(toCandidateReport),
    GOOGLE: candidates.filter((candidate) => candidate.source === "GOOGLE").map(toCandidateReport),
  };
}

function toTargetReport(target: BusinessTarget, candidates: ExternalCandidate[], selected: ExternalCandidate | undefined) {
  return {
    original: {
      targetType: target.targetType,
      targetId: target.targetId,
      category: target.category,
      name: target.name,
      address: target.address,
      lat: target.lat,
      lng: target.lng,
    },
    autoApply: selected ? toCandidateReport(selected) : null,
    needsReviewCandidates: candidates
      .filter((candidate) => candidate.assessment.decision === "NEEDS_REVIEW")
      .map(toCandidateReport),
    rejectedCandidates: candidates
      .filter((candidate) => candidate.assessment.decision === "REJECT")
      .map(toCandidateReport),
    candidatesBySource: groupCandidateReports(candidates),
  };
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}

async function processTarget(
  target: BusinessTarget,
  keys: { kakaoKey?: string; naverClientId?: string; naverClientSecret?: string; googlePlacesKey?: string },
): Promise<ProcessedTarget> {
  const candidates = [
    ...(await fetchKakaoCandidates(target, keys.kakaoKey)),
    ...(await fetchNaverCandidates(target, keys.naverClientId, keys.naverClientSecret)),
    ...(await fetchGoogleCandidates(target, keys.googlePlacesKey)),
  ].sort(sortCandidates);
  const best = candidates.find((candidate) => candidate.assessment.autoApplicable);
  return {
    target,
    candidates,
    best,
    entry: best ? toEntry(target, best) : undefined,
    report: toTargetReport(target, candidates, best),
  };
}

async function collectTargets(target: Target, limit: number): Promise<BusinessTarget[]> {
  const { prisma } = await import("../src/lib/prisma");
  const targets: BusinessTarget[] = [];

  if (target === "ALL" || target === "RESTAURANT") {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: limit,
      select: { id: true, name: true, address: true, lat: true, lng: true },
    });
    targets.push(...restaurants.map((item) => ({
      targetType: "RESTAURANT" as const,
      targetId: item.id,
      category: "RESTAURANT" as const,
      name: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
    })));
  }

  if (targets.length >= limit) return targets.slice(0, limit);

  const placeCategories = target === "ALL" ? PLACE_TARGETS : PLACE_TARGETS.includes(target as (typeof PLACE_TARGETS)[number]) ? [target as (typeof PLACE_TARGETS)[number]] : [];
  if (placeCategories.length > 0) {
    const places = await prisma.place.findMany({
      where: { isActive: true, category: { in: [...placeCategories] } },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: limit - targets.length,
      select: { id: true, category: true, name: true, address: true, roadAddress: true, lat: true, lng: true },
    });
    targets.push(...places.map((item) => ({
      targetType: "PLACE" as const,
      targetId: item.id,
      category: item.category as Exclude<Target, "ALL">,
      name: item.name,
      address: item.roadAddress ?? item.address,
      lat: item.lat,
      lng: item.lng,
    })));
  }

  return targets.slice(0, limit);
}

async function readSnapshot(): Promise<BusinessEnrichmentSnapshot> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "business-enrichment.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as BusinessEnrichmentSnapshot : {};
  } catch {
    return {};
  }
}

function toEntry(target: BusinessTarget, candidate: ExternalCandidate): BusinessEnrichmentEntry {
  const checkedAt = new Date().toISOString();
  return {
    targetType: target.targetType,
    targetId: target.targetId,
    source: candidate.source,
    matchScore: candidate.score,
    matchedName: candidate.name || null,
    externalCategory: candidate.category || null,
    phone: candidate.phone || null,
    roadAddress: candidate.roadAddress || null,
    jibunAddress: candidate.address || null,
    externalPlaceUrl: candidate.url || null,
    kakaoPlaceUrl: candidate.source === "KAKAO" ? candidate.url || null : null,
    naverPlaceUrl: candidate.source === "NAVER" ? candidate.url || null : null,
    googleMapsUri: candidate.source === "GOOGLE" ? candidate.url || null : null,
    kakaoPlaceName: candidate.source === "KAKAO" ? candidate.name || null : null,
    kakaoCategoryName: candidate.source === "KAKAO" ? candidate.category || null : null,
    kakaoPhone: candidate.source === "KAKAO" ? candidate.phone || null : null,
    kakaoRoadAddress: candidate.source === "KAKAO" ? candidate.roadAddress || null : null,
    naverTitle: candidate.source === "NAVER" ? candidate.name || null : null,
    naverCategory: candidate.source === "NAVER" ? candidate.category || null : null,
    naverLink: candidate.source === "NAVER" ? candidate.url || null : null,
    googlePlaceName: candidate.source === "GOOGLE" ? candidate.name || null : null,
    googlePrimaryType: candidate.source === "GOOGLE" ? candidate.category || null : null,
    enrichedAt: checkedAt,
    checkedAt,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.validateOnly) {
    const apiKeyStatus = getApiKeyStatus();
    console.log(JSON.stringify({ ok: true, target: args.target, limit: args.limit, concurrency: args.concurrency, skipExisting: args.skipExisting, dryRun: args.dryRun, targets: TARGETS, apiKeyStatus }, null, 2));
    return;
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
  const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const apiKeyStatus = getApiKeyStatus();
  if (!apiKeyStatus.hasAnyProvider) {
    throw new Error(`[enrich-businesses] 외부 로컬 검색 API 키가 없습니다. 누락: ${apiKeyStatus.missing.join(", ")}. KAKAO_REST_API_KEY, NAVER_CLIENT_ID/NAVER_CLIENT_SECRET, GOOGLE_PLACES_API_KEY 또는 GOOGLE_MAPS_API_KEY 중 하나를 설정한 뒤 --dry-run으로 먼저 확인하세요. 키 없이 구조만 확인하려면 --validate-only를 사용하세요.`);
  }

  const snapshot = await readSnapshot();
  const targets = await collectTargets(args.target, args.limit);
  const targetsToProcess = args.skipExisting
    ? targets.filter((target) => !snapshot[buildBusinessEnrichmentKey(target.targetType, target.targetId)])
    : targets;
  const skippedExisting = targets.length - targetsToProcess.length;
  const entries: BusinessEnrichmentSnapshot = {};
  const processed = await mapWithConcurrency(targetsToProcess, args.concurrency, (target) => processTarget(target, { kakaoKey, naverClientId, naverClientSecret, googlePlacesKey }));
  const reports = processed.map((item) => item.report);
  for (const item of processed) {
    if (item.entry) entries[buildBusinessEnrichmentKey(item.target.targetType, item.target.targetId)] = item.entry;
  }

  if (args.dryRun) {
    console.log(JSON.stringify({
      target: args.target,
      limit: args.limit,
      concurrency: args.concurrency,
      skipExisting: args.skipExisting,
      requestedTargets: targets.length,
      skippedExisting,
      checked: targetsToProcess.length,
      apiKeyStatus,
      autoApplicableCount: Object.keys(entries).length,
      policy: {
        autoApply: "matchScore >= 0.85 && 이름/주소 지역/카테고리 조건 통과",
        needsReview: "0.65 <= matchScore < 0.85: 관리자 확인 필요 후보, 상세 페이지 자동 표시 금지",
        reject: "matchScore < 0.65: 저장하지 않음",
      },
      entries,
      reports,
    }, null, 2));
    return;
  }

  if (Object.keys(entries).length === 0) {
    console.log(JSON.stringify({
      written: 0,
      requestedTargets: targets.length,
      skippedExisting,
      checked: targetsToProcess.length,
      reason: "자동 반영 기준(matchScore >= 0.85 및 필수 조건)을 통과한 후보가 없습니다.",
    }, null, 2));
    return;
  }

  const nextSnapshot = { ...snapshot, ...entries };
  const filePath = path.join(process.cwd(), "public", "data", "business-enrichment.json");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(nextSnapshot, null, 2)}\n`);
  console.log(JSON.stringify({ written: Object.keys(entries).length, requestedTargets: targets.length, skippedExisting, checked: targetsToProcess.length, filePath }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});