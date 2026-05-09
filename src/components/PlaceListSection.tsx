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

function isLowInformationCategory(categoryLabel: string) {
  return categoryLabel.includes("미용") || categoryLabel.includes("유치원") || categoryLabel.includes("호텔");
}

function getLowInformationCategoryNotice(categoryLabel: string) {
  if (categoryLabel.includes("미용")) {
    return "미용은 견종, 몸무게, 피부 상태, 올가미 가능 여부에 따라 가능한 서비스가 달라져서 기본 등록 정보만으로는 판단이 어렵습니다. 직접 확인이나 후기, 지도 비교가 붙은 곳부터 먼저 보세요.";
  }

  return "유치원·호텔은 입소 기준, 예방접종, 단독 케어, 야간 상주 여부가 업체마다 달라서 기본 등록 정보만으로는 판단이 어렵습니다. 직접 확인이나 후기, 지도 비교가 붙은 곳부터 먼저 보세요.";
}

function getTopicParticle(text: string) {
  const lastChar = text.trim().charCodeAt(text.trim().length - 1);
  if (Number.isNaN(lastChar) || lastChar < 0xac00 || lastChar > 0xd7a3) return "는";
  return (lastChar - 0xac00) % 28 === 0 ? "는" : "은";
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
  const lowInfoCategory = isLowInformationCategory(categoryLabel);
  const cardItems = visiblePlaces.map((place) => {
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

    return {
      place,
      displayName,
      phone,
      externalCategory,
      externalHref,
      reviewSummary,
      hasReview,
      hasCoordinates,
      identity,
      checkSummary,
      checkBadgeLabel,
      completeness,
      placeMapHref,
      isEnriched: Boolean(checkSummary?.count) || hasReview || Boolean(externalHref),
    };
  });
  const lowInfoStats = lowInfoCategory
    ? {
        checked: cardItems.filter((item) => Boolean(item.checkSummary?.count)).length,
        reviewed: cardItems.filter((item) => item.hasReview).length,
        compared: cardItems.filter((item) => Boolean(item.externalHref)).length,
        callable: cardItems.filter((item) => Boolean(item.phone)).length,
      }
    : null;
  const enrichedCardItems = lowInfoCategory ? cardItems.filter((item) => item.isEnriched) : [];
  const enrichedCardItemIds = new Set(enrichedCardItems.map((item) => item.place.id));
  const baselineCardItems = lowInfoCategory ? cardItems.filter((item) => !enrichedCardItemIds.has(item.place.id)) : cardItems;

  const renderPlaceCards = (items: typeof cardItems) => (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.place.id}
          className="rounded-xl border border-[rgba(56,41,29,0.08)] bg-white px-4 py-4 shadow-sm"
        >
          <SmartLink href={`/places/${item.place.id}`} className="block rounded-lg text-[var(--ink)] no-underline focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-black text-[#0369a1]">{categoryLabel}</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{item.identity.identityLabel}</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{item.hasCoordinates ? "지도에서 보기" : "주소로 찾기"}</span>
              <InformationCompletenessBadge summary={item.completeness} />
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{item.phone ? "전화로 확인" : "전화번호 알려주기"}</span>
              {item.checkBadgeLabel ? <span className="rounded bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-black text-[#047857]">{item.checkBadgeLabel}</span> : null}
              {item.place.businessStatus ? (
                <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{item.place.businessStatus}</span>
              ) : null}
            </div>
            <span className="mt-2 line-clamp-2 font-black leading-snug text-[#2d1d10] hover:text-[var(--brand)] hover:underline">
              {item.displayName}
            </span>
            <p className="mt-2 line-clamp-1 text-xs leading-5 text-[#5f5550]">{item.identity.description}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{[item.place.sido, item.place.sigungu].filter(Boolean).join(" ") || "지역 정보를 정리 중이에요"}</p>
            <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{item.place.roadAddress ?? item.place.address ?? "주소는 정리 중이에요"}</p>
            {item.completeness.gapLabel ? <p className="mt-2 line-clamp-1 text-[11px] font-bold text-[#8a6a3f]">{item.completeness.gapLabel}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-[#7b746d]">
              <span>{item.externalCategory ?? getExternalInfoLabel(getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", item.place.id, item.place.category))}</span>
              {item.checkSummary?.latestCheckedAt ? <span>{new Date(item.checkSummary.latestCheckedAt).toLocaleDateString("ko-KR")} 확인</span> : null}
              {item.hasReview ? <span>{getReviewSummaryLabel(item.reviewSummary?.count, item.reviewSummary?.averageOverall)}</span> : null}
            </div>
          </SmartLink>
          <DiscoveryCardActions
            className="mt-2 border-t border-[var(--line)] pt-2"
            detailHref={`/places/${item.place.id}`}
            mapHref={item.placeMapHref}
            phone={item.phone}
            externalHref={item.externalHref}
          />
        </li>
      ))}
    </ul>
  );

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
        <>
          {lowInfoCategory ? (
            <div className="mt-6 rounded-2xl border border-[#fde68a] bg-[#fff8db] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black tracking-[0.04em] text-[#b45309]">상담 우선 카테고리</p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-[#7c2d12]">{categoryLabel}{getTopicParticle(categoryLabel)} 기본 등록 정보만으로 판단하기 어려워요.</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[#92400e]">{getLowInformationCategoryNotice(categoryLabel)}</p>
                </div>
                {lowInfoStats ? <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#92400e]">전화 가능 {lowInfoStats.callable.toLocaleString("ko-KR")}곳</span> : null}
              </div>
              {lowInfoStats ? (
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-[#92400e]">
                  <span className="rounded-full bg-white px-3 py-1.5">직접 확인 {lowInfoStats.checked.toLocaleString("ko-KR")}곳</span>
                  <span className="rounded-full bg-white px-3 py-1.5">후기 있음 {lowInfoStats.reviewed.toLocaleString("ko-KR")}곳</span>
                  <span className="rounded-full bg-white px-3 py-1.5">지도 비교 {lowInfoStats.compared.toLocaleString("ko-KR")}곳</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {lowInfoCategory && enrichedCardItems.length > 0 ? (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#2d1d10]">먼저 확인할 곳</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">직접 확인, 후기, 지도 비교처럼 추가 근거가 붙은 업체를 먼저 모았습니다.</p>
                </div>
                <span className="badge bg-[#ecfdf5] text-[#047857]">{enrichedCardItems.length.toLocaleString("ko-KR")}곳</span>
              </div>
              {renderPlaceCards(enrichedCardItems)}
            </div>
          ) : null}

          {lowInfoCategory && enrichedCardItems.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white px-5 py-5 text-sm font-bold leading-7 text-[var(--muted)]">
              아직 직접 확인, 후기, 지도 비교가 붙은 업체가 많지 않습니다. 아래 기본 등록 목록에서 후보를 고른 뒤 전화로 조건을 먼저 상담해 주세요.
            </div>
          ) : null}

          {!lowInfoCategory ? <div className="mt-6">{renderPlaceCards(cardItems)}</div> : null}

          {lowInfoCategory && baselineCardItems.length > 0 ? (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#2d1d10]">기본 등록 목록</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">공개자료 기준으로 먼저 모아둔 목록입니다. 서비스 범위와 가능 여부는 업체와 직접 확인해 주세요.</p>
                </div>
                <span className="badge">{baselineCardItems.length.toLocaleString("ko-KR")}곳</span>
              </div>
              {renderPlaceCards(baselineCardItems)}
            </div>
          ) : null}
        </>
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
