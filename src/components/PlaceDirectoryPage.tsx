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
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getDiscoveryQualityScore, getPublicReviewSummary, getTrustedBusinessEnrichment, hasUsableCoordinates } from "@/lib/discovery-cards";
import { getCategoryCountsSnapshot, getRegionsSnapshot, getRestaurantsLightSnapshot, getReviewSummariesSnapshot, sortRestaurantsLight, toRestaurantCardItem } from "@/lib/public-data";
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
      title: `${label} 정보는 아직 준비 중이에요.`,
      description: `${label} 정보가 들어오면 동네별 목록과 상세 화면에서 바로 볼 수 있습니다.`,
    };
  }

  return {
    title: `${label} 가기 전 참고할 점`,
    description: `${label} 목록은 계속 보강하고 있어요. 방문 전 오늘 운영 여부와 이용 조건을 한 번 더 물어보세요.`,
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
    `${PLACE_CATEGORY_LABELS[category]}를 지도와 목록에서 함께 찾아보세요.`;

  const isRestaurant = category === "PET_RESTAURANT";

  const [categoryCounts, restaurantsLight, regions, placeCount, places, enrichmentSnapshot, reviewSnapshot] = await Promise.all([
    getCategoryCountsSnapshot(),
    isRestaurant ? getRestaurantsLightSnapshot() : Promise.resolve([]),
    isRestaurant ? getRegionsSnapshot() : Promise.resolve(null),
    isRestaurant ? Promise.resolve(0) : prisma.place.count({ where: { category, isActive: true } }),
    isRestaurant
      ? Promise.resolve([])
      : prisma.place.findMany({
          where: { category, isActive: true },
          orderBy: [{ ownerVerified: "desc" }, { updatedAt: "desc" }],
          take: 36,
        }),
    getBusinessEnrichmentSnapshot(),
    getReviewSummariesSnapshot(),
  ]);

  const restaurants = isRestaurant ? sortRestaurantsLight(restaurantsLight).map(toRestaurantCardItem).sort((a, b) => {
    const aEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", a.id);
    const bEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", b.id);
    const aReview = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", a.id);
    const bReview = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", b.id);
    const aScore = getDiscoveryQualityScore({
      phone: getBusinessPhone(null, aEnrichment),
      externalHref: getBusinessExternalHref(aEnrichment),
      externalCategory: getBusinessExternalCategory(aEnrichment),
      reviewCount: aReview?.count,
      hasCoordinates: hasUsableCoordinates(a.lat, a.lng),
    });
    const bScore = getDiscoveryQualityScore({
      phone: getBusinessPhone(null, bEnrichment),
      externalHref: getBusinessExternalHref(bEnrichment),
      externalCategory: getBusinessExternalCategory(bEnrichment),
      reviewCount: bReview?.count,
      hasCoordinates: hasUsableCoordinates(b.lat, b.lng),
    });
    if (aScore !== bScore) return bScore - aScore;
    return b.dataUpdatedAt.getTime() - a.dataUpdatedAt.getTime();
  }).slice(0, 18) : [];
  const displayPlaces = isRestaurant ? [] : [...places].sort((a, b) => {
    const aEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", a.id, a.category);
    const bEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", b.id, b.category);
    const aReview = getPublicReviewSummary(reviewSnapshot, "PLACE", a.id);
    const bReview = getPublicReviewSummary(reviewSnapshot, "PLACE", b.id);
    const aScore = getDiscoveryQualityScore({
      phone: getBusinessPhone(a.phone, aEnrichment),
      externalHref: getBusinessExternalHref(aEnrichment),
      externalCategory: getBusinessExternalCategory(aEnrichment),
      reviewCount: aReview?.count,
      hasCoordinates: hasUsableCoordinates(a.lat, a.lng),
    });
    const bScore = getDiscoveryQualityScore({
      phone: getBusinessPhone(b.phone, bEnrichment),
      externalHref: getBusinessExternalHref(bEnrichment),
      externalCategory: getBusinessExternalCategory(bEnrichment),
      reviewCount: bReview?.count,
      hasCoordinates: hasUsableCoordinates(b.lat, b.lng),
    });
    if (aScore !== bScore) return bScore - aScore;
    return Number(b.ownerVerified) - Number(a.ownerVerified) || b.updatedAt.getTime() - a.updatedAt.getTime();
  }).slice(0, 18);
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
    : displayPlaces.map((place) => ({
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
            <span className="badge">{count.toLocaleString("ko-KR")}곳</span>
            <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">{isRestaurant ? "지도에서 같이 보기" : "지역별로 찾기"}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{pageTitle}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">{pageDescription}</p>
          <div className="mt-6 max-w-3xl">
            <SearchBox />
          </div>
          {isRestaurant && regions && regions.bySido.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {regions.bySido.slice(0, 8).map((region) => (
                <span key={region.sido} className="badge bg-[rgba(31,74,64,0.08)] text-[#1a463f]">{region.sido} {region.count.toLocaleString("ko-KR")}곳</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <FilterBottomSheet title="모바일 필터 열기">
        <div className="flex flex-wrap gap-2">
          {isRestaurant && regions
            ? regions.bySido.slice(0, 12).map((region) => (
                <span key={region.sido} className="badge">{region.sido} {region.count.toLocaleString("ko-KR")}곳</span>
              ))
            : REGION_OPTIONS.map((region) => (
                <span key={region} className="badge">{region}</span>
              ))}
        </div>
      </FilterBottomSheet>

      <div className="mt-6">
        <ResponsiveMapLayout
          title={`${pageTitle} 지도`}
          description="지도와 목록을 함께 보며 가까운 곳을 비교해보세요. 모바일에서는 목록과 지도를 번갈아 볼 수 있습니다."
          items={mapItems}
          sidebar={
            <>
              {isRestaurant ? (
                restaurants.length > 0 ? (
                  restaurants.map((restaurant) => {
                    const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", restaurant.id);
                    const reviewSummary = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", restaurant.id);
                    return (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={{
                          ...restaurant,
                          phone: getBusinessPhone(null, enrichment),
                          externalCategory: getBusinessExternalCategory(enrichment),
                          externalHref: getBusinessExternalHref(enrichment),
                          reviewCount: reviewSummary?.count,
                          reviewAverage: reviewSummary?.averageOverall,
                        }}
                      />
                    );
                  })
                ) : (
                  <EmptyState title="아직 보여드릴 식당이 없어요." description="새 정보가 반영되면 이 화면에서 바로 볼 수 있습니다." character="dog-hoodie" />
                )
              ) : displayPlaces.length > 0 ? (
                displayPlaces.map((place) => {
                  const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
                  const reviewSummary = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
                  return (
                    <PlaceCard
                      key={place.id}
                      item={{
                        id: place.id,
                        name: place.name,
                        address: place.address,
                        phone: getBusinessPhone(place.phone, enrichment),
                        lat: place.lat,
                        lng: place.lng,
                        ownerVerified: place.ownerVerified,
                        sourceType: place.sourceType,
                        sourceName: place.sourceName,
                        category: place.category,
                        businessStatus: place.businessStatus,
                        externalCategory: getBusinessExternalCategory(enrichment),
                        externalHref: getBusinessExternalHref(enrichment),
                        reviewCount: reviewSummary?.count,
                        reviewAverage: reviewSummary?.averageOverall,
                        dataUpdatedAt: place.updatedAt,
                        categoryLabel: PLACE_CATEGORY_LABELS[place.category],
                        href: `/places/${place.id}`,
                      }}
                    />
                  );
                })
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
              <span className="badge">{count.toLocaleString("ko-KR")}곳</span>
              <span className="badge">지역별로 정리 중</span>
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