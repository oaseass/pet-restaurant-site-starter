import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdSlot } from "@/components/AdSlot";
import { DetailActionBar } from "@/components/detail/DetailActionBar";
import { PetPolicyPanel } from "@/components/detail/PetPolicyPanel";
import { VisitChecklist } from "@/components/detail/VisitChecklist";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { SmartLink } from "@/components/SmartLink";
import { getApprovedReviewSummary } from "@/lib/reviews";

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "ACTIVE") notFound();

  const [nearby, reviewSummary] = await Promise.all([
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
    getApprovedReviewSummary("RESTAURANT", restaurant.id),
  ]);
  const regionLabel = `${restaurant.sido}${restaurant.sigungu ? ` ${restaurant.sigungu}` : ""}`;
  const reportHref = `/report?type=restaurant&id=${restaurant.id}&name=${encodeURIComponent(restaurant.name)}`;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell p-6 sm:p-8">
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="badge"><ShieldCheck size={14} /> 공식 등록 데이터</span>
            <span className="badge">{restaurant.businessType}</span>
            <span className="badge">{regionLabel}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-[2.4rem]">{restaurant.name}</h1>
          <p className="mt-4 flex gap-2 text-sm leading-7 text-[#5f5550] sm:text-base"><MapPin className="mt-1 shrink-0" size={18} /> {restaurant.address}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="업종" value={restaurant.businessType} />
            <Info label="지역" value={regionLabel} />
            <Info label="기준일" value={restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")} />
            <Info label="출처" value="식품안전나라 공개 정보" />
          </div>
          <DetailActionBar
            name={restaurant.name}
            address={restaurant.address}
            lat={restaurant.lat}
            lng={restaurant.lng}
            phone={null}
            reportHref={reportHref}
          />
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <PetPolicyPanel />
        <VisitChecklist />
      </div>

      <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
        <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">정보가 다르거나 반려동물 동반 조건을 알고 계신가요?</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          영업 여부, 좌석 운영, 대형견 가능 여부, 케이지 조건처럼 방문자가 알아야 할 내용을 제보해 주시면 내부 확인 후 반영합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SmartLink href={reportHref} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            정보 수정 제보
          </SmartLink>
          <SmartLink href={`${reportHref}&topic=pet-policy`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] bg-white px-5 py-2.5 text-sm font-black text-[var(--brand)]">
            동반 조건 제보
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
              <p className="eyebrow">Nearby</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">같은 지역 반려동물 동반 식당</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {nearby.map((item) => (
              <article key={item.id} className="card rounded-[1rem] p-4">
                <p className="font-black leading-snug text-[var(--ink)]">{item.name}</p>
                <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                  {item.sido}{item.sigungu ? ` ${item.sigungu}` : ""}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.businessType}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <SmartLink href={`/restaurants/${item.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-black text-white">
                    상세보기
                  </SmartLink>
                  <SmartLink
                    href={item.lat !== null && item.lng !== null ? `/map?category=restaurants&lat=${item.lat.toFixed(6)}&lng=${item.lng.toFixed(6)}` : `/map?category=restaurants&q=${encodeURIComponent(item.name)}`}
                    pendingLabel="지도 여는 중..."
                    className="inline-flex min-h-9 items-center rounded-full border border-[var(--brand)] px-3 py-1.5 text-xs font-black text-[var(--brand)]"
                  >
                    지도보기
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[1rem] border border-[var(--line)] bg-[#fafdf9] p-5 text-sm leading-7 text-[var(--muted)]">
        이 정보는 공공데이터를 보기 쉽게 정리한 안내입니다. 실제 영업 여부, 반려동물 동반 조건, 좌석 운영 방식은 업체 사정에 따라 달라질 수 있으므로 방문 전 직접 확인해 주세요.
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
