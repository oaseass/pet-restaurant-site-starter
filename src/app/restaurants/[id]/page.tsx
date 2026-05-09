import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdSlot } from "@/components/AdSlot";
import { BusinessEnrichmentPanel } from "@/components/detail/BusinessEnrichmentPanel";
import { BusinessCheckPanel } from "@/components/detail/BusinessCheckPanel";
import { ExternalReviewLinksPanel } from "@/components/detail/ExternalReviewLinksPanel";
import { BusinessStoryPanel } from "@/components/detail/BusinessStoryPanel";
import { DetailDecisionPanel } from "@/components/detail/DetailDecisionPanel";
import { DetailActionBar } from "@/components/detail/DetailActionBar";
import { DetailMapCard } from "@/components/detail/DetailMapCard";
import { DetailOverviewPanel } from "@/components/detail/DetailOverviewPanel";
import { VisitInfoPanel } from "@/components/detail/VisitInfoPanel";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessEnrichmentForTarget } from "@/lib/business-enrichment";
import { getApprovedBusinessCheckSummary } from "@/lib/business-checks";
import { getBusinessExternalCategory, getRestaurantIdentity, getReviewSummaryLabel } from "@/lib/discovery-cards";
import { getExternalReviewLinks } from "@/lib/external-review-links";
import { getGooglePlaceVisualEnrichment, mergeGoogleVisualEnrichment } from "@/lib/google-place-visual";
import { getApprovedReviewSummary } from "@/lib/reviews";
import { absoluteUrl } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      sido: true,
      sigungu: true,
      status: true,
    },
  });

  if (!restaurant || restaurant.status !== "ACTIVE") {
    return { title: "업체를 찾을 수 없습니다." };
  }

  const region = [restaurant.sido, restaurant.sigungu].filter(Boolean).join(" ");
  return {
    title: `${restaurant.name} | 반려동물 동반 식당 | 댕냥지도`,
    description: `${region} ${restaurant.name} 반려동물 동반 식당 정보. 주소와 방문 전 확인할 점을 살펴보세요.`,
    alternates: { canonical: absoluteUrl(`/restaurants/${restaurant.id}`) },
  };
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "ACTIVE") notFound();

  const [nearby, relatedCarePlaces, reviewSummary, checkSummary, enrichment] = await Promise.all([
    prisma.restaurant.findMany({
      where: {
        status: "ACTIVE",
        id: { not: restaurant.id },
        sido: restaurant.sido,
        sigungu: restaurant.sigungu,
      },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.place.findMany({
      where: {
        isActive: true,
        sido: restaurant.sido,
        sigungu: restaurant.sigungu,
        category: { in: ["ANIMAL_HOSPITAL", "PHARMACY"] },
      },
      orderBy: { name: "asc" },
      take: 6,
    }),
    getApprovedReviewSummary("RESTAURANT", restaurant.id),
    getApprovedBusinessCheckSummary("RESTAURANT", restaurant.id),
    getBusinessEnrichmentForTarget("RESTAURANT", restaurant.id),
  ]);
  const googleVisualEnrichment = enrichment?.googlePhotoName ? null : await getGooglePlaceVisualEnrichment({
    targetType: "RESTAURANT",
    targetId: restaurant.id,
    category: "RESTAURANT",
    name: restaurant.name,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
  });
  const displayEnrichment = mergeGoogleVisualEnrichment(enrichment, googleVisualEnrichment);
  const reliableEnrichment = displayEnrichment && displayEnrichment.matchScore >= 0.85 ? displayEnrichment : null;
  const externalCategory = getBusinessExternalCategory(reliableEnrichment);
  const identity = getRestaurantIdentity({ businessType: restaurant.businessType, externalCategory });
  const bestPhone = reliableEnrichment?.phone ?? null;
  const regionLabel = `${restaurant.sido}${restaurant.sigungu ? ` ${restaurant.sigungu}` : ""}`;
  const reportHref = `/report?type=restaurant&id=${restaurant.id}&name=${encodeURIComponent(restaurant.name)}`;
  const reviewHref = `/reviews/new?targetType=RESTAURANT&targetId=${restaurant.id}`;
  const reviewLabel = getReviewSummaryLabel(reviewSummary.count, reviewSummary.averageOverall);
  const hasReview = reviewSummary.count > 0;
  const mapHref = restaurant.lat !== null && restaurant.lng !== null
    ? `/map?category=restaurants&lat=${restaurant.lat.toFixed(6)}&lng=${restaurant.lng.toFixed(6)}`
    : `/map?category=restaurants&q=${encodeURIComponent(restaurant.name)}`;
  const decisionQuestions = [
    "오늘 반려동물 동반 좌석을 운영하나요?",
    "실내·야외·이동장 조건이 따로 있나요?",
    "대형견이나 다견 방문 제한이 있나요?",
    "피크타임 또는 주말 입장 제한이 있나요?",
  ];
  const externalReviewLinks = await getExternalReviewLinks({
    name: restaurant.name,
    category: "RESTAURANT",
    categoryLabel: "반려동물 동반 식당",
    regionLabel,
    address: restaurant.address,
    enrichment: displayEnrichment && displayEnrichment.matchScore >= 0.85 ? displayEnrichment : null,
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell overflow-hidden p-0">
        <div className="relative z-10 p-6 sm:p-8">
          <p className="eyebrow">장소 소개</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge"><ShieldCheck size={14} /> 공식 등록 정보</span>
            <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">{identity.identityLabel}</span>
            <span className="badge">{regionLabel}</span>
            {hasReview ? <span className="badge">{reviewLabel}</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-[2.4rem]">{restaurant.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#4f4741]">{identity.description}</p>
          <p className="mt-4 flex gap-2 text-sm leading-7 text-[#5f5550] sm:text-base"><MapPin className="mt-1 shrink-0" size={18} /> {restaurant.address}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="장소 성격" value={identity.identityLabel} />
            <Info label="전화" value={bestPhone ?? "전화번호 미등록"} />
            {externalCategory ? <Info label="지도 분류" value={externalCategory} /> : null}
            {hasReview ? <Info label="후기" value={reviewLabel} /> : null}
          </div>
          <DetailActionBar
            name={restaurant.name}
            address={restaurant.address}
            lat={restaurant.lat}
            lng={restaurant.lng}
            phone={bestPhone}
            reportHref={reportHref}
            reviewHref={reviewHref}
            mapHref={mapHref}
            targetType="RESTAURANT"
            targetId={restaurant.id}
          />
        </div>
      </section>

      <DetailMapCard
        name={restaurant.name}
        address={restaurant.address}
        lat={restaurant.lat}
        lng={restaurant.lng}
        mapHref={mapHref}
      />

      <BusinessStoryPanel
        name={restaurant.name}
        category="RESTAURANT"
        categoryLabel="반려동물 동반 식당"
        identityLabel={identity.identityLabel}
        regionLabel={regionLabel}
        enrichment={reliableEnrichment}
        checkSummary={checkSummary}
        reportHref={reportHref}
        reviewHref={reviewHref}
      />

      <DetailOverviewPanel
        name={restaurant.name}
        category="RESTAURANT"
        categoryLabel="반려동물 동반 식당"
        identityLabel={identity.identityLabel}
        regionLabel={regionLabel}
        addressLabel={restaurant.address}
        phone={bestPhone}
        hasCoordinates={restaurant.lat !== null && restaurant.lng !== null}
        sourceLabel="식품안전나라 공개자료"
        businessStatus="공식 등록 정보"
        dataUpdatedLabel={restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")}
        reviewCount={reviewSummary.count}
        reviewAverage={reviewSummary.averageOverall}
        checkSummary={checkSummary}
        enrichment={reliableEnrichment}
      />

      <DetailDecisionPanel
        categoryLabel="반려동물 동반 식당"
        regionLabel={regionLabel}
        addressLabel={restaurant.address}
        phone={bestPhone}
        hasCoordinates={restaurant.lat !== null && restaurant.lng !== null}
        businessStatus="공식 등록 정보"
        dataUpdatedLabel={restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")}
        sourceLabel="식품안전나라 공개자료"
        reviewCount={reviewSummary.count}
        questions={decisionQuestions}
        reportHref={reportHref}
        reviewHref={reviewHref}
      />

      <BusinessCheckPanel
        targetType="RESTAURANT"
        targetId={restaurant.id}
        categoryLabel="반려동물 동반 식당"
        summary={checkSummary}
      />

      <div className="mt-8">
        <BusinessEnrichmentPanel enrichment={displayEnrichment} category="RESTAURANT" reportHref={reportHref} reviewHref={reviewHref} showPhoto={false} />
      </div>

      <div className="mt-8">
        <ExternalReviewLinksPanel name={restaurant.name} categoryLabel="반려동물 동반 식당" links={externalReviewLinks} />
      </div>

      <div className="mt-6">
        <VisitInfoPanel category="RESTAURANT" />
      </div>

      <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
        <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">정보를 더 정확하게 만들기</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          메뉴, 좌석 운영, 대형견 가능 여부, 이동장 조건처럼 다음 보호자가 꼭 알면 좋은 내용만 확인한 뒤 반영합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SmartLink href={reportHref} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            정보 수정 요청
          </SmartLink>
          <SmartLink href={`${reportHref}&topic=service`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] bg-white px-5 py-2.5 text-sm font-black text-[var(--brand)]">
            {identity.infoCtaLabel}
          </SmartLink>
          <SmartLink href={`${reportHref}&topic=pet-policy`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] bg-white px-5 py-2.5 text-sm font-black text-[var(--brand)]">
            동반 조건 알려주기
          </SmartLink>
          <SmartLink href={`${reportHref}&topic=photo`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)]">
            사진 올리기
          </SmartLink>
        </div>
      </section>

      <ReviewSection
        targetType="RESTAURANT"
        targetId={restaurant.id}
        name={restaurant.name}
        address={restaurant.address}
        lat={restaurant.lat}
        lng={restaurant.lng}
        summary={reviewSummary}
        reportHref={reportHref}
      />

      <AdSlot label="상세 페이지 광고 영역" />

      {nearby.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">주변 식당</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">같은 지역 반려동물 동반 식당</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {nearby.map((item) => (
              <article key={item.id} className="card rounded-[1rem] p-4">
                <SmartLink href={`/restaurants/${item.id}`} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
                  <p className="font-black leading-snug text-[var(--ink)]">{item.name}</p>
                  <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                    {item.sido}{item.sigungu ? ` ${item.sigungu}` : ""}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.businessType}</p>
                </SmartLink>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <SmartLink href={`/restaurants/${item.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-black text-white">
                    자세히 보기
                  </SmartLink>
                  <SmartLink
                    href={item.lat !== null && item.lng !== null ? `/map?category=restaurants&lat=${item.lat.toFixed(6)}&lng=${item.lng.toFixed(6)}` : `/map?category=restaurants&q=${encodeURIComponent(item.name)}`}
                    pendingLabel="지도 여는 중..."
                    className="inline-flex min-h-9 items-center rounded-full border border-[var(--brand)] px-3 py-1.5 text-xs font-black text-[var(--brand)]"
                  >
                    지도에서 보기
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {relatedCarePlaces.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">주변 케어</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">같은 지역 병원·약국</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {relatedCarePlaces.map((item) => (
              <article key={item.id} className="card rounded-[1rem] p-4">
                <SmartLink href={`/places/${item.id}`} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
                  <span className="badge">{item.category === "PHARMACY" ? "동물약국" : "동물병원"}</span>
                  <p className="mt-3 font-black leading-snug text-[var(--ink)]">{item.name}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-[var(--muted)]">{item.roadAddress ?? item.address ?? regionLabel}</p>
                </SmartLink>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <SmartLink href={`/places/${item.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-black text-white">
                    자세히 보기
                  </SmartLink>
                  <SmartLink
                    href={item.lat !== null && item.lng !== null ? `/map?category=${item.category === "PHARMACY" ? "pharmacy" : "hospitals"}&lat=${item.lat.toFixed(6)}&lng=${item.lng.toFixed(6)}` : `/map?category=${item.category === "PHARMACY" ? "pharmacy" : "hospitals"}&q=${encodeURIComponent(item.name)}`}
                    pendingLabel="지도 여는 중..."
                    className="inline-flex min-h-9 items-center rounded-full border border-[var(--brand)] px-3 py-1.5 text-xs font-black text-[var(--brand)]"
                  >
                    지도에서 보기
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[1rem] border border-[var(--line)] bg-[#fafdf9] p-5 text-sm leading-7 text-[var(--muted)]">
        이 정보는 공개자료를 보기 쉽게 정리한 안내입니다. 실제 영업 여부, 반려동물 동반 조건, 좌석 운영 방식은 업체 사정에 따라 달라질 수 있으니 방문 전 직접 물어보는 것이 좋습니다.
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--line)] bg-white/78 p-4">
      <p className="text-xs font-black text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
