import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Compass, Search, SlidersHorizontal } from "lucide-react";
import { CharacterImage } from "@/components/CharacterImage";
import { MapCategoryChips } from "@/components/map/MapCategoryChips";
import { MapShell } from "@/components/map/MapShell";
import type { MapCategoryKey, MapCategoryOption, MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { prisma } from "@/lib/prisma";
import { REGION_OPTIONS } from "@/lib/platform-content";
import { buildRestaurantSearchWhere, normalizeRestaurantSearchParams } from "@/lib/search";

export const dynamic = "force-dynamic";

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
    title: "동물병원 지도 공개 준비중",
    description: "병원 카테고리는 외부 수집 없이 운영 정책과 검수 기준을 먼저 정리하고 있습니다.",
    note: "지금은 식당 지도만 실제 데이터로 공개하고, 병원은 준비중 상태와 지도 구조만 먼저 제공합니다.",
  },
  grooming: {
    title: "미용 지도 공개 준비중",
    description: "미용 카테고리는 실제 업체 데이터 없이 구조와 필터 경험을 먼저 다듬고 있습니다.",
    note: "외부 원천 호출 없이 준비중 UI만 유지하며, 식당 지도 UX를 중심으로 서비스 품질을 먼저 올립니다.",
  },
  daycare: {
    title: "유치원 지도 공개 준비중",
    description: "유치원과 호텔은 운영 기준과 데이터 정합성 기준을 정리한 뒤 단계적으로 공개합니다.",
    note: "현재는 식당 카테고리만 실제 핀과 리스트를 연결하고, 나머지 카테고리는 준비중 상태를 분명히 보여줍니다.",
  },
  funeral: {
    title: "장례 지도 공개 준비중",
    description: "장례 카테고리는 민감한 안내 품질을 우선해 데이터 공개 전에 운영 문구와 검수 기준을 먼저 고정합니다.",
    note: "준비중 카테고리는 실제 데이터가 없는 상태를 숨기지 않고 명확히 표시합니다.",
  },
  "lost-pets": {
    title: "찾아요 지도 공개 준비중",
    description: "실종 제보는 별도 게시판 흐름을 유지하고 있어 지도형 노출은 운영 정책 확정 후 반영합니다.",
    note: "현재는 리스트·가이드·게시판 흐름을 유지하고, 지도 화면에는 준비중 상태만 보여줍니다.",
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
  const normalized = normalizeRestaurantSearchParams({ q: params.q, sido: params.sido, type: params.type });
  const restaurantWhere = buildRestaurantSearchWhere({ q: normalized.q, sido: normalized.sido, type: normalized.type });
  const readyCoordinateWhere: Prisma.RestaurantWhereInput = {
    AND: [restaurantWhere, { lat: { not: null }, lng: { not: null } }],
  };

  const isRestaurantView = activeCategory === "restaurants";

  const [
    restaurantTotalCount,
    restaurantTotalCoordinateReadyCount,
    filteredRestaurantCount,
    filteredCoordinateReadyCount,
    rawRestaurants,
    businessTypeOptions,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.restaurant.count({ where: { status: "ACTIVE", lat: { not: null }, lng: { not: null } } }),
    isRestaurantView ? prisma.restaurant.count({ where: restaurantWhere }) : Promise.resolve(0),
    isRestaurantView ? prisma.restaurant.count({ where: readyCoordinateWhere }) : Promise.resolve(0),
    isRestaurantView
      ? prisma.restaurant.findMany({
          where: restaurantWhere,
          orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
          take: 120,
        })
      : Promise.resolve([]),
    prisma.restaurant.findMany({
      where: { status: "ACTIVE" },
      distinct: ["businessType"],
      select: { businessType: true },
      orderBy: { businessType: "asc" },
    }),
  ]);

  const restaurants = [...rawRestaurants].sort((left, right) => {
    const leftHasCoordinates = left.lat !== null && left.lng !== null;
    const rightHasCoordinates = right.lat !== null && right.lng !== null;
    if (leftHasCoordinates !== rightHasCoordinates) return Number(rightHasCoordinates) - Number(leftHasCoordinates);
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

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
    dataUpdatedLabel: restaurant.dataUpdatedAt.toLocaleDateString("ko-KR"),
  }));

  const categories: MapCategoryOption[] = [
    {
      key: "restaurants",
      label: "식당",
      description: "실제 DB 데이터 운영 중",
      href: buildCategoryHref("restaurants", normalized),
      status: "active",
      countLabel: `${restaurantTotalCount.toLocaleString("ko-KR")}건`,
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
    <main className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-5 lg:px-6">
      <section className="grid gap-5 py-7 lg:grid-cols-[1.08fr_0.92fr] lg:py-8">
        <div className="section-shell overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(122,232,204,0.34),rgba(255,255,255,0)_70%)]" />
          <div className="absolute bottom-2 right-4 hidden h-28 w-28 opacity-80 sm:block">
            <CharacterImage asset="cat-peeking" className="h-full w-full" imageClassName="object-contain" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <p className="eyebrow">Map First</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge bg-[#e9f8f2] text-[#1a463f]">내부 DB 식당 {restaurantTotalCount.toLocaleString("ko-KR")}건</span>
              <span className="badge bg-[#fff1e6] text-[#b9632e]">핀 가능 {restaurantTotalCoordinateReadyCount.toLocaleString("ko-KR")}건</span>
              <span className="badge">좌표 준비중 {(restaurantTotalCount - restaurantTotalCoordinateReadyCount).toLocaleString("ko-KR")}건</span>
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-[#161310] sm:text-[3.4rem]">리스트가 아니라, 지도를 중심으로 반려동물 동반 식당을 찾습니다.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#60554d] sm:text-base">댕냥지도는 외부 원천을 다시 호출하지 않고 내부 DB에 저장된 식당 데이터만으로 지도 탐색 경험을 만듭니다. 좌표가 있는 식당만 핀으로 올리고, 좌표가 없는 식당은 리스트에서 좌표 준비중 상태를 정확히 보여줍니다.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/restaurants" className="btn-secondary">리스트 전용 보기</Link>
              <Link href="/search" className="btn-secondary">통합 검색 보기</Link>
            </div>
          </div>
        </div>

        <div className="section-shell overflow-hidden p-5 sm:p-6">
          <div className="absolute right-3 top-3 hidden h-24 w-24 opacity-75 sm:block">
            <CharacterImage asset="dog-brown" className="h-full w-full mascot-drift" imageClassName="object-contain" />
          </div>
          <div className="relative z-10 rounded-[1.9rem] bg-[#1c2623] p-6 text-white shadow-[0_28px_52px_rgba(18,22,21,0.18)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f6bf91]">Map Policy</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">핀은 정확하게, 리스트는 숨기지 않게.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#d8cfc7]">
              <li>1. 식당 카테고리만 실제 DB 데이터로 운영</li>
              <li>2. 좌표 없는 식당은 핀으로 억지 표시하지 않음</li>
              <li>3. 지도 SDK 키가 없어도 fallback 레이아웃 유지</li>
            </ul>
          </div>
          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[rgba(28,28,28,0.08)] bg-white/82 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">현재 결과</p>
              <p className="mt-2 text-2xl font-black text-[#1f1915]">{isRestaurantView ? filteredCount.toLocaleString("ko-KR") : "준비중"}</p>
              <p className="mt-2 text-sm leading-6 text-[#665950]">{isRestaurantView ? "현재 필터에 맞는 식당 결과" : "선택 카테고리는 공개 준비중"}</p>
            </div>
            <div className="rounded-[1.6rem] border border-[rgba(28,28,28,0.08)] bg-[#eef8f5] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">데이터 기준</p>
              <p className="mt-2 text-2xl font-black text-[#1f1915]">내부 DB</p>
              <p className="mt-2 text-sm leading-6 text-[#665950]">지도 리스트와 핀은 모두 저장된 데이터만 사용</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[86px] z-30 rounded-[2rem] border border-[rgba(28,28,28,0.08)] bg-[rgba(255,249,244,0.94)] p-3 shadow-[0_20px_42px_rgba(35,26,22,0.08)] backdrop-blur-xl md:top-[102px] lg:static lg:mt-1 lg:p-4">
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
                <option key={option.businessType} value={option.businessType}>{option.businessType}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button className="btn-primary min-h-11 flex-1 sm:flex-none" type="submit">
              필터 적용
            </button>
            <Link href={activeCategory === "restaurants" ? "/map" : `/map?category=${activeCategory}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(28,28,28,0.08)] bg-white/88 px-4 py-2 text-sm font-black text-[#1f1915]">
              초기화
            </Link>
          </div>
        </form>

        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#8b7c72]">
          <SlidersHorizontal size={14} />
          <span>식당만 실제 데이터 기반 필터가 적용됩니다.</span>
        </div>

        <div className="mt-4">
          <MapCategoryChips categories={categories} activeCategory={activeCategory} />
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#665950]">
        <Compass size={16} />
        <span>{isRestaurantView ? `필터 결과 ${filteredCount.toLocaleString("ko-KR")}건 중 최신/지도 중심 120건까지 표시합니다.` : `${MAP_CATEGORY_LABELS[activeCategory]} 카테고리는 준비중 상태로만 노출합니다.`}</span>
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