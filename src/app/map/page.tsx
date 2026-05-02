import Link from "next/link";
import { Compass, Search, SlidersHorizontal } from "lucide-react";
import { MapCategoryChips } from "@/components/map/MapCategoryChips";
import { MapShell } from "@/components/map/MapShell";
import type { MapCategoryKey, MapCategoryOption, MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { REGION_OPTIONS } from "@/lib/platform-content";
import { filterRestaurantsLight, getCategoryCountsSnapshot, getRestaurantBusinessTypes, getRestaurantsLightSnapshot, normalizePublicRestaurantSearchParams, sortRestaurantsLight } from "@/lib/public-data";

const MAP_CATEGORY_LABELS: Record<MapCategoryKey, string> = {
  restaurants: "식당",
  hospitals: "병원",
  grooming: "미용",
  daycare: "유치원",
  funeral: "장례",
  "lost-pets": "찾아요",
};

const PREPARED_CATEGORY_COPY: Record<Exclude<MapCategoryKey, "restaurants">, PreparedCategoryState> = {
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

function resolveMapCategory(input?: string): MapCategoryKey {
  switch (input) {
    case "hospitals":
    case "grooming":
    case "daycare":
    case "funeral":
    case "lost-pets":
      return input;
    default:
      return "restaurants";
  }
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
  searchParams: Promise<{ q?: string; sido?: string; type?: string; category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = resolveMapCategory(params.category);
  const normalized = normalizePublicRestaurantSearchParams({ q: params.q, sido: params.sido, type: params.type });
  const [categoryCounts, restaurantsLight] = await Promise.all([getCategoryCountsSnapshot(), getRestaurantsLightSnapshot()]);

  const isRestaurantView = activeCategory === "restaurants";

  const businessTypeOptions = getRestaurantBusinessTypes(restaurantsLight);
  const restaurants = isRestaurantView ? sortRestaurantsLight(filterRestaurantsLight(restaurantsLight, normalized)).slice(0, 120) : [];
  const filteredRestaurantCount = isRestaurantView ? filterRestaurantsLight(restaurantsLight, normalized).length : 0;
  const filteredCoordinateReadyCount = isRestaurantView ? filterRestaurantsLight(restaurantsLight, normalized).filter((restaurant) => restaurant.lat !== null && restaurant.lng !== null).length : 0;

  const listItems: MapRestaurantListItem[] = restaurants.map((restaurant) => ({
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
  }));

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
      description: "준비중",
      href: buildCategoryHref("hospitals", normalized),
      status: "coming-soon",
      countLabel: "준비중",
    },
    {
      key: "grooming",
      label: "미용",
      description: "준비중",
      href: buildCategoryHref("grooming", normalized),
      status: "coming-soon",
      countLabel: "준비중",
    },
    {
      key: "daycare",
      label: "유치원",
      description: "준비중",
      href: buildCategoryHref("daycare", normalized),
      status: "coming-soon",
      countLabel: "준비중",
    },
    {
      key: "funeral",
      label: "장례",
      description: "준비중",
      href: buildCategoryHref("funeral", normalized),
      status: "coming-soon",
      countLabel: "준비중",
    },
    {
      key: "lost-pets",
      label: "찾아요",
      description: "준비중",
      href: buildCategoryHref("lost-pets", normalized),
      status: "coming-soon",
      countLabel: "준비중",
    },
  ];

  const filteredCount = isRestaurantView ? filteredRestaurantCount : 0;
  const coordinateReadyCount = isRestaurantView ? filteredCoordinateReadyCount : 0;
  const coordinatePendingCount = Math.max(filteredCount - coordinateReadyCount, 0);
  const preparedState = isRestaurantView ? undefined : PREPARED_CATEGORY_COPY[activeCategory];
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
            {isRestaurantView
              ? `지도 표시 가능 ${categoryCounts.restaurantCoordinateReadyCount.toLocaleString("ko-KR")}건 포함 · 전체 ${categoryCounts.restaurantCount.toLocaleString("ko-KR")}건`
              : "병원, 미용, 유치원, 장례, 찾아요는 순차적으로 준비 중입니다"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Link href="/restaurants" className="btn-secondary" style={{ minHeight: "34px", padding: "0 12px", fontSize: "12px" }}>전체 목록</Link>
        </div>
      </div>

      <section className="sticky top-[56px] z-30 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.96)] p-3 backdrop-blur-sm lg:static lg:p-4">
        <form action="/map" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_auto] lg:items-center">
          <input type="hidden" name="category" value={activeCategory} />
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#fff1e6] text-[#b9632e]">
              <Search size={18} />
            </span>
            <input name="q" defaultValue={normalized.q} className="input min-h-11 pl-14" placeholder="식당명, 주소, 지역으로 지도 검색" />
          </label>

          <label className="block">
            <span className="sr-only">지역 필터</span>
            <select name="sido" defaultValue={normalized.sido} className="input min-h-11 px-5 py-3 text-sm font-bold">
              <option value="">전체 지역</option>
              {REGION_OPTIONS.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">업종 필터</span>
            <select name="type" defaultValue={normalized.type} className="input min-h-11 px-5 py-3 text-sm font-bold" disabled={!isRestaurantView}>
              <option value="">전체 업종</option>
              {businessTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button className="btn-primary min-h-11 flex-1 sm:flex-none" type="submit">
              필터 적용
            </button>
            <Link href={activeCategory === "restaurants" ? "/map" : `/map?category=${activeCategory}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--ink)]">
              초기화
            </Link>
          </div>
        </form>

        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <SlidersHorizontal size={14} />
          <span>병원, 미용, 유치원, 장례, 찾아요 카테고리는 순차적으로 준비하고 있습니다.</span>
        </div>

        <div className="mt-4">
          <MapCategoryChips categories={categories} activeCategory={activeCategory} />
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
        <Compass size={14} />
        <span>{isRestaurantView ? `${filteredCount.toLocaleString("ko-KR")}건 중 최대 120건 표시` : `${MAP_CATEGORY_LABELS[activeCategory]} 지도는 순차적으로 준비 중입니다`}</span>
      </div>

      <MapShell
        items={listItems}
        activeCategory={activeCategory}
        activeCategoryLabel={MAP_CATEGORY_LABELS[activeCategory]}
        filteredCount={filteredCount}
        visibleCount={listItems.length}
        coordinateReadyCount={coordinateReadyCount}
        coordinatePendingCount={coordinatePendingCount}
        preparedState={preparedState}
        emptyState={emptyState}
      />
    </main>
  );
}