import { MapPin } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { InformationCompletenessBadge } from "@/components/InformationCompletenessBadge";
import { LocationApplyButton } from "@/components/LocationApplyButton";
import { SmartLink } from "@/components/SmartLink";
import { getApprovedBusinessCheckSummaries, getRecentApprovedBusinessCheckTargetIds } from "@/lib/business-checks";
import { getBusinessCheckBadgeLabel } from "@/lib/business-checks-shared";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { buildDiscoveryMapHref, getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getDiscoveryQualityScore, getExternalInfoLabel, getInformationCompletenessSummary, getPlaceIdentity, getPlaceMapCategoryKey, getPublicReviewSummary, getReviewSummaryLabel, getTrustedBusinessEnrichment, hasUsableCoordinates, needsInformationCompletenessWork } from "@/lib/discovery-cards";
import { buildListFilterHref, compareByDistance, filterByListLocation, getSidoFullName, getSidoStats, hasActiveListFilter, parseListSearchParams, type ListPageSearchParams } from "@/lib/list-location-filters";
import { getReviewSummariesSnapshot, type PublicPlaceLight } from "@/lib/public-data";

type Props = {
  places: PublicPlaceLight[];
  categoryLabel: string;
  mapHref?: string;
  listHref?: string;
  searchParams?: ListPageSearchParams;
};

const PLACEHOLDER_NAME_PATTERNS = [
  /^#?grooming$/i,
  /^#?daycare$/i,
  /^#?funeral$/i,
  /^#?pharmacy$/i,
  /^#?hospital$/i,
  /^#?animal[-_\s]?hospital$/i,
];

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function isLowConfidencePlaceName(name: string) {
  const trimmed = normalizeDisplayName(name);
  if (!trimmed) return true;
  if (PLACEHOLDER_NAME_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  return false;
}

function getDisplayPlaceName(place: PublicPlaceLight, categoryLabel: string) {
  const cleanedName = normalizeDisplayName(place.name);
  if (!isLowConfidencePlaceName(place.name)) return cleanedName;
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${categoryLabel}` : `${categoryLabel} 업체`;
}

function getCategoryLeadCopy(categoryLabel: string) {
  if (categoryLabel.includes("미용")) return "견종·크기·피부 상태에 따라 예약 조건이 달라질 수 있어요. 먼저 예약할 곳부터 살펴보세요.";
  if (categoryLabel.includes("유치원") || categoryLabel.includes("호텔")) return "입소 기준, 예방접종, 호텔링 가능 여부는 업체마다 달라요. 상담할 곳을 먼저 골라보세요.";
  if (categoryLabel.includes("장례")) return "화장·봉안·픽업 가능 여부와 비용은 업체마다 달라요. 급할수록 전화 상담이 빠릅니다.";
  if (categoryLabel.includes("약국")) return "찾는 동물의약품 재고는 수시로 달라질 수 있어요. 가까운 약국을 고른 뒤 전화로 물어보세요.";
  if (categoryLabel.includes("병원")) return "오늘 진료 가능한지, 예약이 필요한지 먼저 확인할 수 있게 동네 병원을 모았습니다.";
  return "방문 전 필요한 조건을 먼저 확인할 수 있게 정리했습니다.";
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

export async function PlaceListSection({ places, categoryLabel, mapHref, listHref, searchParams }: Props) {
  if (places.length === 0) return null;

  const filterState = parseListSearchParams(searchParams);
  const listBaseHref = listHref ?? mapHref ?? "/map?category=all";
  const mapFilterHref = mapHref
    ? buildListFilterHref(mapHref, {
        sido: filterState.sido ? getSidoFullName(filterState.sido) : null,
        location: filterState.userLocation,
        checked: filterState.checked || null,
        info: filterState.info || null,
      })
    : undefined;
  const hasFilter = hasActiveListFilter(filterState);
  const [enrichmentSnapshot, reviewSnapshot, recentCheckedIds] = await Promise.all([getBusinessEnrichmentSnapshot(), getReviewSummariesSnapshot(), getRecentApprovedBusinessCheckTargetIds("PLACE")]);
  const locationFilteredPlaces = filterByListLocation(places, filterState);
  const filteredPlaces = filterByRecentCheck(locationFilteredPlaces, recentCheckedIds, filterState.checked);
  const getPlaceCompleteness = (place: PublicPlaceLight) => {
    const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
    const review = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
    const phone = getBusinessPhone(place.phone, enrichment);
    const externalCategory = getBusinessExternalCategory(enrichment);
    return getInformationCompletenessSummary({
      hasSource: Boolean(place.sourceName),
      phone,
      externalHref: getBusinessExternalHref(enrichment),
      externalCategory,
      reviewCount: review?.count,
      hasCoordinates: hasUsableCoordinates(place.lat, place.lng),
      hasPhoto: Boolean(enrichment?.googlePhotoName),
      hasBusinessCheck: recentCheckedIds.has(place.id),
      hasUpdatedAt: Boolean(place.updatedAt),
    });
  };
  const informationFilteredPlaces = filterByInformationNeeds(filteredPlaces, filterState.info, getPlaceCompleteness);
  const displayPlaces = [...informationFilteredPlaces].sort((a, b) => {
    const distanceCompare = compareByDistance(a, b, filterState);
    if (distanceCompare !== 0) return distanceCompare;
    const recentCompare = compareByRecentCheck(a, b, recentCheckedIds);
    if (recentCompare !== 0) return recentCompare;
    const confidenceCompare = Number(isLowConfidencePlaceName(a.name)) - Number(isLowConfidencePlaceName(b.name));
    if (confidenceCompare !== 0) return confidenceCompare;
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
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const visiblePlaces = displayPlaces.slice(0, 50);
  const checkSummaries = await getApprovedBusinessCheckSummaries("PLACE", visiblePlaces.map((place) => place.id));
  const topSidos = getSidoStats(places, 6);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      {/* 요약 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {categoryLabel} 찾기
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6f6258]">
            {getCategoryLeadCopy(categoryLabel)}
          </p>
        </div>
        {mapHref && (
          <div className="flex flex-wrap gap-2">
            <LocationApplyButton baseHref={buildListFilterHref(listBaseHref, { sido: filterState.sido || null, checked: filterState.checked || null, info: filterState.info || null })} radiusKm={20} pendingLabel="목록 바꾸는 중..." />
            <SmartLink href={mapFilterHref ?? mapHref} pendingLabel="지도 여는 중..." className="btn-secondary text-sm">
              지도에서 보기
            </SmartLink>
          </div>
        )}
      </div>

      {/* 지역 통계 배지 */}
      {topSidos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasFilter ? (
            <SmartLink href={listBaseHref} className="badge bg-white text-[#5f5550] hover:border-[var(--brand)] hover:text-[var(--brand)]">
              전체 보기
            </SmartLink>
          ) : null}
          {filterState.userLocation ? (
            <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">
              내 위치 {filterState.userLocation.radiusKm}km {displayPlaces.length.toLocaleString("ko-KR")}곳
            </span>
          ) : null}
          {filterState.info === "needs" ? (
            <span className="badge bg-[#fff7ed] text-[#c2410c]">
              보강 필요 {displayPlaces.length.toLocaleString("ko-KR")}곳
            </span>
          ) : null}
          <SmartLink
            href={buildListFilterHref(listBaseHref, {
              sido: filterState.sido || null,
              location: filterState.userLocation,
              checked: filterState.checked === "recent" ? null : "recent",
              info: filterState.info || null,
            })}
            className={`badge hover:border-[var(--brand)] hover:text-[var(--brand)] ${filterState.checked === "recent" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}
          >
            최근 확인된 곳
          </SmartLink>
          <SmartLink
            href={buildListFilterHref(listBaseHref, {
              sido: filterState.sido || null,
              location: filterState.userLocation,
              checked: filterState.checked || null,
              info: filterState.info === "needs" ? null : "needs",
            })}
            className={`badge hover:border-[var(--brand)] hover:text-[var(--brand)] ${filterState.info === "needs" ? "bg-[#fff7ed] text-[#c2410c]" : ""}`.trim()}
          >
            보강 필요한 곳
          </SmartLink>
          {topSidos.map((region) => (
            <SmartLink
              key={region.sido}
              href={buildListFilterHref(listBaseHref, { sido: region.sido, checked: filterState.checked || null, info: filterState.info || null })}
              className={`badge hover:border-[var(--brand)] hover:text-[var(--brand)] ${filterState.sido === region.sido ? "bg-[var(--brand-soft)] text-[var(--brand)]" : ""}`.trim()}
            >
              {region.sido} {region.count.toLocaleString("ko-KR")}곳
            </SmartLink>
          ))}
        </div>
      )}

      {/* 업체 카드 목록 (최대 50건 표시 — 정적 렌더) */}
      {displayPlaces.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlaces.map((place) => {
          const displayName = getDisplayPlaceName(place, categoryLabel);
          const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
          const phone = getBusinessPhone(place.phone, enrichment);
          const externalCategory = getBusinessExternalCategory(enrichment);
          const externalHref = getBusinessExternalHref(enrichment);
          const reviewSummary = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
          const hasReview = Boolean(reviewSummary?.count && reviewSummary.count > 0);
          const hasCoordinates = hasUsableCoordinates(place.lat, place.lng);
          const identity = getPlaceIdentity({ category: place.category, name: displayName, externalCategory });
          const checkSummary = checkSummaries.get(place.id) ?? null;
          const checkBadgeLabel = getBusinessCheckBadgeLabel(checkSummary);
          const completeness = getInformationCompletenessSummary({
            hasSource: Boolean(place.sourceName),
            phone,
            externalHref,
            externalCategory,
            reviewCount: reviewSummary?.count,
            hasCoordinates,
            hasPhoto: Boolean(enrichment?.googlePhotoName),
            hasBusinessCheck: Boolean(checkSummary?.count),
            hasUpdatedAt: Boolean(place.updatedAt),
          });
          const placeMapHref = buildDiscoveryMapHref({
            categoryKey: getPlaceMapCategoryKey(place.category),
            name: displayName,
            lat: place.lat,
            lng: place.lng,
          });

          return (
            <li
              key={place.id}
              className="rounded-xl border border-[rgba(56,41,29,0.08)] bg-white px-4 py-4 shadow-sm"
            >
              <SmartLink href={`/places/${place.id}`} className="block rounded-lg text-[var(--ink)] no-underline focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-black text-[#0369a1]">{categoryLabel}</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{identity.identityLabel}</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{hasCoordinates ? "지도에서 보기" : "주소로 찾기"}</span>
                  <InformationCompletenessBadge summary={completeness} />
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{phone ? "전화로 확인" : "전화번호 알려주기"}</span>
                  {checkBadgeLabel ? <span className="rounded bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-black text-[#047857]">{checkBadgeLabel}</span> : null}
                  {place.businessStatus ? (
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.businessStatus}</span>
                  ) : null}
                </div>
                <span className="mt-2 line-clamp-2 font-black leading-snug text-[#2d1d10] hover:text-[var(--brand)] hover:underline">
                  {displayName}
                </span>
                <p className="mt-2 line-clamp-1 text-xs leading-5 text-[#5f5550]">{identity.description}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{[place.sido, place.sigungu].filter(Boolean).join(" ") || "지역 정보를 정리 중이에요"}</p>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{place.roadAddress ?? place.address ?? "주소는 정리 중이에요"}</p>
                {completeness.gapLabel ? <p className="mt-2 line-clamp-1 text-[11px] font-bold text-[#8a6a3f]">{completeness.gapLabel}</p> : null}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-[#7b746d]">
                  <span>{externalCategory ?? getExternalInfoLabel(enrichment)}</span>
                  {checkSummary?.latestCheckedAt ? <span>{new Date(checkSummary.latestCheckedAt).toLocaleDateString("ko-KR")} 확인</span> : null}
                  {hasReview ? <span>{getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall)}</span> : null}
                </div>
              </SmartLink>
              <DiscoveryCardActions
                className="mt-2 border-t border-[var(--line)] pt-2"
                detailHref={`/places/${place.id}`}
                mapHref={placeMapHref}
                phone={phone}
                externalHref={externalHref}
              />
            </li>
          );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white px-5 py-8 text-center">
          <p className="text-base font-black text-[#2d1d10]">{filterState.checked === "recent" ? `최근 확인된 ${categoryLabel} 업체가 아직 없어요.` : `조건에 맞는 ${categoryLabel} 업체가 아직 없어요.`}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{filterState.checked === "recent" ? "확인 제보가 승인되면 이 목록에 먼저 올라옵니다." : "지역을 넓히거나 전체 목록에서 다시 찾아보세요."}</p>
          <SmartLink href={listBaseHref} className="btn-secondary mt-4 inline-flex text-sm">
            전체 보기
          </SmartLink>
        </div>
      )}

      <AdSlot label={`${categoryLabel} 목록 광고 영역`} className="mx-0" />

      {displayPlaces.length > 50 && (
        <p className="mt-4 text-center text-sm text-[#9d8e82]">
          먼저 보기 좋은 50곳만 보여드려요. 더 찾고 싶다면 지도나 검색을 이용해 주세요.
        </p>
      )}
    </section>
  );
}
