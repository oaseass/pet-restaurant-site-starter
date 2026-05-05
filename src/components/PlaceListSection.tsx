import { CalendarDays, MapPin } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import { buildDiscoveryMapHref, buildReviewHref, formatDiscoveryDate, getBusinessExternalCategory, getBusinessExternalHref, getBusinessPhone, getExternalInfoLabel, getPlaceMapCategoryKey, getReviewSummaryLabel, getTrustedBusinessEnrichment, hasUsableCoordinates } from "@/lib/discovery-cards";
import type { PublicPlaceLight } from "@/lib/public-data";

type Props = {
  places: PublicPlaceLight[];
  categoryLabel: string;
  mapHref?: string;
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

export async function PlaceListSection({ places, categoryLabel, mapHref }: Props) {
  if (places.length === 0) return null;

  const enrichmentSnapshot = await getBusinessEnrichmentSnapshot();
  const displayPlaces = [...places].sort((a, b) => Number(isLowConfidencePlaceName(a.name)) - Number(isLowConfidencePlaceName(b.name)));
  const withCoords = places.filter((p) => p.lat !== null);
  const sidoCounts = new Map<string, number>();
  for (const p of places) {
    if (p.sido) sidoCounts.set(p.sido, (sidoCounts.get(p.sido) ?? 0) + 1);
  }
  const topSidos = [...sidoCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sido]) => sido);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      {/* 요약 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {categoryLabel} 업체 목록
          </h2>
          <p className="mt-1 text-sm text-[#9d8e82]">
            총 {places.length.toLocaleString("ko-KR")}건 · 좌표 등록{" "}
            {withCoords.length.toLocaleString("ko-KR")}건
          </p>
        </div>
        {mapHref && (
          <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="btn-primary text-sm">
            지도에서 보기
          </SmartLink>
        )}
      </div>

      {/* 지역 통계 바지 */}
      {topSidos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {topSidos.map((sido) => (
            <span key={sido} className="badge">
              {sido} {sidoCounts.get(sido)?.toLocaleString("ko-KR")}건
            </span>
          ))}
        </div>
      )}

      {/* 업체 카드 목록 (최대 50건 표시 — 정적 렌더) */}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayPlaces.slice(0, 50).map((place) => {
          const displayName = getDisplayPlaceName(place, categoryLabel);
          const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
          const phone = getBusinessPhone(place.phone, enrichment);
          const externalCategory = getBusinessExternalCategory(enrichment);
          const externalHref = getBusinessExternalHref(enrichment);
          const hasCoordinates = hasUsableCoordinates(place.lat, place.lng);
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
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{hasCoordinates ? "지도 가능" : "주소 검색"}</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{phone ? "전화 가능" : "전화 제보"}</span>
                  {place.businessStatus ? (
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.businessStatus}</span>
                  ) : null}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="mt-2 line-clamp-2 font-black leading-snug text-[#2d1d10] hover:text-[var(--brand)] hover:underline">
                    {displayName}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{[place.sido, place.sigungu].filter(Boolean).join(" ") || "지역 확인 필요"}</p>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{place.roadAddress ?? place.address ?? "주소 확인 필요"}</p>
                <div className="mt-2 grid gap-1.5 text-[11px] font-bold text-[#7b746d]">
                  <span>{externalCategory ?? getExternalInfoLabel(enrichment)}</span>
                  <span>{getReviewSummaryLabel()}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={12} />기준 {formatDiscoveryDate(place.updatedAt)}</span>
                </div>
              </SmartLink>
              <DiscoveryCardActions
                className="mt-3 border-t border-[var(--line)] pt-3"
                detailHref={`/places/${place.id}`}
                mapHref={placeMapHref}
                phone={phone}
                externalHref={externalHref}
                reviewHref={buildReviewHref("PLACE", place.id)}
              />
            </li>
          );
        })}
      </ul>

      <AdSlot label={`${categoryLabel} 목록 광고 영역`} className="mx-0" />

      {places.length > 50 && (
        <p className="mt-4 text-center text-sm text-[#9d8e82]">
          상위 50건 표시 · 전체 {places.length.toLocaleString("ko-KR")}건 검색은 지도 또는 검색을 이용하세요.
        </p>
      )}
    </section>
  );
}
