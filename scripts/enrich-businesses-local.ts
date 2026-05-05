import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";
import { calculateBusinessMatchScore, buildBusinessEnrichmentKey, type BusinessEnrichmentEntry, type BusinessEnrichmentSnapshot } from "../src/lib/business-enrichment";

loadEnvConfig(process.cwd());

const PLACE_TARGETS = ["ANIMAL_HOSPITAL", "PHARMACY", "GROOMING", "DAYCARE", "FUNERAL"] as const;
const TARGETS = ["ALL", "RESTAURANT", ...PLACE_TARGETS] as const;
type Target = (typeof TARGETS)[number];

type Args = {
  target: Target;
  limit: number;
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
  score: number;
};

const SOURCE_PRIORITY: Record<ExternalCandidate["source"], number> = {
  KAKAO: 0,
  NAVER: 1,
  GOOGLE: 2,
};

function printHelp() {
  console.log(`댕냥지도 업체 외부 장소 정보 보강\n\n사용법:\n  npm run enrich:businesses -- --target=ALL --limit=20 --dry-run\n  npm run enrich:businesses -- --target=ANIMAL_HOSPITAL --limit=50 --dry-run\n  npm run enrich:businesses -- --validate-only\n\n옵션:\n  --target=ALL|RESTAURANT|ANIMAL_HOSPITAL|PHARMACY|GROOMING|DAYCARE|FUNERAL\n  --limit=1..100\n  --dry-run       API 조회와 매칭 결과만 출력하고 파일을 쓰지 않습니다.\n  --validate-only 인자와 스크립트 구조만 검증합니다. API 키와 DB 연결이 없어도 실행됩니다.\n\n환경변수:\n  KAKAO_REST_API_KEY\n  NAVER_CLIENT_ID\n  NAVER_CLIENT_SECRET\n  GOOGLE_PLACES_API_KEY`);
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
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("[enrich-businesses] --limit은 1부터 100 사이의 정수여야 합니다.");
  }

  return {
    target: targetValue as Target,
    limit,
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
  const json = await response.json() as { documents?: Array<{ place_name?: string; category_name?: string; phone?: string; road_address_name?: string; address_name?: string; place_url?: string }> };

  return (json.documents ?? []).map((item) => {
    const candidate = {
      source: "KAKAO" as const,
      name: item.place_name ?? "",
      category: item.category_name ?? null,
      phone: item.phone ?? null,
      roadAddress: item.road_address_name ?? null,
      address: item.address_name ?? null,
      url: item.place_url ?? null,
      score: 0,
    };
    return { ...candidate, score: calculateBusinessMatchScore({ name: target.name, address: target.address }, candidate) };
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
      score: 0,
    };
    return { ...candidate, score: calculateBusinessMatchScore({ name: target.name, address: target.address }, candidate) };
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
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName,places.nationalPhoneNumber",
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
      score: 0,
    };
    return { ...candidate, score: calculateBusinessMatchScore({ name: target.name, address: target.address }, candidate) };
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
    console.log(JSON.stringify({ ok: true, target: args.target, limit: args.limit, dryRun: args.dryRun, targets: TARGETS }, null, 2));
    return;
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const naverClientId = process.env.NAVER_CLIENT_ID;
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
  const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!kakaoKey && (!naverClientId || !naverClientSecret) && !googlePlacesKey) {
    throw new Error("[enrich-businesses] 외부 로컬 검색 API 키가 없습니다. KAKAO_REST_API_KEY, NAVER_CLIENT_ID/NAVER_CLIENT_SECRET, GOOGLE_PLACES_API_KEY 중 하나를 설정한 뒤 --dry-run으로 먼저 확인하세요. 키 없이 구조만 확인하려면 --validate-only를 사용하세요.");
  }

  const targets = await collectTargets(args.target, args.limit);
  const entries: BusinessEnrichmentSnapshot = {};

  for (const target of targets) {
    const candidates = [
      ...(await fetchKakaoCandidates(target, kakaoKey)),
      ...(await fetchNaverCandidates(target, naverClientId, naverClientSecret)),
      ...(await fetchGoogleCandidates(target, googlePlacesKey)),
    ].sort(sortCandidates);
    const best = candidates[0];
    if (best) entries[buildBusinessEnrichmentKey(target.targetType, target.targetId)] = toEntry(target, best);
  }

  if (args.dryRun) {
    console.log(JSON.stringify({ target: args.target, limit: args.limit, checked: targets.length, entries }, null, 2));
    return;
  }

  const snapshot = await readSnapshot();
  const nextSnapshot = { ...snapshot, ...entries };
  const filePath = path.join(process.cwd(), "public", "data", "business-enrichment.json");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(nextSnapshot, null, 2)}\n`);
  console.log(JSON.stringify({ written: Object.keys(entries).length, filePath }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});