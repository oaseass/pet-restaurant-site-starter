import { MapPin, Search } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import type { SearchRestaurantResult, SearchPlaceResult } from "@/lib/public-search";
import { PLACE_CATEGORY_LABELS as GUIDE_CATEGORY_LABELS, type GuideDoc } from "@/lib/platform-content";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { getReviewSummariesSnapshot } from "@/lib/public-data";
import { buildDiscoveryMapHref, buildReviewHref, getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getDiscoveryQualityScore, getExternalInfoLabel, getPlaceIdentity, getPlaceMapCategoryKey, getPublicReviewSummary, getRestaurantIdentity, getReviewSummaryLabel, getTrustedBusinessEnrichment, hasUsableCoordinates } from "@/lib/discovery-cards";

const PLACE_CATEGORY_LABELS: Record<string, string> = {
  ANIMAL_HOSPITAL: "동물병원",
  PHARMACY: "동물약국",
  GROOMING: "미용",
  DAYCARE: "유치원·호텔",
  FUNERAL: "장례",
};

interface SearchResultsListProps {
  restaurants: SearchRestaurantResult[];
  places?: SearchPlaceResult[];
  guides: GuideDoc[];
  keyword: string;
  mapHref?: string;
}

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function isLowConfidencePlaceName(name: string) {
  const trimmed = normalizeDisplayName(name);
  if (!trimmed) return true;
  if (/^#?[a-z_-]+$/i.test(trimmed) && !/[가-힣]/.test(trimmed)) return true;
  return false;
}

function getDisplayPlaceName(place: SearchPlaceResult) {
  const cleanedName = normalizeDisplayName(place.name);
  if (!isLowConfidencePlaceName(place.name)) return cleanedName;
  const label = place.categoryLabel ?? PLACE_CATEGORY_LABELS[place.category] ?? "시설";
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${label}` : `${label} 업체`;
}

function restaurantMapHref(restaurant: SearchRestaurantResult) {
  return buildDiscoveryMapHref({ categoryKey: "restaurants", name: restaurant.name, lat: restaurant.lat, lng: restaurant.lng });
}

function placeMapHref(place: SearchPlaceResult) {
  return buildDiscoveryMapHref({ categoryKey: getPlaceMapCategoryKey(place.category), name: getDisplayPlaceName(place), lat: place.lat, lng: place.lng });
}

function regionLabel(item: { sido?: string | null; sigungu?: string | null }) {
  return [item.sido, item.sigungu].filter(Boolean).join(" ") || "지역 정보를 정리 중이에요";
}

function SectionHeader({ title, count, description }: { title: string; count: number; description: string }) {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[var(--ink)]">{title}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[var(--muted)]">{count.toLocaleString("ko-KR")}건</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>
    </div>
  );
}

export async function SearchResultsList({ restaurants, places = [], guides, keyword, mapHref }: SearchResultsListProps) {
  const total = restaurants.length + places.length + guides.length;
  const [enrichmentSnapshot, reviewSnapshot] = total > 0
    ? await Promise.all([getBusinessEnrichmentSnapshot(), getReviewSummariesSnapshot()])
    : [{}, {}];
  const sortedRestaurants = [...restaurants].sort((left, right) => {
    const leftEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", left.id);
    const rightEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", right.id);
    const leftReview = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", left.id);
    const rightReview = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", right.id);
    const leftScore = left.score + getDiscoveryQualityScore({
      phone: getBusinessPhone(null, leftEnrichment),
      externalHref: getBusinessExternalHref(leftEnrichment),
      externalCategory: getBusinessExternalCategory(leftEnrichment),
      reviewCount: leftReview?.count,
      hasCoordinates: hasUsableCoordinates(left.lat, left.lng),
    }) * 0.25;
    const rightScore = right.score + getDiscoveryQualityScore({
      phone: getBusinessPhone(null, rightEnrichment),
      externalHref: getBusinessExternalHref(rightEnrichment),
      externalCategory: getBusinessExternalCategory(rightEnrichment),
      reviewCount: rightReview?.count,
      hasCoordinates: hasUsableCoordinates(right.lat, right.lng),
    }) * 0.25;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return left.name.localeCompare(right.name, "ko-KR");
  });
  const sortedPlaces = [...places].sort((left, right) => {
    const leftEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", left.id, left.category);
    const rightEnrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", right.id, right.category);
    const leftReview = getPublicReviewSummary(reviewSnapshot, "PLACE", left.id);
    const rightReview = getPublicReviewSummary(reviewSnapshot, "PLACE", right.id);
    const leftScore = left.score + getDiscoveryQualityScore({
      phone: getBusinessPhone(left.phone, leftEnrichment),
      externalHref: getBusinessExternalHref(leftEnrichment),
      externalCategory: getBusinessExternalCategory(leftEnrichment),
      reviewCount: leftReview?.count,
      hasCoordinates: hasUsableCoordinates(left.lat, left.lng),
    }) * 0.25;
    const rightScore = right.score + getDiscoveryQualityScore({
      phone: getBusinessPhone(right.phone, rightEnrichment),
      externalHref: getBusinessExternalHref(rightEnrichment),
      externalCategory: getBusinessExternalCategory(rightEnrichment),
      reviewCount: rightReview?.count,
      hasCoordinates: hasUsableCoordinates(right.lat, right.lng),
    }) * 0.25;
    if (leftScore !== rightScore) return rightScore - leftScore;
    return getDisplayPlaceName(left).localeCompare(getDisplayPlaceName(right), "ko-KR");
  });

  return (
    <div>
      <section className="border-b border-[var(--line)] bg-[#fafdf9] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">찾은 결과</p>
            <p className="mt-1 text-sm font-black text-[var(--ink)]">
              {total === 0 ? "아직 맞는 결과를 못 찾았어요" : `${total.toLocaleString("ko-KR")}곳을 찾았어요`}
            </p>
          </div>
          {keyword ? (
            <SmartLink href={mapHref ?? `/map?q=${encodeURIComponent(keyword)}`} pendingLabel="지도 여는 중..." className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--brand)] bg-white px-4 text-xs font-black text-[var(--brand)]">
              <MapPin size={14} />
              지도에서 보기
            </SmartLink>
          ) : null}
        </div>
        {total > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">식당 {restaurants.length.toLocaleString("ko-KR")}</span>
            <span className="rounded-full bg-white px-2.5 py-1">시설 {places.length.toLocaleString("ko-KR")}</span>
            <span className="rounded-full bg-white px-2.5 py-1">가이드 {guides.length.toLocaleString("ko-KR")}</span>
          </div>
        ) : null}
      </section>

      {total > 0 ? <AdSlot label="검색 결과 광고 영역" className="mx-3" /> : null}

      {total === 0 && keyword ? (
        <section className="px-4 py-10 text-center">
          <Search className="mx-auto text-[var(--muted)]" size={24} />
          <p className="mt-3 text-sm font-black text-[var(--ink)]">검색어와 딱 맞는 곳을 못 찾았어요.</p>
          <p className="mt-2 text-xs leading-6 text-[var(--muted)]">동네 이름이나 업종을 조금 짧게 넣어보세요.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["서울 동물병원", "동물약국", "미용", "유치원"].map((sample) => (
              <SmartLink key={sample} href={`/search?q=${encodeURIComponent(sample)}`} className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand)] no-underline">
                {sample}
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}

      {restaurants.length > 0 ? (
        <section>
          <SectionHeader title="식당" count={restaurants.length} description="강아지랑 같이 앉을 수 있는 좌석은 매장마다 달라요. 피크타임 전에는 전화가 가장 빠릅니다." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {sortedRestaurants.map((restaurant) => {
              const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", restaurant.id);
              const phone = getBusinessPhone(null, enrichment);
              const externalCategory = getBusinessExternalCategory(enrichment);
              const externalHref = getBusinessExternalHref(enrichment);
              const reviewSummary = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", restaurant.id);
              const hasReview = Boolean(reviewSummary?.count && reviewSummary.count > 0);
              const identity = getRestaurantIdentity({ businessType: restaurant.businessType, externalCategory });
              return (
                <article key={restaurant.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <SmartLink href={`/restaurants/${restaurant.id}`} className="block text-[var(--ink)] no-underline">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand)]">{identity.eyebrow}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{identity.identityLabel}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{restaurant.lat !== null ? "지도에서 보기" : "주소로 찾기"}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{phone ? "전화로 확인" : "전화번호 알려주기"}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{restaurant.name}</h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel(restaurant)}</p>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{restaurant.address}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-[#7b746d]">
                      <span>{externalCategory ?? getExternalInfoLabel(enrichment)}</span>
                      {hasReview ? <span>{getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall)}</span> : null}
                    </div>
                  </SmartLink>
                  <DiscoveryCardActions
                    className="mt-3 border-t border-[var(--line)] pt-3"
                    detailHref={`/restaurants/${restaurant.id}`}
                    mapHref={restaurantMapHref(restaurant)}
                    phone={phone}
                    externalHref={externalHref}
                    reviewHref={buildReviewHref("RESTAURANT", restaurant.id)}
                  />
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {places.length > 0 ? (
        <section>
          <SectionHeader title="시설" count={places.length} description="병원, 약국, 미용, 유치원, 장례는 운영 방식이 달라요. 필요한 조건을 전화로 먼저 물어보세요." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {sortedPlaces.map((place) => {
              const displayName = getDisplayPlaceName(place);
              const categoryLabel = place.categoryLabel ?? PLACE_CATEGORY_LABELS[place.category] ?? "시설";
              const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
              const phone = getBusinessPhone(place.phone, enrichment);
              const externalCategory = getBusinessExternalCategory(enrichment);
              const externalHref = getBusinessExternalHref(enrichment);
              const reviewSummary = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
              const hasReview = Boolean(reviewSummary?.count && reviewSummary.count > 0);
              const identity = getPlaceIdentity({ category: place.category, name: displayName, externalCategory });
              return (
                <article key={place.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <SmartLink href={`/places/${place.id}`} className="block text-[var(--ink)] no-underline">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-black text-[#0369a1]">{categoryLabel}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{identity.identityLabel}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.lat !== null ? "지도에서 보기" : "주소로 찾기"}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{phone ? "전화로 확인" : "전화번호 알려주기"}</span>
                      {place.businessStatus ? <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.businessStatus}</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{displayName}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5f5550]">{identity.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel(place)}</p>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{place.roadAddress ?? place.address ?? "주소는 정리 중이에요"}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-[#7b746d]">
                      <span>{externalCategory ?? getExternalInfoLabel(enrichment)}</span>
                      {hasReview ? <span>{getReviewSummaryLabel(reviewSummary?.count, reviewSummary?.averageOverall)}</span> : null}
                    </div>
                  </SmartLink>
                  <DiscoveryCardActions
                    className="mt-3 border-t border-[var(--line)] pt-3"
                    detailHref={`/places/${place.id}`}
                    mapHref={placeMapHref(place)}
                    phone={phone}
                    externalHref={externalHref}
                    reviewHref={buildReviewHref("PLACE", place.id)}
                  />
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {guides.length > 0 ? (
        <section>
          <SectionHeader title="가이드" count={guides.length} description="가기 전에 물어볼 질문과 챙길 것만 빠르게 볼 수 있어요." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {guides.map((guide) => (
              <SmartLink key={guide.slug} href={`/guide/${guide.slug}`} className="rounded-lg border border-[var(--line)] bg-white p-4 text-[var(--ink)] no-underline transition hover:bg-[#fcfbf9]">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-[#f5f3ff] px-2 py-0.5 text-[10px] font-black text-[#7c3aed]">가이드</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{GUIDE_CATEGORY_LABELS[guide.category] ?? "가이드"}</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{guide.readMinutes}분</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{guide.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{guide.summary}</p>
                <span className="mt-3 inline-flex text-xs font-black text-[#7c3aed]">가이드 보기 →</span>
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
