import { Compass, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { MapCategoryChips } from "@/components/map/MapCategoryChips";
import { MapLocationButton } from "@/components/map/MapLocationButton";
import { MapShell } from "@/components/map/MapShell";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { buildReviewHref, getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getDiscoveryQualityScore, getExternalInfoLabel, getPlaceIdentity, getPublicReviewSummary, getRestaurantIdentity, getReviewSummaryLabel, getTrustedBusinessEnrichment, hasUsableCoordinates } from "@/lib/discovery-cards";
import type { MapCategoryKey, MapCategoryOption, MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { REGION_OPTIONS } from "@/lib/platform-content";
import { filterRestaurantsLight, getCategoryCountsSnapshot, getPlacesByCategorySnapshot, getRestaurantBusinessTypes, getRestaurantsLightSnapshot, getReviewSummariesSnapshot, normalizePublicRestaurantSearchParams, sortRestaurantsLight } from "@/lib/public-data";

const MAP_CATEGORY_LABELS: Record<MapCategoryKey, string> = {
  all: "전체",
  restaurants: "식당",
  hospitals: "병원",
  grooming: "미용",
  daycare: "유치원",
  funeral: "장례",
  pharmacy: "약국",
  "lost-pets": "찾아요",
};

const PLACE_CATEGORY_LABEL: Record<string, string> = {
  ANIMAL_HOSPITAL: "병원",
  GROOMING: "미용",
  DAYCARE: "유치원",
  FUNERAL: "장례",
  PHARMACY: "약국",
};

const PLACE_CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  ANIMAL_HOSPITAL: ["병원", "동물병원", "진료"],
  PHARMACY: ["약국", "동물약국", "동물의약품"],
  GROOMING: ["미용", "반려동물 미용", "애견미용"],
  DAYCARE: ["유치원", "호텔", "위탁", "훈련", "반려동물 유치원"],
  FUNERAL: ["장례", "장묘", "화장", "반려동물 장례"],
};

const CATEGORY_LIST_HREF: Record<MapCategoryKey, string> = {
  all: "/categories",
  restaurants: "/restaurants",
  hospitals: "/hospitals",
  pharmacy: "/pharmacy",
  grooming: "/grooming",
  daycare: "/daycare",
  funeral: "/funeral",
  "lost-pets": "/lost-pets?tab=shelter",
};

const CATEGORY_GUIDANCE_COPY: Record<MapCategoryKey, string> = {
  all: "동네를 고르거나 현재 위치를 쓰면 주변 반려생활 장소를 모아 보여드려요.",
  restaurants: "강아지랑 갈 식당을 동네와 지도에서 같이 살펴보세요.",
  hospitals: "가까운 동물병원을 찾고, 가기 전 전화로 진료 가능 여부를 확인하세요.",
  pharmacy: "동물약국 위치를 찾은 뒤 원하는 약 재고는 전화로 물어보세요.",
  grooming: "반려동물 미용업소를 찾고 견종·크기 조건은 예약 전에 확인하세요.",
  daycare: "유치원·호텔·위탁관리 업체를 찾고 입소 조건은 상담 때 확인하세요.",
  funeral: "반려동물 장례업체 위치를 찾고 비용·픽업 가능 여부는 상담으로 확인하세요.",
  "lost-pets": "보호동물 공고는 찾아요 페이지에서 더 자세히 볼 수 있어요.",
};

const PREPARED_CATEGORY_COPY: Record<Exclude<MapCategoryKey, "restaurants" | "all">, PreparedCategoryState> = {
  pharmacy: {
    title: "동물약국을 동네별로 찾아보세요.",
    description: "지역이나 현재 위치를 적용하면 가까운 약국과 지도 링크를 볼 수 있습니다.",
    note: "원하는 약은 재고가 수시로 달라질 수 있어 전화 확인이 가장 빠릅니다.",
  },
  hospitals: {
    title: "가까운 동물병원을 찾아보세요.",
    description: "지역이나 현재 위치를 적용하면 병원 목록과 지도 링크를 함께 볼 수 있습니다.",
    note: "야간·응급 진료와 예약 방식은 병원마다 다르니 전화로 확인하세요.",
  },
  grooming: {
    title: "미용 예약할 곳을 찾아보세요.",
    description: "지역이나 현재 위치를 적용하면 주변 미용업소를 볼 수 있습니다.",
    note: "견종·크기·피부 상태에 따라 예약 조건이 달라질 수 있어요.",
  },
  daycare: {
    title: "맡길 곳을 동네에서 찾아보세요.",
    description: "지역이나 현재 위치를 적용하면 유치원, 호텔, 위탁관리 업체를 볼 수 있습니다.",
    note: "입소 조건과 예방접종 증명은 상담 전에 챙겨두면 좋아요.",
  },
  funeral: {
    title: "상담 가능한 장례업체를 찾아보세요.",
    description: "지역이나 현재 위치를 적용하면 반려동물 장례업체와 지도 링크를 볼 수 있습니다.",
    note: "화장·봉안·운구 가능 여부와 비용은 업체마다 다릅니다.",
  },
  "lost-pets": {
    title: "보호동물 공고는 찾아요에서 볼 수 있어요.",
    description: "지역과 공고 번호로 보호 중인 아이들을 확인할 수 있습니다.",
    note: "지도 화면은 식당과 생활시설 위치 탐색을 먼저 제공합니다.",
  },
};

const MAP_CATEGORY_META: Record<MapCategoryKey, { pageTitle: string; listTitle: string; listSubtitle: string; mapTitle: string }> = {
  all: {
    pageTitle: "반려동물 장소 지도",
    listTitle: "전체 장소",
    listSubtitle: "식당, 병원, 약국, 미용, 유치원·호텔, 장례를 한 화면에서 찾아보세요.",
    mapTitle: "장소 지도",
  },
  restaurants: {
    pageTitle: "반려동물 동반 식당 지도",
    listTitle: "강아지랑 갈 식당",
    listSubtitle: "동반 등록 식당을 지도와 목록으로 같이 살펴보세요.",
    mapTitle: "식당 지도",
  },
  hospitals: {
    pageTitle: "동물병원 지도",
    listTitle: "동물병원 찾기",
    listSubtitle: "가까운 병원을 찾고, 진료 가능 여부는 전화로 확인하세요.",
    mapTitle: "동물병원 지도",
  },
  grooming: {
    pageTitle: "반려동물 미용 지도",
    listTitle: "미용업소 찾기",
    listSubtitle: "주변 미용업소를 찾고 예약 조건은 업체에 물어보세요.",
    mapTitle: "미용 지도",
  },
  daycare: {
    pageTitle: "유치원·호텔 지도",
    listTitle: "맡길 곳 찾기",
    listSubtitle: "유치원, 호텔, 위탁관리, 훈련 관련 장소를 찾아보세요.",
    mapTitle: "유치원·호텔 지도",
  },
  funeral: {
    pageTitle: "반려동물 장례 지도",
    listTitle: "장례업체 찾기",
    listSubtitle: "상담 가능한 업체를 찾고 절차와 비용은 전화로 확인하세요.",
    mapTitle: "장례 지도",
  },
  pharmacy: {
    pageTitle: "동물약국 지도",
    listTitle: "동물약국 찾기",
    listSubtitle: "가까운 약국을 찾고 필요한 약 재고는 전화로 물어보세요.",
    mapTitle: "동물약국 지도",
  },
  "lost-pets": {
    pageTitle: "찾아요",
    listTitle: "찾아요",
    listSubtitle: "보호동물 공고와 실종 제보는 찾아요 페이지에서 확인하세요.",
    mapTitle: "찾아요",
  },
};

function sanitizePlaceName(name?: string | null): string {
  const value = name?.trim().replace(/^#+\s*/, "").trim();
  if (!value) return "이름 미확인 업체";
  const BLOCKED_NAMES = new Set(["grooming", "daycare", "funeral", "pharmacy", "hospital", "restaurants", "restaurant"]);
  if (BLOCKED_NAMES.has(value.toLowerCase())) return "이름 미확인 업체";
  return value;
}

function isUnknownBusinessName(name?: string | null) {
  return sanitizePlaceName(name) === "이름 미확인 업체";
}

function formatPublicAddress(
  item: { address?: string | null; roadAddress?: string | null; sido?: string | null; sigungu?: string | null },
): string {
  const addr = item.roadAddress ?? item.address ?? "";
  if (addr.includes("*")) {
    return [item.sido, item.sigungu].filter(Boolean).join(" ") || "주소 일부 비공개";
  }
  return addr;
}

const MAP_CATEGORY_ALIASES: Record<string, MapCategoryKey> = {
  all: "all",
  restaurants: "restaurants",
  restaurant: "restaurants",
  hospitals: "hospitals",
  hospital: "hospitals",
  animal_hospital: "hospitals",
  animal_hospitals: "hospitals",
  pharmacy: "pharmacy",
  pharmacies: "pharmacy",
  animal_pharmacy: "pharmacy",
  grooming: "grooming",
  pet_grooming: "grooming",
  daycare: "daycare",
  boarding: "daycare",
  hotel: "daycare",
  training: "daycare",
  funeral: "funeral",
  cremation: "funeral",
  "lost-pets": "lost-pets",
  lost_pets: "lost-pets",
};

function resolveMapCategory(input: string | undefined): MapCategoryKey {
  if (!input) return "all";
  return MAP_CATEGORY_ALIASES[input.toLowerCase().replace(/-/g, "_")] ?? "all";
}

const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 50;

function buildCategoryHref(
  category: MapCategoryKey,
  params: { q: string; sido: string; type: string },
  location?: { lat: number; lng: number; radiusKm?: number },
) {
  const query = new URLSearchParams();
  if (category !== "all" || location) query.set("category", category);
  if (params.q) query.set("q", params.q);
  if (params.sido) query.set("sido", params.sido);
  if (category === "restaurants" && params.type) query.set("type", params.type);
  if (location) {
    query.set("lat", location.lat.toFixed(6));
    query.set("lng", location.lng.toFixed(6));
    query.set("radiusKm", (location.radiusKm ?? DEFAULT_RADIUS_KM).toString());
  }
  return query.size > 0 ? `/map?${query.toString()}` : "/map";
}

function placeMatchesKeyword(place: { category: string; name?: string | null; address?: string | null; roadAddress?: string | null; sido?: string | null; sigungu?: string | null; phone?: string | null }, keyword: string) {
  if (!keyword) return true;
  const haystack = [
    place.name,
    place.address,
    place.roadAddress,
    place.sido,
    place.sigungu,
    place.phone,
    PLACE_CATEGORY_LABEL[place.category],
    ...(PLACE_CATEGORY_SEARCH_TERMS[place.category] ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword.toLowerCase());
}

function compareKnownName(leftName: string, rightName: string) {
  return Number(isUnknownBusinessName(leftName)) - Number(isUnknownBusinessName(rightName));
}

function limitKnownNameFirst<T extends { name: string }>(items: T[], limit: number) {
  const normal = items.filter((item) => !isUnknownBusinessName(item.name));
  if (normal.length >= limit) return normal.slice(0, limit);
  return [...normal, ...items.filter((item) => isUnknownBusinessName(item.name))].slice(0, limit);
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sido?: string; type?: string; category?: string; lat?: string; lng?: string; radiusKm?: string }>;
}) {
  const params = await searchParams;

  // 현재 위치 파싱 (한국 좌표 범위 검증) — category 결정보다 먼저 계산
  const userLatRaw = Number(params.lat);
  const userLngRaw = Number(params.lng);
  const hasUserLocation =
    Number.isFinite(userLatRaw) &&
    Number.isFinite(userLngRaw) &&
    userLatRaw >= 33 &&
    userLatRaw <= 39 &&
    userLngRaw >= 124 &&
    userLngRaw <= 132;
  const userLat = hasUserLocation ? userLatRaw : 0;
  const userLng = hasUserLocation ? userLngRaw : 0;

  const radiusRaw = Number(params.radiusKm);
  const radiusKm = Number.isFinite(radiusRaw) && radiusRaw > 0 && radiusRaw <= MAX_RADIUS_KM ? radiusRaw : DEFAULT_RADIUS_KM;

  const activeCategory = resolveMapCategory(params.category);
  if (activeCategory === "lost-pets") {
    redirect("/lost-pets?tab=shelter");
  }

  const normalized = normalizePublicRestaurantSearchParams({ q: params.q, sido: params.sido, type: params.type });
  const hasRegion = Boolean(normalized.sido);
  const hasKeyword = Boolean(normalized.q.trim());
  const hasResultIntent = hasUserLocation || hasRegion || hasKeyword;

  // /map 또는 /map?category=... 단독 진입은 안내 화면만 표시하고 대용량 데이터 로드를 막는다.
  const isDefaultEntrance = !hasResultIntent;
  const shouldLoadData = hasResultIntent;
  const isRestaurantView = activeCategory === "restaurants";
  const isAllView = activeCategory === "all";

  const CATEGORY_KEY_TO_PLACE: Record<string, string> = {
    hospitals: "ANIMAL_HOSPITAL",
    grooming: "GROOMING",
    daycare: "DAYCARE",
    funeral: "FUNERAL",
    pharmacy: "PHARMACY",
  };
  type PlaceDbCat = "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";
  const ALL_PLACE_DB_CATS: PlaceDbCat[] = ["ANIMAL_HOSPITAL", "PHARMACY", "GROOMING", "DAYCARE", "FUNERAL"];

  // 카테고리별 파일만 로드 — places-light.json 전체 52k 금지
  // shouldLoadMap=false(기본 진입)이면 restaurants/places 데이터 로드 완전 차단
  const activePlaceCategory = CATEGORY_KEY_TO_PLACE[activeCategory] as PlaceDbCat | undefined;
  const needsRestaurants = shouldLoadData && (isRestaurantView || isAllView);
  const needsPlaces = shouldLoadData && (isAllView || Boolean(activePlaceCategory));

  const [categoryCounts, restaurantsLight, categoryPlaces, enrichmentSnapshot, reviewSnapshot] = await Promise.all([
    getCategoryCountsSnapshot(),
    needsRestaurants ? getRestaurantsLightSnapshot() : Promise.resolve([]),
    needsPlaces
      ? (isAllView
          ? Promise.all(ALL_PLACE_DB_CATS.map((c) => getPlacesByCategorySnapshot(c))).then((arrays) => arrays.flat())
          : getPlacesByCategorySnapshot(activePlaceCategory!))
      : Promise.resolve([]),
    shouldLoadData ? getBusinessEnrichmentSnapshot() : Promise.resolve({}),
    shouldLoadData ? getReviewSummariesSnapshot() : Promise.resolve({}),
  ]);

  // 카테고리별 건수 — categoryCounts.placeCategoryCounts 우선, fallback은 0
  const pcc = categoryCounts.placeCategoryCounts ?? {};
  const placeCategoryMap = new Map<string, number>(
    ALL_PLACE_DB_CATS.map((cat) => [cat, pcc[cat] ?? 0]),
  );

  const businessTypeOptions = getRestaurantBusinessTypes(restaurantsLight);

  function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 식당 목록
  let restaurantsFiltered = (isRestaurantView || isAllView) ? filterRestaurantsLight(restaurantsLight, normalized) : [];
  if (hasUserLocation) {
    restaurantsFiltered = restaurantsFiltered.filter(
      (r) => r.lat !== null && r.lng !== null && getDistanceKm(userLat, userLng, r.lat!, r.lng!) <= radiusKm,
    );
    restaurantsFiltered = restaurantsFiltered.sort((a, b) => {
      const nameCompare = compareKnownName(a.name, b.name);
      if (nameCompare !== 0) return nameCompare;
      const aHasCoord = a.lat !== null && a.lng !== null;
      const bHasCoord = b.lat !== null && b.lng !== null;
      if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
      if (!aHasCoord || !bHasCoord) return 0;
      return getDistanceKm(userLat, userLng, a.lat!, a.lng!) - getDistanceKm(userLat, userLng, b.lat!, b.lng!);
    });
  } else if (isRestaurantView || isAllView) {
    restaurantsFiltered = sortRestaurantsLight(restaurantsFiltered).sort((a, b) => compareKnownName(a.name, b.name));
  }
  const restaurants = restaurantsFiltered;
  const filteredRestaurantCount = (isRestaurantView || isAllView) ? restaurantsFiltered.length : 0;

  // 비식당 카테고리 Place 데이터 — categoryPlaces는 이미 해당 카테고리만 포함
  let placesForCategory = categoryPlaces.filter((place) => {
    if (normalized.sido && place.sido !== normalized.sido) return false;
    return placeMatchesKeyword(place, normalized.q);
  });
  if (hasUserLocation) {
    placesForCategory = placesForCategory.filter(
      (p) => p.lat !== null && p.lng !== null && getDistanceKm(userLat, userLng, p.lat!, p.lng!) <= radiusKm,
    );
    placesForCategory = placesForCategory.sort((a, b) => {
      const nameCompare = compareKnownName(sanitizePlaceName(a.name), sanitizePlaceName(b.name));
      if (nameCompare !== 0) return nameCompare;
      const aHasCoord = a.lat !== null && a.lng !== null;
      const bHasCoord = b.lat !== null && b.lng !== null;
      if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
      if (!aHasCoord || !bHasCoord) return 0;
      return getDistanceKm(userLat, userLng, a.lat!, a.lng!) - getDistanceKm(userLat, userLng, b.lat!, b.lng!);
    });
  } else {
    placesForCategory = placesForCategory.sort((a, b) => {
      const leftName = sanitizePlaceName(a.name);
      const rightName = sanitizePlaceName(b.name);
      const nameCompare = compareKnownName(leftName, rightName);
      if (nameCompare !== 0) return nameCompare;
      const aHasCoord = a.lat !== null && a.lng !== null;
      const bHasCoord = b.lat !== null && b.lng !== null;
      if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
      const leftUpdatedAt = new Date(a.updatedAt).getTime();
      const rightUpdatedAt = new Date(b.updatedAt).getTime();
      if (leftUpdatedAt !== rightUpdatedAt) return rightUpdatedAt - leftUpdatedAt;
      return leftName.localeCompare(rightName, "ko-KR");
    });
  }
  const placesForCategorySliced = placesForCategory;

  // all 카테고리: 식당 + 전체 place 합산 후 거리순 정렬 → 120건 제한
  const MAX_LIST = 120;
  const MAX_MAP_POINTS = 500;

  const rawListItems: MapRestaurantListItem[] = (isAllView
    ? (() => {
        const combined: MapRestaurantListItem[] = [
          ...restaurantsFiltered.map((r) => {
            const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", r.id);
            const phone = getBusinessPhone(null, enrichment);
            const externalCategory = getBusinessExternalCategory(enrichment);
            const externalHref = getBusinessExternalHref(enrichment);
            const reviewSummary = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", r.id);
            const hasCoordinates = hasUsableCoordinates(r.lat, r.lng);
            const identity = getRestaurantIdentity({ businessType: r.businessType, externalCategory });
            return {
              id: `r_${r.id}`,
              name: r.name,
              address: r.address,
              businessType: r.businessType,
              categoryLabel: "식당",
              regionLabel: [r.sido, r.sigungu].filter(Boolean).join(" · "),
              href: `/restaurants/${r.id}`,
              officialRegistered: r.officialRegistered,
              lat: r.lat,
              lng: r.lng,
              coordinateStatus: (hasCoordinates ? "ready" : "pending") as "ready" | "pending",
              dataUpdatedLabel: new Date(r.updatedAt).toLocaleDateString("ko-KR"),
              distanceKm: hasUserLocation && r.lat !== null && r.lng !== null
                ? getDistanceKm(userLat, userLng, r.lat, r.lng)
                : undefined,
              phone,
              externalCategory,
              externalHref,
              reviewLabel: getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall),
              reviewHref: buildReviewHref("RESTAURANT", r.id),
              sourceLabel: getExternalInfoLabel(enrichment),
              identityLabel: identity.identityLabel,
              identityDescription: identity.description,
              serviceLabel: identity.serviceLabel,
              visualKind: identity.visualKind,
              qualityScore: getDiscoveryQualityScore({ phone, externalHref, externalCategory, reviewCount: reviewSummary?.count, hasCoordinates }),
            };
          }),
          ...placesForCategorySliced.map((p) => {
            const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", p.id, p.category);
            const phone = getBusinessPhone(p.phone, enrichment);
            const externalCategory = getBusinessExternalCategory(enrichment);
            const externalHref = getBusinessExternalHref(enrichment);
            const reviewSummary = getPublicReviewSummary(reviewSnapshot, "PLACE", p.id);
            const hasCoordinates = hasUsableCoordinates(p.lat, p.lng);
            const displayName = sanitizePlaceName(p.name);
            const identity = getPlaceIdentity({ category: p.category, name: displayName, externalCategory });
            return {
              id: `p_${p.id}`,
              name: displayName,
              address: formatPublicAddress(p),
              businessType: p.businessStatus ?? "운영은 업체마다 달라요",
              categoryLabel: PLACE_CATEGORY_LABEL[p.category] ?? "시설",
              regionLabel: [p.sido, p.sigungu].filter(Boolean).join(" · "),
              href: `/places/${p.id}`,
              officialRegistered: false,
              lat: p.lat,
              lng: p.lng,
              coordinateStatus: (hasCoordinates ? "ready" : "pending") as "ready" | "pending",
              dataUpdatedLabel: new Date(p.updatedAt).toLocaleDateString("ko-KR"),
              distanceKm: hasUserLocation && p.lat !== null && p.lng !== null
                ? getDistanceKm(userLat, userLng, p.lat, p.lng)
                : undefined,
              phone,
              externalCategory,
              externalHref,
              reviewLabel: getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall),
              reviewHref: buildReviewHref("PLACE", p.id),
              sourceLabel: getExternalInfoLabel(enrichment),
              identityLabel: identity.identityLabel,
              identityDescription: identity.description,
              serviceLabel: identity.serviceLabel,
              visualKind: identity.visualKind,
              qualityScore: getDiscoveryQualityScore({ phone, externalHref, externalCategory, reviewCount: reviewSummary?.count, hasCoordinates }),
            };
          }),
        ];
        if (hasUserLocation) {
          combined.sort((a, b) => {
            const nameCompare = compareKnownName(a.name, b.name);
            if (nameCompare !== 0) return nameCompare;
            const aD = a.distanceKm ?? Infinity;
            const bD = b.distanceKm ?? Infinity;
            return aD - bD;
          });
        } else {
          combined.sort((a, b) => {
            const nameCompare = compareKnownName(a.name, b.name);
            if (nameCompare !== 0) return nameCompare;
            const aHasCoord = a.coordinateStatus === "ready";
            const bHasCoord = b.coordinateStatus === "ready";
            if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
            return a.name.localeCompare(b.name, "ko-KR");
          });
        }
        return combined;
      })()
    : isRestaurantView
    ? restaurants.map((restaurant) => {
        const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", restaurant.id);
      const phone = getBusinessPhone(null, enrichment);
      const externalCategory = getBusinessExternalCategory(enrichment);
      const externalHref = getBusinessExternalHref(enrichment);
      const reviewSummary = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", restaurant.id);
      const hasCoordinates = hasUsableCoordinates(restaurant.lat, restaurant.lng);
      const identity = getRestaurantIdentity({ businessType: restaurant.businessType, externalCategory });
        return {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          businessType: restaurant.businessType,
          regionLabel: [restaurant.sido, restaurant.sigungu].filter(Boolean).join(" · "),
          href: `/restaurants/${restaurant.id}`,
          officialRegistered: restaurant.officialRegistered,
          lat: restaurant.lat,
          lng: restaurant.lng,
          coordinateStatus: hasCoordinates ? "ready" : "pending",
          dataUpdatedLabel: new Date(restaurant.updatedAt).toLocaleDateString("ko-KR"),
          distanceKm:
            hasUserLocation && restaurant.lat !== null && restaurant.lng !== null
              ? getDistanceKm(userLat, userLng, restaurant.lat, restaurant.lng)
              : undefined,
          phone,
          externalCategory,
          externalHref,
          reviewLabel: getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall),
          reviewHref: buildReviewHref("RESTAURANT", restaurant.id),
          sourceLabel: getExternalInfoLabel(enrichment),
          identityLabel: identity.identityLabel,
          identityDescription: identity.description,
          serviceLabel: identity.serviceLabel,
          visualKind: identity.visualKind,
          qualityScore: getDiscoveryQualityScore({ phone, externalHref, externalCategory, reviewCount: reviewSummary?.count, hasCoordinates }),
        };
      })
    : placesForCategory.slice(0, 120).map((place) => {
        const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
        const phone = getBusinessPhone(place.phone, enrichment);
        const externalCategory = getBusinessExternalCategory(enrichment);
        const externalHref = getBusinessExternalHref(enrichment);
        const reviewSummary = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
        const hasCoordinates = hasUsableCoordinates(place.lat, place.lng);
        const displayName = sanitizePlaceName(place.name);
        const identity = getPlaceIdentity({ category: place.category, name: displayName, externalCategory });
        return {
          id: place.id,
          name: displayName,
          address: formatPublicAddress(place),
          businessType: place.businessStatus ?? "운영은 업체마다 달라요",
          categoryLabel: PLACE_CATEGORY_LABEL[place.category] ?? "시설",
          regionLabel: [place.sido, place.sigungu].filter(Boolean).join(" · "),
          href: `/places/${place.id}`,
          officialRegistered: false,
          lat: place.lat,
          lng: place.lng,
          coordinateStatus: hasCoordinates ? "ready" : "pending",
          dataUpdatedLabel: new Date(place.updatedAt).toLocaleDateString("ko-KR"),
          distanceKm:
            hasUserLocation && place.lat !== null && place.lng !== null
              ? getDistanceKm(userLat, userLng, place.lat, place.lng)
              : undefined,
          phone,
          externalCategory,
          externalHref,
          reviewLabel: getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall),
          reviewHref: buildReviewHref("PLACE", place.id),
          sourceLabel: getExternalInfoLabel(enrichment),
          identityLabel: identity.identityLabel,
          identityDescription: identity.description,
          serviceLabel: identity.serviceLabel,
          visualKind: identity.visualKind,
          qualityScore: getDiscoveryQualityScore({ phone, externalHref, externalCategory, reviewCount: reviewSummary?.count, hasCoordinates }),
        };
      })) as MapRestaurantListItem[];

  const rankedRawListItems = hasUserLocation ? rawListItems : [...rawListItems].sort((a, b) => {
    const nameCompare = compareKnownName(a.name, b.name);
    if (nameCompare !== 0) return nameCompare;
    const qualityCompare = (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    if (qualityCompare !== 0) return qualityCompare;
    const aHasCoord = a.coordinateStatus === "ready";
    const bHasCoord = b.coordinateStatus === "ready";
    if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
    return a.name.localeCompare(b.name, "ko-KR");
  });

  const listItems = limitKnownNameFirst(rankedRawListItems, MAX_LIST);

  const locationForHref = hasUserLocation ? { lat: userLat, lng: userLng, radiusKm } : undefined;

  const categories: MapCategoryOption[] = [
    {
      key: "all",
      label: "전체",
      description: "전체 장소",
      href: buildCategoryHref("all", normalized, locationForHref),
      status: "active",
      countLabel: "",
    },
    {
      key: "restaurants",
      label: "식당",
      description: `${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`,
      href: buildCategoryHref("restaurants", normalized, locationForHref),
      status: "active",
      countLabel: `${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`,
    },
    {
      key: "hospitals",
      label: "병원",
      description: placeCategoryMap.get("ANIMAL_HOSPITAL") ? `${(placeCategoryMap.get("ANIMAL_HOSPITAL") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
      href: buildCategoryHref("hospitals", normalized, locationForHref),
      status: placeCategoryMap.get("ANIMAL_HOSPITAL") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("ANIMAL_HOSPITAL") ? `${(placeCategoryMap.get("ANIMAL_HOSPITAL") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
    },
    {
      key: "pharmacy",
      label: "약국",
      description: placeCategoryMap.get("PHARMACY") ? `${(placeCategoryMap.get("PHARMACY") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
      href: buildCategoryHref("pharmacy", normalized, locationForHref),
      status: placeCategoryMap.get("PHARMACY") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("PHARMACY") ? `${(placeCategoryMap.get("PHARMACY") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
    },
    {
      key: "grooming",
      label: "미용",
      description: placeCategoryMap.get("GROOMING") ? `${(placeCategoryMap.get("GROOMING") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
      href: buildCategoryHref("grooming", normalized, locationForHref),
      status: placeCategoryMap.get("GROOMING") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("GROOMING") ? `${(placeCategoryMap.get("GROOMING") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
    },
    {
      key: "daycare",
      label: "유치원",
      description: placeCategoryMap.get("DAYCARE") ? `${(placeCategoryMap.get("DAYCARE") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
      href: buildCategoryHref("daycare", normalized, locationForHref),
      status: placeCategoryMap.get("DAYCARE") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("DAYCARE") ? `${(placeCategoryMap.get("DAYCARE") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
    },
    {
      key: "funeral",
      label: "장례",
      description: placeCategoryMap.get("FUNERAL") ? `${(placeCategoryMap.get("FUNERAL") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
      href: buildCategoryHref("funeral", normalized, locationForHref),
      status: placeCategoryMap.get("FUNERAL") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("FUNERAL") ? `${(placeCategoryMap.get("FUNERAL") ?? 0).toLocaleString("ko-KR")}건` : "데이터 없음",
    },
    {
      key: "lost-pets",
      label: "보호동물",
      description: "보호동물 공고",
      href: "/lost-pets?tab=shelter",
      status: "active",
      countLabel: "공고",
    },
  ];

  const filteredCount = isAllView
    ? listItems.length
    : isRestaurantView
      ? filteredRestaurantCount
      : placesForCategorySliced.length;
  const coordinateReadyCount = listItems.filter((item) => item.coordinateStatus === "ready").length;
  const coordinatePendingCount = Math.max(listItems.length - coordinateReadyCount, 0);
  // preparedState: all이나 데이터 있는 카테고리면 undefined
  const preparedState =
    isAllView || isRestaurantView || (activePlaceCategory && (placeCategoryMap.get(activePlaceCategory) ?? 0) > 0)
      ? undefined
      : PREPARED_CATEGORY_COPY[activeCategory as Exclude<MapCategoryKey, "restaurants" | "all">];
  const buildRadiusHref = (km: number) => {
    const q = new URLSearchParams({ lat: userLat.toFixed(6), lng: userLng.toFixed(6) });
    q.set("category", activeCategory);
    q.set("radiusKm", km.toString());
    return `/map?${q.toString()}`;
  };

  const emptyState =
    hasUserLocation && listItems.length === 0
      ? {
          title: `반경 ${radiusKm}km 안에 표시할 장소가 없습니다.`,
          description: "반경을 넓히거나 지역명으로 검색해 보세요.",
          href: buildRadiusHref(10),
          hrefLabel: "반경 10km로 넓히기",
          extraLinks: [{ href: buildRadiusHref(20), label: "반경 20km로 넓히기" }],
        }
      : isRestaurantView && filteredCount === 0
        ? {
            title: "조건에 맞는 식당이 없습니다.",
            description: "검색어를 줄이거나 지역 필터를 초기화하면 더 많은 식당을 볼 수 있습니다.",
            href: "/map?category=restaurants",
            hrefLabel: "식당 지도 초기화",
          }
        : undefined;

  const shouldLoadMapSdk = hasResultIntent && coordinateReadyCount > 0;
  const isPlainMapStart = activeCategory === "all" && !params.category;
  const activeCategoryCountLabel = activeCategory === "all"
    ? `${(categoryCounts.restaurantCount + categoryCounts.placeCount).toLocaleString("ko-KR")}건`
    : activeCategory === "restaurants"
      ? `${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`
      : activePlaceCategory
        ? `${(placeCategoryMap.get(activePlaceCategory) ?? 0).toLocaleString("ko-KR")}건`
        : "";
  const activeCategoryListHref = CATEGORY_LIST_HREF[activeCategory];
  const activeCategoryListLabel = activeCategory === "all" ? "카테고리별 목록 보기" : "전체 목록 보기";

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-5 lg:px-6">
      {/* 컴팩트 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 10px", borderBottom: "1px solid var(--line)", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "17px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {hasUserLocation ? "내 주변 반려동물 장소" : MAP_CATEGORY_META[activeCategory].pageTitle}
          </h1>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            {hasUserLocation ? `현재 위치 기준 ${radiusKm}km 이내` : MAP_CATEGORY_META[activeCategory].listSubtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <SmartLink href={activeCategoryListHref} className="btn-secondary" style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}>{activeCategoryListLabel}</SmartLink>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-white" style={{ padding: "10px 12px" }}>
        <form action="/map" className="flex flex-wrap items-center gap-2">
          {activeCategory !== "all" && <input type="hidden" name="category" value={activeCategory} />}

          {/* 검색 입력 — 모바일: 전체 폭, 데스크톱: flex grow */}
          <div className="relative w-full flex-none sm:w-auto sm:flex-1 sm:min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <input
              name="q"
              defaultValue={normalized.q}
              style={{ height: "42px", borderRadius: "10px", fontSize: "14px", paddingLeft: "34px" }}
              className="w-full border border-[var(--line)] bg-white pr-3 font-bold placeholder:font-normal placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              placeholder={isRestaurantView ? "식당명, 지역, 주소 검색" : "장소명, 지역, 주소 검색"}
            />
          </div>

          <select
            name="sido"
            defaultValue={normalized.sido}
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="border border-[var(--line)] bg-white px-3 font-bold focus:outline-none"
          >
            <option value="">전체 지역</option>
            {REGION_OPTIONS.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            name="type"
            defaultValue={normalized.type}
            disabled={!isRestaurantView}
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="border border-[var(--line)] bg-white px-3 font-bold focus:outline-none disabled:opacity-40"
          >
            <option value="">전체 업종</option>
            {businessTypeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <PendingSubmitButton
            type="submit"
            pendingLabel="검색 중..."
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="bg-[var(--brand)] px-4 font-black text-white"
          >
            검색
          </PendingSubmitButton>

          <SmartLink
            href={activeCategory === "all" ? "/map" : `/map?category=${activeCategory}`}
            pendingLabel="지도 여는 중..."
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="flex items-center border border-[var(--line)] bg-white px-3 font-bold text-[var(--ink)]"
          >
            전체
          </SmartLink>
        </form>

        <div className="mt-2">
          <MapCategoryChips categories={categories} activeCategory={activeCategory} />
        </div>
      </section>

      {!isDefaultEntrance && (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <Compass size={14} />
          <span>
            {hasUserLocation
              ? `반경 ${radiusKm}km 내 ${listItems.length.toLocaleString("ko-KR")}곳`
              : isAllView
                ? `가까운 장소 ${listItems.length.toLocaleString("ko-KR")}곳 표시`
                : `${MAP_CATEGORY_LABELS[activeCategory]} ${filteredCount.toLocaleString("ko-KR")}곳 표시`}
          </span>
        </div>
      )}

      {isDefaultEntrance ? (
        <section className="mt-6">
          <div className="section-shell p-6 sm:p-8">
            {isPlainMapStart ? (
              <>
                <div className="border-b border-[var(--line)] pb-6">
                  <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">장소 찾기</p>
                  <h2 className="mt-3 text-[1.75rem] font-black tracking-tight text-[var(--ink)]">어디를 찾고 계신가요?</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    지역, 업종, 장소명을 검색하거나 현재 위치로 가까운 장소를 찾아보세요.
                  </p>
                  <div className="mt-5">
                    <MapLocationButton category="all" />
                  </div>
                </div>
                <div className="pt-6">
                  <p className="text-[11px] font-black text-[var(--muted)]">카테고리별 장소</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {categories.filter((c) => c.key !== "all" && c.key !== "lost-pets").map((cat) => (
                      <SmartLink
                        key={cat.key}
                        href={cat.href}
                        pendingLabel="지도 여는 중..."
                        className="flex flex-col rounded-[1rem] border border-[var(--line)] bg-white p-4 transition hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]"
                      >
                        <span className="text-base font-black text-[var(--ink)]">{cat.label}</span>
                        <span className="mt-1 text-xl font-black tracking-tight text-[var(--brand)]">{cat.countLabel}</span>
                      </SmartLink>
                    ))}
                  </div>
                  <div className="mt-5">
                    <SmartLink
                      href="/lost-pets?tab=shelter"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[#f9faf8]"
                    >
                      보호동물 공고 바로가기
                    </SmartLink>
                  </div>
                  <p className="mt-5 text-xs text-[var(--muted)]">검색 또는 현재 위치 선택 후 지도가 열립니다.</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">카테고리 선택됨</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[1.75rem] font-black tracking-tight text-[var(--ink)]">{MAP_CATEGORY_META[activeCategory].pageTitle}</h2>
                    <p className="mt-2 text-2xl font-black text-[var(--brand)]">{activeCategoryCountLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <MapLocationButton category={activeCategory} />
                    <SmartLink href={activeCategoryListHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] bg-white px-5 py-2 text-sm font-black text-[var(--brand)]">
                      {activeCategoryListLabel}
                    </SmartLink>
                  </div>
                </div>
                <div className="mt-5 rounded-[1rem] border border-[var(--line)] bg-white p-5 text-sm leading-7 text-[var(--muted)]">
                  <p className="font-black text-[var(--ink)]">안내</p>
                  <p className="mt-2">{CATEGORY_GUIDANCE_COPY[activeCategory]}</p>
                  <p className="mt-2 text-xs font-bold text-[var(--muted)]">카테고리만 선택한 상태에서는 전국 목록과 전국 마커를 자동으로 표시하지 않습니다.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <MapShell
          items={listItems}
          activeCategory={activeCategory}
          activeCategoryLabel={MAP_CATEGORY_LABELS[activeCategory]}
          listTitle={hasUserLocation ? "내 주변 반려동물 장소" : MAP_CATEGORY_META[activeCategory].listTitle}
          listSubtitle={hasUserLocation ? `현재 위치 기준 ${radiusKm}km 이내 장소를 가까운 순으로 보여드립니다.` : MAP_CATEGORY_META[activeCategory].listSubtitle}
          mapTitle={hasUserLocation ? `내 주변 ${radiusKm}km 지도` : MAP_CATEGORY_META[activeCategory].mapTitle}
          filteredCount={filteredCount}
          visibleCount={listItems.length}
          coordinateReadyCount={coordinateReadyCount}
          coordinatePendingCount={coordinatePendingCount}
          shouldLoadMap={shouldLoadMapSdk}
          preparedState={preparedState}
          emptyState={emptyState}
          initialUserLocation={hasUserLocation ? { lat: userLat, lng: userLng } : undefined}
          radiusKm={hasUserLocation ? radiusKm : undefined}
        />
      )}
    </main>
  );
}