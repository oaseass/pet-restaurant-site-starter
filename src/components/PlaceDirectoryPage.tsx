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
import { SourceBadge } from "@/components/SourceBadge";
import { AdSlot } from "@/components/AdSlot";
import { CharacterImage } from "@/components/CharacterImage";
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
      title: `${label} 공식 데이터 연동 준비 중`,
      description: `${label} 카테고리는 아직 공개 데이터 연동과 운영 검수 체계를 준비 중입니다. 업체 등록과 사용자 제보 흐름을 정리한 뒤 순차적으로 공개합니다.`,
    };
  }

  return {
    title: `${label} 데이터 운영 안내`,
    description: `${label} 카테고리는 식당과 달리 공식 일일 동기화 대신 관리자 검수와 수동 등록을 우선 적용하고 있습니다. 방문 전 최신 운영 여부를 업소에 다시 확인해 주세요.`,
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
    `${PLACE_CATEGORY_LABELS[category]} 데이터를 공식 동기화, 제보, 업체 등록 기준으로 분리해서 보여줍니다.`;

  const isRestaurant = category === "PET_RESTAURANT";

  const [count, restaurants, places] = await Promise.all([
    isRestaurant
      ? prisma.restaurant.count({ where: { status: "ACTIVE" } })
      : prisma.place.count({ where: { category, isActive: true } }),
    isRestaurant
      ? prisma.restaurant.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
          take: 18,
        })
      : Promise.resolve([]),
    isRestaurant
      ? Promise.resolve([])
      : prisma.place.findMany({
          where: { category, isActive: true },
          orderBy: [{ ownerVerified: "desc" }, { updatedAt: "desc" }],
          take: 18,
        }),
  ]);

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
      }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute -right-2 -top-2 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,184,107,0.32),rgba(255,255,255,0)_70%)]" />
        <div className="absolute bottom-0 right-2 h-28 w-28 sm:h-32 sm:w-32">
          <CharacterImage asset={categoryInfo?.character ?? "dog-brown"} className="h-full w-full" imageClassName="object-contain" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Place Directory</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SourceBadge label={isRestaurant ? "공식 일일 동기화" : "공식·제보·업체 등록 분리"} />
            <SourceBadge label={`등록 ${count.toLocaleString("ko-KR")}건`} tone="manual" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{pageTitle}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#665950] sm:text-base">{pageDescription}</p>
          <div className="mt-6 max-w-3xl">
            <SearchBox />
          </div>
        </div>
      </section>

      <FilterBottomSheet title="모바일 필터 열기">
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((region) => (
            <span key={region} className="badge">{region}</span>
          ))}
        </div>
      </FilterBottomSheet>

      <div className="mt-6">
        <ResponsiveMapLayout
          title={`${pageTitle} 탐색 레이아웃`}
          description="사용자 검색과 목록 노출은 내부 DB만 사용합니다. 공식 데이터 접근은 서버 배치에서만 실행하며, 모바일에서는 리스트와 필터를 먼저 보기 쉽게 배치합니다."
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
          <section className="card rounded-[2rem] p-5 sm:p-6">
            <p className="eyebrow">Category Note</p>
            <h2 className="mt-4 text-xl font-black tracking-tight">{getCategoryReadinessCopy(category, count).title}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge bg-[rgba(56,41,29,0.08)] text-[#5f5550]">식당 전용 식품안전나라 안내 미노출</span>
              <span className="badge">등록 {count.toLocaleString("ko-KR")}건</span>
              <span className="badge">공식 데이터 연동 준비 중</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5e544d] sm:text-[15px]">
              {getCategoryReadinessCopy(category, count).description}
            </p>
          </section>
        )}
        {shouldShowMedicalDisclaimer(category) ? <MedicalDisclaimer /> : shouldShowLegalDisclaimer(category) ? <LegalDisclaimer /> : shouldShowPriceNote(category) ? <PriceNote /> : <PriceNote />}
      </div>
    </main>
  );
}