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

export function calculateBusinessMatchScore(input: { name: string; address?: string | null }, candidate: { name: string; address?: string | null; roadAddress?: string | null }) {
  const nameScore = diceCoefficient(normalizeBusinessText(input.name), normalizeBusinessText(candidate.name));
  const sourceAddress = normalizeBusinessText(input.address);
  const candidateAddress = normalizeBusinessText(candidate.roadAddress || candidate.address);
  const addressScore = sourceAddress && candidateAddress ? diceCoefficient(sourceAddress, candidateAddress) : 0;
  return Math.max(0, Math.min(1, Number((nameScore * 0.7 + addressScore * 0.3).toFixed(3))));
}