import type { BusinessEnrichmentEntry, BusinessEnrichmentSnapshot, BusinessEnrichmentTargetType } from "@/lib/business-enrichment";
import type { PublicReviewSummarySnapshot } from "@/lib/public-data";

export type DiscoveryPlaceCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

export type DiscoveryVisualKind = "restaurant" | "hospital" | "pharmacy" | "grooming" | "daycare" | "funeral";

export type DiscoveryIdentity = {
  visualKind: DiscoveryVisualKind;
  eyebrow: string;
  identityLabel: string;
  description: string;
  serviceLabel: string;
  missingInfoLabel: string;
  visitHint: string;
};

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

export function simplifyExternalCategory(value?: string | null) {
  if (!value) return null;
  const cleaned = value
    .split(/[>·/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();
  return cleaned || value.trim();
}

function getRestaurantKindLabel(businessType?: string | null, externalCategory?: string | null) {
  const external = simplifyExternalCategory(externalCategory);
  if (external && !/음식점|식당|푸드/i.test(external)) return external;
  if (external) return external;
  const business = businessType?.trim();
  if (business && !["일반음식점", "휴게음식점"].includes(business)) return business;
  return "반려동물 동반 식당";
}

export function getRestaurantIdentity({
  businessType,
  externalCategory,
}: {
  businessType?: string | null;
  externalCategory?: string | null;
}): DiscoveryIdentity {
  const identityLabel = getRestaurantKindLabel(businessType, externalCategory);
  const hasExternalCategory = Boolean(simplifyExternalCategory(externalCategory));
  return {
    visualKind: "restaurant",
    eyebrow: "식당",
    identityLabel,
    description: hasExternalCategory
      ? `카카오 장소정보에서는 ${identityLabel} 성격의 음식점으로 확인된 곳입니다. 대표 메뉴와 동반 좌석 정보는 아직 제보가 필요합니다.`
      : "반려동물 동반 식당으로 등록된 곳입니다. 대표 메뉴와 동반 좌석 정보는 아직 제보가 필요합니다.",
    serviceLabel: "대표 메뉴는 아직 등록되지 않았어요",
    missingInfoLabel: "대표 메뉴 제보하기",
    visitHint: getRestaurantVisitHint(),
  };
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function getHospitalKindLabel(text: string, externalCategory?: string | null) {
  if (includesAny(text, ["24시", "24시간", "야간", "응급"])) return "24시 후보 병원";
  if (includesAny(text, ["의료센터", "메디컬센터", "센터"])) return "동물의료센터";
  if (text.includes("가축")) return "가축병원";
  return simplifyExternalCategory(externalCategory) ?? "동물병원";
}

function getDaycareKindLabel(text: string, externalCategory?: string | null) {
  if (includesAny(text, ["호텔", "호텔링", "펜션"])) return "호텔·위탁";
  if (includesAny(text, ["훈련", "스쿨", "학교", "교육"])) return "훈련·유치원";
  if (includesAny(text, ["유치원", "놀이", "데이케어"])) return "유치원";
  return simplifyExternalCategory(externalCategory) ?? "유치원·호텔";
}

function getFuneralKindLabel(text: string, externalCategory?: string | null) {
  if (includesAny(text, ["화장", "장묘", "추모", "봉안"])) return "장례·화장";
  if (text.includes("픽업")) return "운구 상담";
  return simplifyExternalCategory(externalCategory) ?? "장례 상담";
}

export function getPlaceIdentity({
  category,
  name,
  externalCategory,
}: {
  category?: string | null;
  name?: string | null;
  externalCategory?: string | null;
}): DiscoveryIdentity {
  const text = `${name ?? ""} ${externalCategory ?? ""}`;
  if (category === "ANIMAL_HOSPITAL") {
    const identityLabel = getHospitalKindLabel(text, externalCategory);
    return {
      visualKind: "hospital",
      eyebrow: "병원",
      identityLabel,
      description: "동물병원 등록 정보가 있는 곳입니다. 진료시간과 응급 진료 여부는 전화로 확인해보세요.",
      serviceLabel: "진료 항목은 업체 확인이 필요해요",
      missingInfoLabel: "진료 정보 제보하기",
      visitHint: getPlaceVisitHint(category),
    };
  }
  if (category === "PHARMACY") {
    return {
      visualKind: "pharmacy",
      eyebrow: "약국",
      identityLabel: simplifyExternalCategory(externalCategory) ?? "동물약국",
      description: "동물약국 등록 정보가 있는 곳입니다. 찾는 약품 재고는 방문 전 전화 확인이 좋습니다.",
      serviceLabel: "취급 약품은 업체 확인이 필요해요",
      missingInfoLabel: "약품 정보 제보하기",
      visitHint: getPlaceVisitHint(category),
    };
  }
  if (category === "GROOMING") {
    return {
      visualKind: "grooming",
      eyebrow: "미용",
      identityLabel: "미용 예약",
      description: "반려동물 미용 관련 업체입니다. 견종·크기·피부 상태에 따라 예약 가능 여부가 달라질 수 있습니다.",
      serviceLabel: "미용 서비스는 업체마다 달라요",
      missingInfoLabel: "서비스 정보 제보하기",
      visitHint: getPlaceVisitHint(category),
    };
  }
  if (category === "DAYCARE") {
    const identityLabel = getDaycareKindLabel(text, externalCategory);
    return {
      visualKind: "daycare",
      eyebrow: "유치원·호텔",
      identityLabel,
      description: "위탁·호텔·훈련 서비스는 업체마다 운영 방식이 달라 방문 전 상담이 필요합니다.",
      serviceLabel: "운영 서비스는 업체 확인이 필요해요",
      missingInfoLabel: "운영 서비스 제보하기",
      visitHint: getPlaceVisitHint(category),
    };
  }
  if (category === "FUNERAL") {
    const identityLabel = getFuneralKindLabel(text, externalCategory);
    return {
      visualKind: "funeral",
      eyebrow: "장례",
      identityLabel,
      description: "반려동물 장례 관련 업체입니다. 화장·봉안·픽업 가능 여부와 비용은 상담 전 확인하세요.",
      serviceLabel: "비용과 절차는 업체 상담이 필요해요",
      missingInfoLabel: "장례 서비스 제보하기",
      visitHint: getPlaceVisitHint(category),
    };
  }
  return {
    visualKind: "hospital",
    eyebrow: "장소",
    identityLabel: simplifyExternalCategory(externalCategory) ?? "반려생활 장소",
    description: "반려생활 관련 장소입니다. 운영 방식과 이용 조건은 방문 전 업체에 확인해 주세요.",
    serviceLabel: "서비스 정보는 업체 확인이 필요해요",
    missingInfoLabel: "서비스 정보 제보하기",
    visitHint: getPlaceVisitHint(category),
  };
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