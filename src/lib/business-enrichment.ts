import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

export type BusinessEnrichmentTargetType = "RESTAURANT" | "PLACE";
export type BusinessEnrichmentSource = "KAKAO" | "NAVER" | "GOOGLE" | "MERGED";

export type BusinessEnrichmentEntry = {
  targetType: BusinessEnrichmentTargetType;
  targetId: string;
  source: BusinessEnrichmentSource;
  matchScore: number;
  matchedName?: string | null;
  externalCategory?: string | null;
  phone?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
  externalPlaceUrl?: string | null;
  kakaoPlaceUrl?: string | null;
  naverPlaceUrl?: string | null;
  googleMapsUri?: string | null;
  kakaoPlaceName?: string | null;
  kakaoCategoryName?: string | null;
  kakaoPhone?: string | null;
  kakaoRoadAddress?: string | null;
  naverTitle?: string | null;
  naverCategory?: string | null;
  naverLink?: string | null;
  googlePlaceName?: string | null;
  googlePrimaryType?: string | null;
  enrichedAt?: string | null;
  checkedAt: string;
};

export type BusinessEnrichmentSnapshot = Record<string, BusinessEnrichmentEntry>;

export type BusinessMatchInput = {
  name: string;
  address?: string | null;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type BusinessMatchCandidate = {
  name: string;
  address?: string | null;
  roadAddress?: string | null;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type BusinessMatchScoreDetails = {
  score: number;
  nameScore: number;
  addressScore: number;
  regionScore: number;
  categoryScore: number;
  distanceScore: number;
  distanceKm: number | null;
  regionMatches: boolean | null;
  categoryMatches: boolean | null;
  autoApplicable: boolean;
  decision: "AUTO_APPLY" | "NEEDS_REVIEW" | "REJECT";
  rejectReasons: string[];
};

const CATEGORY_MATCH_TERMS: Record<string, string[]> = {
  RESTAURANT: ["음식", "식당", "한식", "중식", "일식", "양식", "분식", "카페", "레스토랑", "일반음식점", "휴게음식점"],
  ANIMAL_HOSPITAL: ["동물병원", "동물의료", "수의", "병원"],
  PHARMACY: ["약국", "동물약국", "의약품"],
  GROOMING: ["미용", "애견미용", "반려동물미용", "펫샵"],
  DAYCARE: ["유치원", "호텔", "위탁", "훈련", "반려견놀이터", "애견카페"],
  FUNERAL: ["장례", "장묘", "화장", "추모"],
};

export function buildBusinessEnrichmentKey(targetType: BusinessEnrichmentTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

export const getBusinessEnrichmentSnapshot = cache(async (): Promise<BusinessEnrichmentSnapshot> => {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "business-enrichment.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as BusinessEnrichmentSnapshot;
  } catch {
    return {};
  }
});

export async function getBusinessEnrichmentForTarget(targetType: BusinessEnrichmentTargetType, targetId: string) {
  const snapshot = await getBusinessEnrichmentSnapshot();
  return snapshot[buildBusinessEnrichmentKey(targetType, targetId)] ?? null;
}

export function normalizeBusinessText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[\s\-_.()\[\],/]+/g, "")
    .replace(/주식회사|\(주\)|동물병원|동물의료센터|애견|반려동물|펫/g, "")
    .trim();
}

function normalizeCategoryText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[\s\-_.()\[\],/]+/g, "")
    .trim();
}

function bigrams(value: string) {
  if (value.length <= 1) return value ? [value] : [];
  const chunks: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) chunks.push(value.slice(index, index + 2));
  return chunks;
}

function diceCoefficient(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftChunks = bigrams(left);
  const rightChunks = bigrams(right);
  if (!leftChunks.length || !rightChunks.length) return 0;
  const rightCounts = new Map<string, number>();
  for (const chunk of rightChunks) rightCounts.set(chunk, (rightCounts.get(chunk) ?? 0) + 1);
  let matches = 0;
  for (const chunk of leftChunks) {
    const count = rightCounts.get(chunk) ?? 0;
    if (count > 0) {
      matches += 1;
      rightCounts.set(chunk, count - 1);
    }
  }
  return (2 * matches) / (leftChunks.length + rightChunks.length);
}

function normalizeSido(value: string) {
  const cleaned = value.replace(/특별자치도|특별자치시|특별시|광역시|자치도|도|시$/g, "");
  const map: Record<string, string> = {
    서울: "서울",
    부산: "부산",
    대구: "대구",
    인천: "인천",
    광주: "광주",
    대전: "대전",
    울산: "울산",
    세종: "세종",
    경기: "경기",
    강원: "강원",
    충청북: "충북",
    충북: "충북",
    충청남: "충남",
    충남: "충남",
    전라북: "전북",
    전북: "전북",
    전라남: "전남",
    전남: "전남",
    경상북: "경북",
    경북: "경북",
    경상남: "경남",
    경남: "경남",
    제주: "제주",
  };
  return map[cleaned] ?? cleaned;
}

function parseRegion(address?: string | null) {
  const tokens = (address ?? "").replace(/[(),]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { sido: "", sigungu: "" };
  const sido = normalizeSido(tokens[0]);
  const sigungu = tokens.slice(1).find((token) => /시|군|구$/.test(token)) ?? "";
  return { sido, sigungu };
}

function calculateRegionScore(inputAddress?: string | null, candidateAddress?: string | null) {
  if (!inputAddress || !candidateAddress) return { score: 0, matches: null };
  const left = parseRegion(inputAddress);
  const right = parseRegion(candidateAddress);
  if (!left.sido || !right.sido) return { score: 0, matches: null };
  if (left.sido !== right.sido) return { score: 0, matches: false };
  if (left.sigungu && right.sigungu && left.sigungu !== right.sigungu) return { score: 0.45, matches: false };
  return { score: 1, matches: true };
}

function calculateCategoryScore(inputCategory?: string | null, candidateCategory?: string | null) {
  if (!inputCategory || !candidateCategory) return { score: 0, matches: null };
  const normalizedCategory = normalizeCategoryText(candidateCategory);
  const terms = CATEGORY_MATCH_TERMS[inputCategory] ?? [];
  const matches = terms
    .map((term) => normalizeCategoryText(term))
    .filter(Boolean)
    .some((term) => normalizedCategory.includes(term));
  return { score: matches ? 1 : 0, matches };
}

function hasUsableCoordinate(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value);
}

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateDistanceScore(input: BusinessMatchInput, candidate: BusinessMatchCandidate) {
  if (!hasUsableCoordinate(input.lat) || !hasUsableCoordinate(input.lng) || !hasUsableCoordinate(candidate.lat) || !hasUsableCoordinate(candidate.lng)) {
    return { score: 0.5, distanceKm: null };
  }
  const distanceKm = calculateDistanceKm(input.lat!, input.lng!, candidate.lat!, candidate.lng!);
  if (distanceKm <= 0.5) return { score: 1, distanceKm };
  if (distanceKm <= 1) return { score: 0.85, distanceKm };
  if (distanceKm <= 2) return { score: 0.7, distanceKm };
  if (distanceKm <= 5) return { score: 0.35, distanceKm };
  return { score: 0, distanceKm };
}

export function calculateBusinessMatchScoreDetailed(input: BusinessMatchInput, candidate: BusinessMatchCandidate): BusinessMatchScoreDetails {
  const nameScore = diceCoefficient(normalizeBusinessText(input.name), normalizeBusinessText(candidate.name));
  const sourceAddress = normalizeBusinessText(input.address);
  const candidateAddress = normalizeBusinessText(candidate.roadAddress || candidate.address);
  const addressScore = sourceAddress && candidateAddress ? diceCoefficient(sourceAddress, candidateAddress) : 0;
  const region = calculateRegionScore(input.address, candidate.roadAddress || candidate.address);
  const category = calculateCategoryScore(input.category, candidate.category);
  const distance = calculateDistanceScore(input, candidate);
  const score = Math.max(0, Math.min(1, Number((
    nameScore * 0.45 +
    addressScore * 0.25 +
    region.score * 0.15 +
    category.score * 0.1 +
    distance.score * 0.05
  ).toFixed(3))));
  const rejectReasons: string[] = [];
  if (score < 0.85) rejectReasons.push("matchScore 0.85 미만");
  if (nameScore < 0.5) rejectReasons.push("업체명 유사도 낮음");
  if (region.matches === false) rejectReasons.push("주소 시도/시군구 불일치");
  if (category.matches === false || category.matches === null) rejectReasons.push("카테고리 유사도 미확인");
  if (distance.distanceKm !== null && distance.distanceKm > 5) rejectReasons.push("좌표 거리 5km 초과");
  const autoApplicable = score >= 0.85 && nameScore >= 0.5 && region.matches === true && category.matches === true && (distance.distanceKm === null || distance.distanceKm <= 5);
  const decision = autoApplicable ? "AUTO_APPLY" : score >= 0.65 ? "NEEDS_REVIEW" : "REJECT";
  return {
    score,
    nameScore: Number(nameScore.toFixed(3)),
    addressScore: Number(addressScore.toFixed(3)),
    regionScore: Number(region.score.toFixed(3)),
    categoryScore: Number(category.score.toFixed(3)),
    distanceScore: Number(distance.score.toFixed(3)),
    distanceKm: distance.distanceKm === null ? null : Number(distance.distanceKm.toFixed(3)),
    regionMatches: region.matches,
    categoryMatches: category.matches,
    autoApplicable,
    decision,
    rejectReasons,
  };
}

export function calculateBusinessMatchScore(input: BusinessMatchInput, candidate: BusinessMatchCandidate) {
  return calculateBusinessMatchScoreDetailed(input, candidate).score;
}