import { notFound } from "next/navigation";
import type { PlaceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";
import { EmptyState } from "@/components/EmptyState";
import { FilterBottomSheet } from "@/components/FilterBottomSheet";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { PlaceCard } from "@/components/PlaceCard";
import { PriceNote } from "@/components/PriceNote";
import { ResponsiveMapLayout } from "@/components/ResponsiveMapLayout";
import { RestaurantCard } from "@/components/RestaurantCard";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { AdSlot } from "@/components/AdSlot";
import { getCategoryCountsSnapshot, getRegionsSnapshot, getRestaurantsLightSnapshot, sortRestaurantsLight, toRestaurantCardItem } from "@/lib/public-data";
import {
  PLACE_CATEGORY_LABELS,
  QUICK_CATEGORIES,
  REGION_OPTIONS,
  getPlaceCategoryBySlug,
} from "@/lib/platform-content";

function shouldShowMedicalDisclaimer(category: PlaceCategory) {
  return category === "ANIMAL_HOSPITAL" || category === "EMERGENCY_HOSPITAL";
}

function shouldShowPriceNote(category: PlaceCategory) {
  return category === "GROOMING" || category === "DAYCARE" || category === "HOTEL" || category === "FUNERAL" || category === "TRAINING";
}

function shouldShowLegalDisclaimer(category: PlaceCategory) {
  return category === "FUNERAL";
}

function getCategoryReadinessCopy(category: PlaceCategory, count: number) {
  const label = PLACE_CATEGORY_LABELS[category];
  if (count === 0) {
    return {
      title: `${label} 공개 데이터가 아직 없습니다.`,
      description: `${label} 정보가 추가되면 지역별 목록과 상세 페이지에서 바로 확인할 수 있습니다.`,
    };
  }

  return {
    title: `${label} 이용 안내`,
    description: `${label} 목록은 계속 보강하고 있습니다. 방문 전 최신 운영 여부와 이용 조건을 다시 확인해 주세요.`,
  };
}

export async function PlaceDirectoryPage({
  categorySlug,
  title,
  description,
}: {
  categorySlug: string;
  title?: string;
  description?: string;
}) {
  const category = getPlaceCategoryBySlug(categorySlug);
  if (!category) notFound();

  const categoryInfo = QUICK_CATEGORIES.find((item) => item.category === category);
  const pageTitle = title ?? PLACE_CATEGORY_LABELS[category];
  const pageDescription =
    description ??
    categoryInfo?.description ??
    `${PLACE_CATEGORY_LABELS[category]} 정보를 지도와 목록으로 보기 쉽게 정리했습니다.`;

  const isRestaurant = category === "PET_RESTAURANT";

  const [categoryCounts, restaurantsLight, regions, placeCount, places] = await Promise.all([
    getCategoryCountsSnapshot(),
    isRestaurant ? getRestaurantsLightSnapshot() : Promise.resolve([]),
    isRestaurant ? getRegionsSnapshot() : Promise.resolve(null),
    isRestaurant ? Promise.resolve(0) : prisma.place.count({ where: { category, isActive: true } }),
    isRestaurant
      ? Promise.resolve([])
      : prisma.place.findMany({
          where: { category, isActive: true },
          orderBy: [{ ownerVerified: "desc" }, { updatedAt: "desc" }],
          take: 18,
        }),
  ]);

  const restaurants = isRestaurant ? sortRestaurantsLight(restaurantsLight).slice(0, 18).map(toRestaurantCardItem) : [];
  const count = isRestaurant ? categoryCounts.restaurantCount : placeCount;

  const mapItems = isRestaurant
    ? restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        categoryLabel: restaurant.businessType,
        href: `/restaurants/${restaurant.id}`,
      }))
    : places.map((place) => ({
        id: place.id,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        categoryLabel: PLACE_CATEGORY_LABELS[place.category],
        href: `/places/${place.id}`,
      }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">카테고리</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge">등록 {count.toLocaleString("ko-KR")}건</span>
            <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">{isRestaurant ? "지도 탐색 가능" : "지역별 목록 제공"}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{pageTitle}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">{pageDescription}</p>
          <div className="mt-6 max-w-3xl">
            <SearchBox />
          </div>
          {isRestaurant && regions && regions.bySido.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {regions.bySido.slice(0, 8).map((region) => (
                <span key={region.sido} className="badge bg-[rgba(31,74,64,0.08)] text-[#1a463f]">{region.sido} {region.count.toLocaleString("ko-KR")}건</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <FilterBottomSheet title="모바일 필터 열기">
        <div className="flex flex-wrap gap-2">
          {isRestaurant && regions
            ? regions.bySido.slice(0, 12).map((region) => (
                <span key={region.sido} className="badge">{region.sido} {region.count.toLocaleString("ko-KR")}건</span>
              ))
            : REGION_OPTIONS.map((region) => (
                <span key={region} className="badge">{region}</span>
              ))}
        </div>
      </FilterBottomSheet>

      <div className="mt-6">
        <ResponsiveMapLayout
          title={`${pageTitle} 지도`}
          description="지도와 목록을 함께 보며 위치를 비교할 수 있습니다. 모바일에서는 목록과 지도를 번갈아 확인할 수 있습니다."
          items={mapItems}
          sidebar={
            <>
              {isRestaurant ? (
                restaurants.length > 0 ? (
                  restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)
                ) : (
                  <EmptyState title="아직 식당 데이터가 비어 있습니다." description="다음 배치 동기화 이후 다시 확인해 주세요." character="dog-hoodie" />
                )
              ) : places.length > 0 ? (
                places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    item={{
                      id: place.id,
                      name: place.name,
                      address: place.address,
                      phone: place.phone,
                      ownerVerified: place.ownerVerified,
                      sourceType: place.sourceType,
                      category: place.category,
                      categoryLabel: PLACE_CATEGORY_LABELS[place.category],
                      href: `/places/${place.id}`,
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  title={getCategoryReadinessCopy(category, count).title}
                  description={getCategoryReadinessCopy(category, count).description}
                  character={categoryInfo?.character ?? "puppy-front-white"}
                />
              )}
            </>
          }
        />
      </div>

      <AdSlot label={`${pageTitle} 광고 영역`} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {isRestaurant ? (
          <OfficialDataNotice />
        ) : (
          <section className="card rounded-[1rem] p-5 sm:p-6">
            <p className="eyebrow">이용 안내</p>
            <h2 className="mt-4 text-xl font-black tracking-tight">{getCategoryReadinessCopy(category, count).title}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge">등록 {count.toLocaleString("ko-KR")}건</span>
              <span className="badge">지역별 정보 정리 중</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              {getCategoryReadinessCopy(category, count).description}
            </p>
          </section>
        )}
        {shouldShowMedicalDisclaimer(category) ? <MedicalDisclaimer /> : shouldShowLegalDisclaimer(category) ? <LegalDisclaimer /> : shouldShowPriceNote(category) ? <PriceNote /> : <PriceNote />}
      </div>
    </main>
  );
}