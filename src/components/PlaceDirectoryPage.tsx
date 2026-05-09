import { notFound } from "next/navigation";
import type { PlaceCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";
import { EmptyState } from "@/components/EmptyState";
import { FilterBottomSheet } from "@/components/FilterBottomSheet";
import { LocationApplyButton } from "@/components/LocationApplyButton";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { PlaceCard } from "@/components/PlaceCard";
import { PriceNote } from "@/components/PriceNote";
import { ResponsiveMapLayout } from "@/components/ResponsiveMapLayout";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SmartLink } from "@/components/SmartLink";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { AdSlot } from "@/components/AdSlot";
import { getApprovedBusinessCheckSummaries, getRecentApprovedBusinessCheckTargetIds } from "@/lib/business-checks";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getDiscoveryQualityScore, getInformationCompletenessSummary, getPublicReviewSummary, getTrustedBusinessEnrichment, hasUsableCoordinates, needsInformationCompletenessWork } from "@/lib/discovery-cards";
import { buildListFilterHref, compareByDistance, filterByListLocation, hasActiveListFilter, parseListSearchParams, type ListPageSearchParams } from "@/lib/list-location-filters";
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

function filterByRecentCheck<T extends { id: string }>(items: T[], recentCheckedIds: Set<string>, checked: "" | "recent") {
  return checked === "recent" ? items.filter((item) => recentCheckedIds.has(item.id)) : items;
}

function compareByRecentCheck<T extends { id: string }>(left: T, right: T, recentCheckedIds: Set<string>) {
  return Number(recentCheckedIds.has(right.id)) - Number(recentCheckedIds.has(left.id));
}

function filterByInformationNeeds<T>(items: T[], info: "" | "needs", getSummary: (item: T) => ReturnType<typeof getInformationCompletenessSummary>) {
  return info === "needs" ? items.filter((item) => needsInformationCompletenessWork(getSummary(item))) : items;
}

function compareByInformationNeeds<T>(left: T, right: T, info: "" | "needs", getSummary: (item: T) => ReturnType<typeof getInformationCompletenessSummary>) {
  if (info !== "needs") return 0;
  const leftSummary = getSummary(left);
  const rightSummary = getSummary(right);
  return leftSummary.score - rightSummary.score || rightSummary.missingLabels.length - leftSummary.missingLabels.length;
}

export async function PlaceDirectoryPage({
  categorySlug,
  title,
  description,
  baseHref,
  searchParams,
}: {
  categorySlug: string;
  title?: string;
  description?: string;
  baseHref?: string;
  searchParams?: ListPageSearchParams;
}) {
  const category = getPlaceCategoryBySlug(categorySlug);
  if (!category) notFound();

  const filterState = parseListSearchParams(searchParams);
  const hasFilter = hasActiveListFilter(filterState);

  const categoryInfo = QUICK_CATEGORIES.find((item) => item.category === category);
  const pageTitle = title ?? PLACE_CATEGORY_LABELS[category];
  const pageDescription =
    description ??
    categoryInfo?.description ??
    `${PLACE_CATEGORY_LABELS[category]}를 지도와 목록에서 함께 찾아보세요.`;

  const isRestaurant = category === "PET_RESTAURANT";
  const directoryHref = baseHref ?? (isRestaurant ? "/restaurants" : `/places/${categorySlug}`);

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
          take: hasFilter ? 500 : 36,
        }),
    getBusinessEnrichmentSnapshot(),
    getReviewSummariesSnapshot(),
  ]);

  const recentCheckedIds = await getRecentApprovedBusinessCheckTargetIds(isRestaurant ? "RESTAURANT" : "PLACE");
  const restaurantLocationCandidates = isRestaurant ? filterByListLocation(restaurantsLight, filterState) : [];
  const restaurantCandidates = filterByRecentCheck(restaurantLocationCandidates, recentCheckedIds, filterState.checked);
  const restaurantCardCandidates = isRestaurant ? sortRestaurantsLight(restaurantCandidates).map(toRestaurantCardItem) : [];
  const getRestaurantCompleteness = (restaurant: (typeof restaurantCardCandidates)[number]) => {
    const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", restaurant.id);
    const review = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", restaurant.id);
    return getInformationCompletenessSummary({
      hasSource: restaurant.officialRegistered,
      phone: getBusinessPhone(null, enrichment),
      externalHref: getBusinessExternalHref(enrichment),
      externalCategory: getBusinessExternalCategory(enrichment),
      reviewCount: review?.count,
      hasCoordinates: hasUsableCoordinates(restaurant.lat, restaurant.lng),
      hasPhoto: Boolean(enrichment?.googlePhotoName),
      hasBusinessCheck: recentCheckedIds.has(restaurant.id),
      hasUpdatedAt: Boolean(restaurant.dataUpdatedAt),
    });
  };
  const informationFilteredRestaurantCandidates = filterByInformationNeeds(restaurantCardCandidates, filterState.info, getRestaurantCompleteness);
  const restaurants = isRestaurant ? informationFilteredRestaurantCandidates.sort((a, b) => {
    const distanceCompare = compareByDistance(a, b, filterState);
    if (distanceCompare !== 0) return distanceCompare;
    const recentCompare = compareByRecentCheck(a, b, recentCheckedIds);
    if (recentCompare !== 0) return recentCompare;
    const informationCompare = compareByInformationNeeds(a, b, filterState.info, getRestaurantCompleteness);
    if (informationCompare !== 0) return informationCompare;
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
  const placeLocationCandidates = isRestaurant ? [] : filterByListLocation(places, filterState);
  const placeCandidates = filterByRecentCheck(placeLocationCandidates, recentCheckedIds, filterState.checked);
  const getPlaceCompleteness = (place: (typeof placeCandidates)[number]) => {
    const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
    const review = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
    return getInformationCompletenessSummary({
      hasSource: Boolean(place.sourceName),
      phone: getBusinessPhone(place.phone, enrichment),
      externalHref: getBusinessExternalHref(enrichment),
      externalCategory: getBusinessExternalCategory(enrichment),
      reviewCount: review?.count,
      hasCoordinates: hasUsableCoordinates(place.lat, place.lng),
      hasPhoto: Boolean(enrichment?.googlePhotoName),
      hasBusinessCheck: recentCheckedIds.has(place.id),
      hasUpdatedAt: Boolean(place.updatedAt),
    });
  };
  const informationFilteredPlaceCandidates = isRestaurant ? [] : filterByInformationNeeds(placeCandidates, filterState.info, getPlaceCompleteness);
  const displayPlaces = isRestaurant ? [] : [...informationFilteredPlaceCandidates].sort((a, b) => {
    const distanceCompare = compareByDistance(a, b, filterState);
    if (distanceCompare !== 0) return distanceCompare;
    const recentCompare = compareByRecentCheck(a, b, recentCheckedIds);
    if (recentCompare !== 0) return recentCompare;
    const informationCompare = compareByInformationNeeds(a, b, filterState.info, getPlaceCompleteness);
    if (informationCompare !== 0) return informationCompare;
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
  const totalCount = isRestaurant ? categoryCounts.restaurantCount : placeCount;
  const visibleCount = isRestaurant ? informationFilteredRestaurantCandidates.length : informationFilteredPlaceCandidates.length;
  const count = hasFilter ? visibleCount : totalCount;
  const readinessCopy = getCategoryReadinessCopy(category, totalCount);
  const [restaurantCheckSummaries, placeCheckSummaries] = await Promise.all([
    isRestaurant ? getApprovedBusinessCheckSummaries("RESTAURANT", restaurants.map((restaurant) => restaurant.id)) : Promise.resolve(new Map()),
    isRestaurant ? Promise.resolve(new Map()) : getApprovedBusinessCheckSummaries("PLACE", displayPlaces.map((place) => place.id)),
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
            {filterState.userLocation ? <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">내 위치 {filterState.userLocation.radiusKm}km</span> : null}
            {filterState.checked === "recent" ? <span className="badge bg-[#ecfdf5] text-[#047857]">최근 확인 {count.toLocaleString("ko-KR")}곳</span> : null}
            {filterState.info === "needs" ? <span className="badge bg-[#fff7ed] text-[#c2410c]">보강 필요 {count.toLocaleString("ko-KR")}곳</span> : null}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{pageTitle}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">{pageDescription}</p>
          <div className="mt-6 max-w-3xl">
            <SearchBox />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <LocationApplyButton baseHref={buildListFilterHref(directoryHref, { sido: filterState.sido || null, checked: filterState.checked || null, info: filterState.info || null })} radiusKm={20} pendingLabel="목록 바꾸는 중..." />
            <SmartLink
              href={buildListFilterHref(directoryHref, {
                sido: filterState.sido || null,
                location: filterState.userLocation,
                checked: filterState.checked === "recent" ? null : "recent",
                info: filterState.info || null,
              })}
              className={`btn-secondary text-sm ${filterState.checked === "recent" ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}
            >
              최근 확인된 곳
            </SmartLink>
            <SmartLink
              href={buildListFilterHref(directoryHref, {
                sido: filterState.sido || null,
                location: filterState.userLocation,
                checked: filterState.checked || null,
                info: filterState.info === "needs" ? null : "needs",
              })}
              className={`btn-secondary text-sm ${filterState.info === "needs" ? "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]" : ""}`.trim()}
            >
              보강 필요한 곳
            </SmartLink>
          </div>
          {isRestaurant && regions && regions.bySido.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {hasFilter ? (
                <SmartLink href={directoryHref} className="badge bg-white text-[#5f5550] hover:border-[var(--brand)] hover:text-[var(--brand)]">
                  전체 보기
                </SmartLink>
              ) : null}
              {regions.bySido.slice(0, 8).map((region) => (
                <SmartLink
                  key={region.sido}
                  href={buildListFilterHref(directoryHref, { sido: region.sido, checked: filterState.checked || null, info: filterState.info || null })}
                  className={`badge bg-[rgba(31,74,64,0.08)] text-[#1a463f] hover:border-[var(--brand)] hover:text-[var(--brand)] ${filterState.sido === region.sido ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}
                >
                  {region.sido} {region.count.toLocaleString("ko-KR")}곳
                </SmartLink>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <FilterBottomSheet title="모바일 필터 열기">
        <div className="flex flex-wrap gap-2">
          {hasFilter ? (
            <SmartLink href={directoryHref} className="badge bg-white text-[#5f5550]">
              전체 보기
            </SmartLink>
          ) : null}
          <SmartLink
            href={buildListFilterHref(directoryHref, {
              sido: filterState.sido || null,
              location: filterState.userLocation,
              checked: filterState.checked === "recent" ? null : "recent",
              info: filterState.info || null,
            })}
            className={`badge ${filterState.checked === "recent" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}
          >
            최근 확인된 곳
          </SmartLink>
          <SmartLink
            href={buildListFilterHref(directoryHref, {
              sido: filterState.sido || null,
              location: filterState.userLocation,
              checked: filterState.checked || null,
              info: filterState.info === "needs" ? null : "needs",
            })}
            className={`badge ${filterState.info === "needs" ? "bg-[#fff7ed] text-[#c2410c]" : ""}`.trim()}
          >
            보강 필요한 곳
          </SmartLink>
          {isRestaurant && regions
            ? regions.bySido.slice(0, 12).map((region) => (
                <SmartLink key={region.sido} href={buildListFilterHref(directoryHref, { sido: region.sido, checked: filterState.checked || null, info: filterState.info || null })} className={`badge ${filterState.sido === region.sido ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}>
                  {region.sido} {region.count.toLocaleString("ko-KR")}곳
                </SmartLink>
              ))
            : REGION_OPTIONS.map((region) => (
                <SmartLink key={region} href={buildListFilterHref(directoryHref, { sido: region, checked: filterState.checked || null, info: filterState.info || null })} className={`badge ${filterState.sido === region ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}>
                  {region}
                </SmartLink>
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
                          hasPhoto: Boolean(enrichment?.googlePhotoName),
                          reviewCount: reviewSummary?.count,
                          reviewAverage: reviewSummary?.averageOverall,
                          checkSummary: restaurantCheckSummaries.get(restaurant.id) ?? null,
                        }}
                      />
                    );
                  })
                ) : (
                  <EmptyState title={filterState.checked === "recent" ? "최근 확인된 식당이 아직 없어요." : hasFilter ? "조건에 맞는 식당이 없어요." : "아직 보여드릴 식당이 없어요."} description={filterState.checked === "recent" ? "확인 제보가 승인되면 이 목록에 먼저 올라옵니다." : hasFilter ? "전체 보기로 돌아가거나 다른 지역을 골라보세요." : "새 정보가 반영되면 이 화면에서 바로 볼 수 있습니다."} character="dog-hoodie" />
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
                        hasPhoto: Boolean(enrichment?.googlePhotoName),
                        reviewCount: reviewSummary?.count,
                        reviewAverage: reviewSummary?.averageOverall,
                        checkSummary: placeCheckSummaries.get(place.id) ?? null,
                        dataUpdatedAt: place.updatedAt,
                        categoryLabel: PLACE_CATEGORY_LABELS[place.category],
                        href: `/places/${place.id}`,
                      }}
                    />
                  );
                })
              ) : (
                <EmptyState
                  title={filterState.checked === "recent" ? `최근 확인된 ${PLACE_CATEGORY_LABELS[category]} 정보가 아직 없어요.` : hasFilter ? `조건에 맞는 ${PLACE_CATEGORY_LABELS[category]} 정보가 없어요.` : readinessCopy.title}
                  description={filterState.checked === "recent" ? "전화·방문 확인 제보가 승인되면 이 목록에 먼저 올라옵니다." : hasFilter ? "전체 보기로 돌아가거나 다른 지역을 골라보세요." : readinessCopy.description}
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
            <h2 className="mt-4 text-xl font-black tracking-tight">{readinessCopy.title}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge">{count.toLocaleString("ko-KR")}곳</span>
              <span className="badge">지역별로 정리 중</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              {readinessCopy.description}
            </p>
          </section>
        )}
        {shouldShowMedicalDisclaimer(category) ? <MedicalDisclaimer /> : shouldShowLegalDisclaimer(category) ? <LegalDisclaimer /> : shouldShowPriceNote(category) ? <PriceNote /> : <PriceNote />}
      </div>
    </main>
  );
}