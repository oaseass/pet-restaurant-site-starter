import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoryCard } from "@/components/CategoryCard";
import { DataFreshnessNotice } from "@/components/DataFreshnessNotice";
import { QUICK_CATEGORIES, getPlaceCategorySlug } from "@/lib/platform-content";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const [restaurantCount, placeCount] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.place.count({ where: { isActive: true } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Places</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">장소 지도 허브</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">실제 장소형 정보는 식당과 places DB를 나눠 관리하고, 사용자 검색은 내부 저장 데이터만 사용합니다. 숙소형 데이터는 애견동반 펜션처럼 조건 차이가 큰 카테고리를 별도로 묶어 보여줍니다.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="badge">식당 {restaurantCount.toLocaleString("ko-KR")}건</span>
            <span className="badge">기타 장소 {placeCount.toLocaleString("ko-KR")}건</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_CATEGORIES.filter((item) => ["/restaurants", "/hospitals", "/hospitals/emergency", "/grooming", "/daycare", "/training", "/funeral", "/pharmacy"].includes(item.href)).map((category) => (
          <CategoryCard key={category.href} category={{ ...category, href: `/places/${getPlaceCategorySlug(category.category)}` }} />
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] border border-[var(--line)] bg-white p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Derived Place Lists</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--ink)]">숙소형 장소를 더 잘게 나눠 보기</h2>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">유치원·호텔 데이터 안에서도 숙소형 업체는 확인할 조건이 달라서 펜션, 호텔, 캠핑으로 한 번 더 나눴습니다.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/pension" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <h3 className="text-xl font-black text-[var(--ink)]">애견동반 펜션</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">객실별 동반 정책과 추가 요금 확인이 중요한 숙소형 후보</p>
          </Link>
          <Link href="/hotel" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <h3 className="text-xl font-black text-[var(--ink)]">호텔·리조트</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">부대시설, 객실 타입, 동반 범위를 따로 봐야 하는 호텔형 후보</p>
          </Link>
          <Link href="/camping" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <h3 className="text-xl font-black text-[var(--ink)]">캠핑장·글램핑</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">동반 구역과 공용공간 규칙이 중요한 야외 숙소형 후보</p>
          </Link>
          <Link href="/supplies" className="rounded-[1.6rem] border border-dashed border-[var(--line)] bg-[#fcfaf7] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <h3 className="text-xl font-black text-[var(--ink)]">반려동물 용품점</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">전용 공개 원천을 붙이기 전까지는 체크포인트 허브부터 제공합니다.</p>
          </Link>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-[#665950]">
        <Link href="/restaurants" className="ink-link">식당 전용 보기</Link>
        <Link href="/hospitals" className="ink-link">병원 전용 보기</Link>
        <Link href="/pension" className="ink-link">애견동반 펜션 보기</Link>
        <Link href="/hotel" className="ink-link">호텔·리조트 보기</Link>
        <Link href="/camping" className="ink-link">캠핑장·글램핑 보기</Link>
        <Link href="/supplies" className="ink-link">용품점 허브 보기</Link>
        <Link href="/search" className="ink-link">통합 검색</Link>
      </div>

      <div className="mt-8"><DataFreshnessNotice /></div>
    </main>
  );
}