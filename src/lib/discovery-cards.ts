import type { BusinessEnrichmentEntry, BusinessEnrichmentSnapshot, BusinessEnrichmentTargetType } from "@/lib/business-enrichment";

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
  if (!value) return "기준일 확인 필요";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "기준일 확인 필요";
  return date.toLocaleDateString("ko-KR");
}

export function buildReviewHref(targetType: "RESTAURANT" | "PLACE", targetId: string) {
  return `/reviews/new?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`;
}

export function getReviewSummaryLabel(reviewCount?: number | null) {
  return reviewCount && reviewCount > 0 ? `리뷰 ${reviewCount.toLocaleString("ko-KR")}건` : "첫 리뷰 대기";
}

export function buildDiscoveryEnrichmentKey(targetType: BusinessEnrichmentTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
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
  return entry ? "외부정보 있음" : "공공 데이터";
}