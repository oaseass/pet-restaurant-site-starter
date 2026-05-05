import { notFound } from "next/navigation";
import { AlertCircle, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AdSlot } from "@/components/AdSlot";
import { getPlaceDetailById } from "@/lib/place-detail";
import { getPlacesByCategorySnapshot } from "@/lib/public-data";
import { BusinessEnrichmentPanel } from "@/components/detail/BusinessEnrichmentPanel";
import { DetailDecisionPanel } from "@/components/detail/DetailDecisionPanel";
import { DetailActionBar } from "@/components/detail/DetailActionBar";
import { VisitInfoPanel } from "@/components/detail/VisitInfoPanel";
import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";
import { SmartLink } from "@/components/SmartLink";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { absoluteUrl } from "@/lib/brand";
import { getBusinessEnrichmentForTarget } from "@/lib/business-enrichment";
import { getApprovedReviewSummary } from "@/lib/reviews";
import { getPlaceCategoryBySlug, getPlaceCategoryLabel } from "@/lib/platform-content";

export const dynamic = "force-dynamic";

// UUID v4 형식 감지
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PLACE_CATEGORY_LABELS: Record<string, string> = {
  ANIMAL_HOSPITAL: "동물병원",
  PHARMACY: "동물약국",
  GROOMING: "미용",
  DAYCARE: "유치원·호텔",
  FUNERAL: "장례",
};

const PLACE_CATEGORY_MAP_KEY: Record<string, string> = {
  ANIMAL_HOSPITAL: "hospitals",
  PHARMACY: "pharmacy",
  GROOMING: "grooming",
  DAYCARE: "daycare",
  FUNERAL: "funeral",
};

const SOURCE_LABELS: Record<string, string> = {
  LOCALDATA_ANIMAL_HOSPITAL: "지자체 공개 데이터 (동물병원)",
  LOCALDATA_GROOMING: "지자체 공개 데이터 (미용)",
  LOCALDATA_DAYCARE: "지자체 공개 데이터 (위탁관리)",
  LOCALDATA_FUNERAL: "지자체 공개 데이터 (장례)",
  LOCALDATA_PHARMACY: "지자체 공개 데이터 (동물약국)",
  MANUAL_DATA: "직접 등록 데이터",
  OFFICIAL_DATA: "공공 데이터",
};

const DECISION_QUESTIONS: Record<string, string[]> = {
  ANIMAL_HOSPITAL: ["오늘 진료 가능한 동물과 증상 범위가 어떻게 되나요?", "예약이 필요한가요?", "야간·응급 대응이 가능한가요?", "주차나 대기 방식이 어떻게 되나요?"],
  PHARMACY: ["필요한 동물의약품 재고가 있나요?", "처방전이 필요한 품목인가요?", "강아지·고양이 용량 구분 안내가 가능한가요?", "오늘 영업시간이 어떻게 되나요?"],
  GROOMING: ["예약 가능한 가장 빠른 시간이 언제인가요?", "견종·묘종·체중 제한이 있나요?", "발톱·귀·항문낭 관리가 포함되나요?", "노령견이나 피부 질환이 있어도 가능한가요?"],
  DAYCARE: ["입소 전 예방접종 증명이 필요한가요?", "사회성 테스트나 적응 시간이 있나요?", "호텔·장기 위탁이 가능한가요?", "픽업이나 CCTV 확인을 제공하나요?"],
  FUNERAL: ["상담과 운구가 가능한 시간이 언제인가요?", "화장·봉안·유골함 절차가 어떻게 되나요?", "총 비용에 포함되는 항목은 무엇인가요?", "장례 후 서류 제공이 가능한가요?"],
};

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function isLowConfidencePlaceName(name: string) {
  const trimmed = normalizeDisplayName(name);
  if (!trimmed) return true;
  if (/^#?[a-z_-]+$/i.test(trimmed) && !/[가-힣]/.test(trimmed)) return true;
  return false;
}

function getDisplayPlaceName(place: { name: string; sido?: string | null; sigungu?: string | null }, categoryLabel: string) {
  const cleanedName = normalizeDisplayName(place.name);
  if (!isLowConfidencePlaceName(place.name)) return cleanedName;
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${categoryLabel}` : `${categoryLabel} 업체`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!UUID_RE.test(slug)) {
    // 카테고리 목록 페이지
    const parsed = getPlaceCategoryBySlug(slug);
    if (!parsed) return { title: "카테고리를 찾을 수 없습니다." };
    const title = `${getPlaceCategoryLabel(parsed)} | 댕냥지도`;
    return {
      title,
      description: `${getPlaceCategoryLabel(parsed)} 정보를 댕냥지도 내부 DB 기준으로 확인하세요.`,
      alternates: { canonical: absoluteUrl(`/places/${slug}`) },
    };
  }

  // 장소 상세 페이지
  const place = await getPlaceDetailById(slug);
  if (!place) return { title: "업체를 찾을 수 없습니다." };

  const categoryLabel = PLACE_CATEGORY_LABELS[place.category] ?? place.category;
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  const displayName = getDisplayPlaceName(place, categoryLabel);
  return {
    title: `${displayName} | ${categoryLabel} | 댕냥지도`,
    description: `${region} ${categoryLabel} ${displayName} 상세 정보. 주소, 전화번호, 영업상태를 확인하세요.`,
  };
}

export default async function PlaceSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 카테고리 슬러그 → 목록 페이지
  if (!UUID_RE.test(slug)) {
    return <PlaceDirectoryPage categorySlug={slug} />;
  }

  // UUID → 상세 페이지
  const place = await getPlaceDetailById(slug);
  if (!place) notFound();

  const categoryLabel = PLACE_CATEGORY_LABELS[place.category] ?? place.category;
  const displayName = getDisplayPlaceName(place, categoryLabel);
  const mapCategoryKey = PLACE_CATEGORY_MAP_KEY[place.category] ?? "all";
  const sourceLabel = SOURCE_LABELS[place.sourceName ?? ""] ?? "공공 데이터";

  // 공개 표시 주소 — 마스킹된 경우 시도+시군구만
  const displayAddress = place.addressMasked
    ? [place.sido, place.sigungu].filter(Boolean).join(" ") || "주소 일부 비공개"
    : (place.roadAddress ?? place.address ?? "주소 정보 없음");
  const navigationAddress = displayAddress === "주소 정보 없음" ? null : displayAddress;
  const reportHref = `/report?type=place&id=${place.id}&name=${encodeURIComponent(displayName)}`;
  const reviewHref = `/reviews/new?targetType=PLACE&targetId=${place.id}`;
  const mapHref = place.lat !== null && place.lng !== null
    ? `/map?category=${mapCategoryKey}&lat=${place.lat.toFixed(6)}&lng=${place.lng.toFixed(6)}`
    : `/map?category=${mapCategoryKey}&q=${encodeURIComponent(displayName)}`;

  // 같은 지역 · 카테고리 추천 (상위 5개)
  const type = place.category as "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";
  const supportCategoryTypes: Array<"ANIMAL_HOSPITAL" | "PHARMACY"> = type === "ANIMAL_HOSPITAL" ? ["PHARMACY"] : type === "PHARMACY" ? ["ANIMAL_HOSPITAL"] : ["ANIMAL_HOSPITAL", "PHARMACY"];
  const [allSameCategory, supportCategoryGroups, reviewSummary, enrichment] = await Promise.all([
    getPlacesByCategorySnapshot(type),
    Promise.all(supportCategoryTypes.map((category) => getPlacesByCategorySnapshot(category))),
    getApprovedReviewSummary("PLACE", place.id),
    getBusinessEnrichmentForTarget("PLACE", place.id),
  ]);
  const reliableEnrichment = enrichment && enrichment.matchScore >= 0.85 ? enrichment : null;
  const bestPhone = place.phone ?? reliableEnrichment?.phone ?? null;
  const decisionQuestions = DECISION_QUESTIONS[type] ?? ["오늘 운영 여부를 확인할 수 있나요?", "예약이나 방문 제한이 있나요?", "비용과 준비물이 어떻게 되나요?", "주차나 대기 방식이 어떻게 되나요?"];
  const nearby = allSameCategory
    .filter((p) => p.id !== place.id && p.sido === place.sido && p.sigungu === place.sigungu)
    .slice(0, 5);
  const supportPlaces = supportCategoryGroups
    .flat()
    .filter((p) => p.id !== place.id && p.sido === place.sido && p.sigungu === place.sigungu)
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      {/* 빵 부스러기 */}
      <nav className="mb-5 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
        <SmartLink href="/" className="hover:text-[var(--ink)]">홈</SmartLink>
        <span>›</span>
        <SmartLink
          href={`/map?category=${mapCategoryKey}`}
          pendingLabel="지도 여는 중..."
          className="hover:text-[var(--ink)]"
        >
          {categoryLabel} 지도
        </SmartLink>
        <span>›</span>
        <span className="text-[var(--ink)]">{displayName}</span>
      </nav>

      {/* 메인 카드 */}
      <section className="section-shell p-6 sm:p-8">
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="badge"><ShieldCheck size={14} /> 공식 등록 데이터</span>
            <span className="badge">{categoryLabel}</span>
            {place.businessStatus && (
              <span
                className={`badge ${
                  place.businessStatus === "영업" || place.businessStatus === "정상"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-[#fef3e8] text-[#b45309] border-[#fed7aa]"
                }`}
              >
                {place.businessStatus}
              </span>
            )}
            {place.sido && (
              <span className="badge">{[place.sido, place.sigungu].filter(Boolean).join(" · ")}</span>
            )}
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{displayName}</h1>

          {/* 주소 */}
          <p className="mt-4 flex items-start gap-2 text-[#5f5550]">
            <MapPin className="mt-1 shrink-0" size={18} />
            <span>
              {displayAddress}
              {place.addressMasked && (
                <span className="ml-2 text-xs text-[var(--muted)]">(주소 일부 비공개)</span>
              )}
            </span>
          </p>

          {/* 도로명 주소가 있고 마스킹 아닐 때 추가 표시 */}
          {!place.addressMasked && place.roadAddress && place.address && place.roadAddress !== place.address && (
            <p className="mt-1 ml-7 text-sm text-[var(--muted)]">지번: {place.address}</p>
          )}

          {/* 마스킹 안내 */}
          {place.addressMasked && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fef9ef] p-3 text-sm text-[#92400e]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>공공데이터상 주소 일부가 비공개 처리된 업체입니다. 시군구 단위 정보만 표시됩니다.</span>
            </div>
          )}

          {/* 상세 정보 그리드 */}
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="분류" value={categoryLabel} />
            <InfoRow label="전화번호" value={bestPhone ?? "전화번호 정보 없음"} />
            {place.eupmyeondong && <InfoRow label="읍면동" value={place.eupmyeondong} />}
            <InfoRow
              label="데이터 기준일"
              value={new Date(place.updatedAt).toLocaleDateString("ko-KR")}
            />
            {reliableEnrichment?.externalCategory ? <InfoRow label="외부 분류" value={reliableEnrichment.externalCategory} /> : null}
            <InfoRow label="출처" value={sourceLabel} />
          </div>

          <DetailActionBar
            name={displayName}
            address={navigationAddress}
            lat={place.lat}
            lng={place.lng}
            phone={bestPhone}
            reportHref={reportHref}
            reviewHref={reviewHref}
            mapHref={mapHref}
          />
        </div>
      </section>

      <DetailDecisionPanel
        categoryLabel={categoryLabel}
        regionLabel={[place.sido, place.sigungu].filter(Boolean).join(" ") || "지역 미상"}
        addressLabel={displayAddress}
        phone={bestPhone}
        hasCoordinates={place.lat !== null && place.lng !== null}
        businessStatus={place.businessStatus ?? null}
        dataUpdatedLabel={new Date(place.updatedAt).toLocaleDateString("ko-KR")}
        sourceLabel={sourceLabel}
        reviewCount={reviewSummary.count}
        questions={decisionQuestions}
        reportHref={reportHref}
        reviewHref={reviewHref}
      />

      {reliableEnrichment ? (
        <div className="mt-8">
          <BusinessEnrichmentPanel enrichment={enrichment} category={type} reportHref={reportHref} reviewHref={reviewHref} />
        </div>
      ) : null}

      <div className="mt-6">
        <VisitInfoPanel category={type} />
      </div>

      <ReviewSection
        targetType="PLACE"
        targetId={place.id}
        name={displayName}
        address={navigationAddress}
        lat={place.lat}
        lng={place.lng}
        summary={reviewSummary}
        reportHref={reportHref}
      />

      <AdSlot label={`${displayName} 상세 광고 영역`} />

      {/* 같은 지역 추천 */}
      {nearby.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">주변 장소</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">
              {[place.sido, place.sigungu].filter(Boolean).join(" ")} 근처 {categoryLabel}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((item) => (
              <SmartLink
                key={item.id}
                href={`/places/${item.id}`}
                className="rounded-xl border border-[var(--line)] bg-white p-4 transition hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]"
              >
                <p className="font-black text-[var(--ink)] leading-snug">{getDisplayPlaceName(item, categoryLabel)}</p>
                {(item.roadAddress ?? item.address) && (
                  <p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">
                    {item.roadAddress ?? item.address}
                  </p>
                )}
                {item.businessStatus && (
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${
                      item.businessStatus === "영업" || item.businessStatus === "정상"
                        ? "bg-green-100 text-green-700"
                        : "bg-[#fef3e8] text-[#b45309]"
                    }`}
                  >
                    {item.businessStatus}
                  </span>
                )}
              </SmartLink>
            ))}
          </div>
        </section>
      )}

      {supportPlaces.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">관련 장소</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">
              {[place.sido, place.sigungu].filter(Boolean).join(" ")} 근처 병원·약국
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supportPlaces.map((item) => {
              const relatedCategoryLabel = PLACE_CATEGORY_LABELS[item.category] ?? item.category;

              return (
                <SmartLink
                  key={item.id}
                  href={`/places/${item.id}`}
                  className="rounded-xl border border-[var(--line)] bg-white p-4 transition hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]"
                >
                  <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-black text-[#2563eb]">{relatedCategoryLabel}</span>
                  <p className="mt-3 font-black leading-snug text-[var(--ink)]">{getDisplayPlaceName(item, relatedCategoryLabel)}</p>
                  {(item.roadAddress ?? item.address) && (
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                      {item.roadAddress ?? item.address}
                    </p>
                  )}
                  <span className="mt-3 inline-flex text-[11px] font-black text-[var(--brand)]">상세보기 →</span>
                </SmartLink>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-3">
      <p className="text-[11px] font-black text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
