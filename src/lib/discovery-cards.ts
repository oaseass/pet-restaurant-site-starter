import type { BusinessEnrichmentEntry, BusinessEnrichmentSnapshot, BusinessEnrichmentTargetType } from "@/lib/business-enrichment";
import type { PublicReviewSummarySnapshot } from "@/lib/public-data";

export const PLACE_CATEGORY_MAP_KEY: Record<string, string> = {
  ANIMAL_HOSPITAL: "hospitals",
  PHARMACY: "pharmacy",
  GROOMING: "grooming",
  DAYCARE: "daycare",
  FUNERAL: "funeral",
};

export function getPlaceMapCategoryKey(category?: string | null) {
  return category ? PLACE_CATEGORY_MAP_KEY[category] ?? "all" : "all";
}

export function hasUsableCoordinates(lat?: number | null, lng?: number | null) {
  return typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng);
}

export function buildDiscoveryMapHref({
  categoryKey,
  name,
  lat,
  lng,
}: {
  categoryKey: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
}) {
  if (hasUsableCoordinates(lat, lng)) {
    return `/map?category=${categoryKey}&lat=${lat!.toFixed(6)}&lng=${lng!.toFixed(6)}`;
  }
  return `/map?category=${categoryKey}&q=${encodeURIComponent(name)}`;
}

export function formatDiscoveryDate(value?: string | Date | null) {
  if (!value) return "최근 정보 확인 중";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "최근 정보 확인 중";
  return date.toLocaleDateString("ko-KR");
}

export function buildReviewHref(targetType: "RESTAURANT" | "PLACE", targetId: string) {
  return `/reviews/new?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`;
}

export function getReviewSummaryLabel(reviewCount?: number | null, averageOverall?: number | null) {
  if (!reviewCount || reviewCount <= 0) return "아직 후기가 없어요";
  const countLabel = `리뷰 ${reviewCount.toLocaleString("ko-KR")}건`;
  return averageOverall && averageOverall > 0 ? `${countLabel} · 평점 ${averageOverall.toFixed(1)}` : countLabel;
}

export function buildDiscoveryEnrichmentKey(targetType: BusinessEnrichmentTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

export function getPublicReviewSummary(
  snapshot: PublicReviewSummarySnapshot,
  targetType: "RESTAURANT" | "PLACE",
  targetId: string,
) {
  return snapshot[`${targetType}:${targetId}`] ?? null;
}

export function getDiscoveryQualityScore({
  phone,
  externalHref,
  externalCategory,
  reviewCount,
  hasCoordinates,
}: {
  phone?: string | null;
  externalHref?: string | null;
  externalCategory?: string | null;
  reviewCount?: number | null;
  hasCoordinates?: boolean;
}) {
  return (
    (reviewCount && reviewCount > 0 ? 8 : 0) +
    (phone ? 5 : 0) +
    (externalHref || externalCategory ? 4 : 0) +
    (hasCoordinates ? 2 : 0)
  );
}

export function getTrustedBusinessEnrichment(
  snapshot: BusinessEnrichmentSnapshot,
  targetType: BusinessEnrichmentTargetType,
  targetId: string,
  category?: string | null,
) {
  if (targetType === "PLACE" && (category === "GROOMING" || category === "DAYCARE")) return null;
  const entry = snapshot[buildDiscoveryEnrichmentKey(targetType, targetId)];
  if (!entry || entry.matchScore < 0.85) return null;
  return entry;
}

export function getBusinessExternalHref(entry?: BusinessEnrichmentEntry | null) {
  return entry?.kakaoPlaceUrl ?? entry?.externalPlaceUrl ?? entry?.naverPlaceUrl ?? entry?.googleMapsUri ?? null;
}

export function getBusinessExternalCategory(entry?: BusinessEnrichmentEntry | null) {
  return entry?.externalCategory ?? entry?.kakaoCategoryName ?? entry?.naverCategory ?? entry?.googlePrimaryType ?? null;
}

export function getBusinessPhone(primaryPhone?: string | null, entry?: BusinessEnrichmentEntry | null) {
  return primaryPhone?.trim() || entry?.phone || entry?.kakaoPhone || null;
}

export function getExternalInfoLabel(entry?: BusinessEnrichmentEntry | null) {
  return entry ? "지도 정보와 비교했어요" : "정부 공개자료를 정리했어요";
}

export function getPlaceVisitHint(category?: string | null) {
  if (category === "ANIMAL_HOSPITAL") return "지금 진료 가능한지 먼저 전화해보는 게 좋습니다.";
  if (category === "PHARMACY") return "찾는 동물의약품이 있는지 전화로 물어보세요.";
  if (category === "GROOMING") return "견종·크기·피부 상태에 따라 예약 조건이 달라질 수 있어요.";
  if (category === "DAYCARE") return "호텔링이나 장기 위탁은 예방접종 확인을 요구할 수 있어요.";
  if (category === "FUNERAL") return "상담 전 화장·봉안·픽업 가능 여부를 확인하세요.";
  return "운영 방식은 업체마다 다를 수 있어요.";
}

export function getRestaurantVisitHint() {
  return "강아지랑 앉을 좌석은 매장마다 달라요. 실내·야외 여부를 전화로 확인하면 헛걸음을 줄일 수 있어요.";
}