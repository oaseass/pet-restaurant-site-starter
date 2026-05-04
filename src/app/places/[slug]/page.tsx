import { notFound } from "next/navigation";
import { MapPin, Phone, AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { getPlaceDetailById } from "@/lib/place-detail";
import { getPlacesByCategorySnapshot } from "@/lib/public-data";
import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";
import { PlaceDirectionsSheet } from "@/components/PlaceDirectionsSheet";
import { SmartLink } from "@/components/SmartLink";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { absoluteUrl } from "@/lib/brand";
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
  return {
    title: `${place.name} | ${categoryLabel} | 댕냥지도`,
    description: `${region} ${categoryLabel} ${place.name} 상세 정보. 주소, 전화번호, 영업상태를 확인하세요.`,
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
  const mapCategoryKey = PLACE_CATEGORY_MAP_KEY[place.category] ?? "all";
  const sourceLabel = SOURCE_LABELS[place.sourceName ?? ""] ?? "공공 데이터";

  // 공개 표시 주소 — 마스킹된 경우 시도+시군구만
  const displayAddress = place.addressMasked
    ? [place.sido, place.sigungu].filter(Boolean).join(" ") || "주소 일부 비공개"
    : (place.roadAddress ?? place.address ?? "주소 정보 없음");
  const navigationAddress = displayAddress === "주소 정보 없음" ? null : displayAddress;
  const reportHref = `/report?type=place&id=${place.id}&name=${encodeURIComponent(place.name)}`;

  // 같은 지역 · 카테고리 추천 (상위 5개)
  const type = place.category as "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";
  const [allSameCategory, reviewSummary] = await Promise.all([
    getPlacesByCategorySnapshot(type),
    getApprovedReviewSummary("PLACE", place.id),
  ]);
  const nearby = allSameCategory
    .filter((p) => p.id !== place.id && p.sido === place.sido && p.sigungu === place.sigungu)
    .slice(0, 5);

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
        <span className="text-[var(--ink)]">{place.name}</span>
      </nav>

      {/* 메인 카드 */}
      <section className="section-shell p-6 sm:p-8">
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
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

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{place.name}</h1>

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

          {/* 전화번호 */}
          {place.phone && (
            <p className="mt-3 flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-[var(--brand)]" />
              <a
                href={`tel:${place.phone.replace(/\s+/g, "")}`}
                className="font-black text-[var(--brand)] hover:underline"
              >
                {place.phone}
              </a>
            </p>
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
            {place.eupmyeondong && <InfoRow label="읍면동" value={place.eupmyeondong} />}
            <InfoRow
              label="데이터 기준일"
              value={new Date(place.updatedAt).toLocaleDateString("ko-KR")}
            />
            <InfoRow label="출처" value={sourceLabel} />
          </div>

          {/* CTA 버튼 */}
          <div className="mt-6 flex flex-wrap gap-3">
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\s+/g, "")}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white"
              >
                <Phone size={15} />
                전화하기
              </a>
            )}
            {place.lat !== null && place.lng !== null && (
              <SmartLink
                href={`/map?category=${mapCategoryKey}&lat=${place.lat.toFixed(6)}&lng=${place.lng.toFixed(6)}`}
                pendingLabel="지도 여는 중..."
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-black text-[var(--brand)]"
              >
                <MapPin size={15} />
                지도에서 보기
              </SmartLink>
            )}
            <PlaceDirectionsSheet name={place.name} lat={place.lat} lng={place.lng} address={navigationAddress} />
            <SmartLink
              href={reportHref}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--muted)]"
            >
              정보수정 제보
            </SmartLink>
          </div>
        </div>
      </section>

      <ReviewSection
        targetType="PLACE"
        targetId={place.id}
        name={place.name}
        address={navigationAddress}
        lat={place.lat}
        lng={place.lng}
        summary={reviewSummary}
        reportHref={reportHref}
      />

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
                <p className="font-black text-[var(--ink)] leading-snug">{item.name}</p>
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
