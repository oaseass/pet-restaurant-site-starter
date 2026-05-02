import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { MapCategoryChips } from "@/components/map/MapCategoryChips";
import { MapShell } from "@/components/map/MapShell";
import type { MapCategoryKey, MapCategoryOption, MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { REGION_OPTIONS } from "@/lib/platform-content";
import { filterRestaurantsLight, getCategoryCountsSnapshot, getPlacesLightSnapshot, getRestaurantBusinessTypes, getRestaurantsLightSnapshot, normalizePublicRestaurantSearchParams, sortRestaurantsLight } from "@/lib/public-data";

const MAP_CATEGORY_LABELS: Record<MapCategoryKey, string> = {
  restaurants: "식당",
  hospitals: "병원",
  grooming: "미용",
  daycare: "유치원",
  funeral: "장례",
  pharmacy: "약국",
  "lost-pets": "찾아요",
};

const PREPARED_CATEGORY_COPY: Record<Exclude<MapCategoryKey, "restaurants">, PreparedCategoryState> = {
  pharmacy: {
    title: "동물약국 지도는 준비 중입니다.",
    description: "동물약국 정보는 순차적으로 지도에서 볼 수 있도록 준비하고 있습니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
  hospitals: {
    title: "동물병원 지도는 준비 중입니다.",
    description: "병원 정보는 곧 지도에서 볼 수 있도록 준비하고 있습니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
  grooming: {
    title: "미용 지도는 준비 중입니다.",
    description: "미용 정보도 같은 방식으로 지도에서 볼 수 있도록 정리하고 있습니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
  daycare: {
    title: "유치원 지도는 준비 중입니다.",
    description: "유치원과 호텔 정보도 순차적으로 지도에 반영할 예정입니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
  funeral: {
    title: "장례 지도는 준비 중입니다.",
    description: "장례 정보는 신중하게 정리한 뒤 순차적으로 공개할 예정입니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
  "lost-pets": {
    title: "찾아요 지도는 준비 중입니다.",
    description: "실종 제보도 지도에서 보기 쉽게 보여드릴 수 있도록 준비하고 있습니다.",
    note: "지금은 식당 지도를 먼저 이용해 주세요.",
  },
};

const MAP_CATEGORY_ALIASES: Record<string, MapCategoryKey> = {
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

function resolveMapCategory(input?: string): MapCategoryKey {
  if (!input) return "restaurants";
  return MAP_CATEGORY_ALIASES[input.toLowerCase().replace(/-/g, "_")] ?? "restaurants";
}

function buildCategoryHref(category: MapCategoryKey, params: { q: string; sido: string; type: string }) {
  const query = new URLSearchParams();
  if (category !== "restaurants") query.set("category", category);
  if (params.q) query.set("q", params.q);
  if (params.sido) query.set("sido", params.sido);
  if (params.type) query.set("type", params.type);

  return query.size > 0 ? `/map?${query.toString()}` : "/map";
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sido?: string; type?: string; category?: string; lat?: string; lng?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = resolveMapCategory(params.category);
  const normalized = normalizePublicRestaurantSearchParams({ q: params.q, sido: params.sido, type: params.type });

  // 현재 위치 파싱 (한국 좌표 범위 검증)
  const userLat = Number(params.lat);
  const userLng = Number(params.lng);
  const hasUserLocation =
    Number.isFinite(userLat) &&
    Number.isFinite(userLng) &&
    userLat >= 33 &&
    userLat <= 39 &&
    userLng >= 124 &&
    userLng <= 132;

  const shouldLoadMap = !!(params.q || params.sido || params.type || hasUserLocation || params.category);
  const [categoryCounts, restaurantsLight, allPlaces] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
    getPlacesLightSnapshot(),
  ]);

  const placeCategoryMap = new Map<string, number>();
  for (const p of allPlaces) {
    placeCategoryMap.set(p.category, (placeCategoryMap.get(p.category) ?? 0) + 1);
  }

  const isRestaurantView = activeCategory === "restaurants";

  const businessTypeOptions = getRestaurantBusinessTypes(restaurantsLight);

  // 현재 위치 기반 거리 정렬
  function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  let restaurants = isRestaurantView ? filterRestaurantsLight(restaurantsLight, normalized) : [];
  if (hasUserLocation && isRestaurantView) {
    restaurants = restaurants.sort((a, b) => {
      const aHasCoord = a.lat !== null && a.lng !== null;
      const bHasCoord = b.lat !== null && b.lng !== null;
      if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
      if (!aHasCoord || !bHasCoord) return 0;
      return getDistanceKm(userLat, userLng, a.lat!, a.lng!) - getDistanceKm(userLat, userLng, b.lat!, b.lng!);
    });
  } else if (isRestaurantView) {
    restaurants = sortRestaurantsLight(restaurants);
  }
  restaurants = restaurants.slice(0, 120);
  const filteredRestaurantCount = isRestaurantView ? filterRestaurantsLight(restaurantsLight, normalized).length : 0;
  const filteredCoordinateReadyCount = isRestaurantView ? filterRestaurantsLight(restaurantsLight, normalized).filter((restaurant) => restaurant.lat !== null && restaurant.lng !== null).length : 0;

  // 비식당 카테고리 Place 데이터
  const CATEGORY_KEY_TO_PLACE: Record<string, string> = {
    hospitals: "ANIMAL_HOSPITAL",
    grooming: "GROOMING",
    daycare: "DAYCARE",
    funeral: "FUNERAL",
    pharmacy: "PHARMACY",
  };
  const activePlaceCategory = CATEGORY_KEY_TO_PLACE[activeCategory];
  let placesForCategory = activePlaceCategory
    ? allPlaces.filter((p) => p.category === activePlaceCategory && (normalized.sido ? p.sido === normalized.sido : true))
    : [];
  if (hasUserLocation) {
    placesForCategory = placesForCategory.sort((a, b) => {
      const aHasCoord = a.lat !== null && a.lng !== null;
      const bHasCoord = b.lat !== null && b.lng !== null;
      if (aHasCoord !== bHasCoord) return Number(bHasCoord) - Number(aHasCoord);
      if (!aHasCoord || !bHasCoord) return 0;
      return getDistanceKm(userLat, userLng, a.lat!, a.lng!) - getDistanceKm(userLat, userLng, b.lat!, b.lng!);
    });
  }
  placesForCategory = placesForCategory.slice(0, 120);

  const listItems: MapRestaurantListItem[] = (isRestaurantView
    ? restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        businessType: restaurant.businessType,
        regionLabel: [restaurant.sido, restaurant.sigungu].filter(Boolean).join(" · "),
        href: `/restaurants/${restaurant.id}`,
        officialRegistered: restaurant.officialRegistered,
        lat: restaurant.lat,
        lng: restaurant.lng,
        coordinateStatus: restaurant.lat !== null && restaurant.lng !== null ? "ready" : "pending",
        dataUpdatedLabel: new Date(restaurant.updatedAt).toLocaleDateString("ko-KR"),
        distanceKm:
          hasUserLocation && restaurant.lat !== null && restaurant.lng !== null
            ? getDistanceKm(userLat, userLng, restaurant.lat, restaurant.lng)
            : undefined,
      }))
    : placesForCategory.map((place) => ({
        id: place.id,
        name: place.name,
        address: place.roadAddress ?? place.address ?? null,
        businessType: place.businessStatus ?? "",
        regionLabel: [place.sido, place.sigungu].filter(Boolean).join(" · "),
        href: `/map?category=${activeCategory}&q=${encodeURIComponent(place.name)}`,
        officialRegistered: false,
        lat: place.lat,
        lng: place.lng,
        coordinateStatus: place.lat !== null && place.lng !== null ? "ready" : "pending",
        dataUpdatedLabel: new Date(place.updatedAt).toLocaleDateString("ko-KR"),
        distanceKm:
          hasUserLocation && place.lat !== null && place.lng !== null
            ? getDistanceKm(userLat, userLng, place.lat, place.lng)
            : undefined,
      }))) as MapRestaurantListItem[];

  const categories: MapCategoryOption[] = [
    {
      key: "restaurants",
      label: "식당",
      description: `${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`,
      href: buildCategoryHref("restaurants", normalized),
      status: "active",
      countLabel: `${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`,
    },
    {
      key: "hospitals",
      label: "병원",
      description: placeCategoryMap.get("ANIMAL_HOSPITAL") ? `${(placeCategoryMap.get("ANIMAL_HOSPITAL") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
      href: buildCategoryHref("hospitals", normalized),
      status: placeCategoryMap.get("ANIMAL_HOSPITAL") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("ANIMAL_HOSPITAL") ? `${(placeCategoryMap.get("ANIMAL_HOSPITAL") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
    },
    {
      key: "grooming",
      label: "미용",
      description: placeCategoryMap.get("GROOMING") ? `${(placeCategoryMap.get("GROOMING") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
      href: buildCategoryHref("grooming", normalized),
      status: placeCategoryMap.get("GROOMING") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("GROOMING") ? `${(placeCategoryMap.get("GROOMING") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
    },
    {
      key: "daycare",
      label: "유치원",
      description: placeCategoryMap.get("DAYCARE") ? `${(placeCategoryMap.get("DAYCARE") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
      href: buildCategoryHref("daycare", normalized),
      status: placeCategoryMap.get("DAYCARE") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("DAYCARE") ? `${(placeCategoryMap.get("DAYCARE") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
    },
    {
      key: "funeral",
      label: "장례",
      description: placeCategoryMap.get("FUNERAL") ? `${(placeCategoryMap.get("FUNERAL") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
      href: buildCategoryHref("funeral", normalized),
      status: placeCategoryMap.get("FUNERAL") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("FUNERAL") ? `${(placeCategoryMap.get("FUNERAL") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
    },
    {
      key: "pharmacy",
      label: "약국",
      description: placeCategoryMap.get("PHARMACY") ? `${(placeCategoryMap.get("PHARMACY") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
      href: buildCategoryHref("pharmacy", normalized),
      status: placeCategoryMap.get("PHARMACY") ? "active" : "coming-soon",
      countLabel: placeCategoryMap.get("PHARMACY") ? `${(placeCategoryMap.get("PHARMACY") ?? 0).toLocaleString("ko-KR")}건` : "준비중",
    },
    {
      key: "lost-pets",
      label: "찾아요",
      description: "보호동물 공고",
      href: "/lost-pets?tab=shelter",
      status: "active",
      countLabel: "공고",
    },
  ];

  const filteredCount = isRestaurantView ? filteredRestaurantCount : placesForCategory.length;
  const coordinateReadyCount = isRestaurantView
    ? filteredCoordinateReadyCount
    : placesForCategory.filter((p) => p.lat !== null && p.lng !== null).length;
  const coordinatePendingCount = Math.max(filteredCount - coordinateReadyCount, 0);
  // preparedState: Place 데이터가 있으면 undefined (실제 목록 표시), 없으면 준비 중 안내
  const preparedState =
    isRestaurantView || (activePlaceCategory && (placeCategoryMap.get(activePlaceCategory) ?? 0) > 0)
      ? undefined
      : PREPARED_CATEGORY_COPY[activeCategory as Exclude<MapCategoryKey, "restaurants">];
  const emptyState = isRestaurantView && filteredCount === 0
    ? {
        title: "조건에 맞는 식당이 없습니다.",
        description: "검색어를 줄이거나 지역 필터를 초기화하면 더 많은 식당을 볼 수 있습니다.",
        href: "/map",
        hrefLabel: "식당 지도 초기화",
      }
    : undefined;

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-5 lg:px-6">
      {/* 컴팩트 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 10px", borderBottom: "1px solid var(--line)", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "17px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>반려동물 동반 식당 지도</h1>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            전체 {categoryCounts.restaurantCount.toLocaleString("ko-KR")}건 등록
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Link href="/restaurants" className="btn-secondary" style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}>전체 목록</Link>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-white" style={{ padding: "10px 12px" }}>
        <form action="/map" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="category" value={activeCategory} />

          {/* 검색 입력 — 모바일: 전체 폭, 데스크톱: flex grow */}
          <div className="relative w-full flex-none sm:w-auto sm:flex-1 sm:min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15} />
            <input
              name="q"
              defaultValue={normalized.q}
              style={{ height: "42px", borderRadius: "10px", fontSize: "14px", paddingLeft: "34px" }}
              className="w-full border border-[var(--line)] bg-white pr-3 font-bold placeholder:font-normal placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              placeholder="식당명, 지역, 주소 검색"
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

          <button
            type="submit"
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="bg-[var(--brand)] px-4 font-black text-white"
          >
            검색
          </button>

          <Link
            href={activeCategory === "restaurants" ? "/map" : `/map?category=${activeCategory}`}
            style={{ height: "42px", borderRadius: "10px", fontSize: "13px" }}
            className="flex items-center border border-[var(--line)] bg-white px-3 font-bold text-[var(--ink)]"
          >
            전체
          </Link>
        </form>

        <div className="mt-2">
          <MapCategoryChips categories={categories} activeCategory={activeCategory} />
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
        <Compass size={14} />
        <span>{`${filteredCount.toLocaleString("ko-KR")}건 중 최대 120건 표시`}</span>
      </div>

      <MapShell
        items={listItems}
        activeCategory={activeCategory}
        activeCategoryLabel={MAP_CATEGORY_LABELS[activeCategory]}
        filteredCount={filteredCount}
        visibleCount={listItems.length}
        coordinateReadyCount={coordinateReadyCount}
        coordinatePendingCount={coordinatePendingCount}
        shouldLoadMap={shouldLoadMap}
        preparedState={preparedState}
        emptyState={emptyState}
        initialUserLocation={hasUserLocation ? { lat: userLat, lng: userLng } : undefined}
      />
    </main>
  );
}