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
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">실제 장소형 정보는 식당과 places DB를 나눠 관리하고, 사용자 검색은 내부 저장 데이터만 사용합니다.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="badge">식당 {restaurantCount.toLocaleString("ko-KR")}건</span>
            <span className="badge">기타 장소 {placeCount.toLocaleString("ko-KR")}건</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_CATEGORIES.filter((item) => ["/restaurants", "/hospitals", "/hospitals/emergency", "/grooming", "/daycare", "/training", "/funeral"].includes(item.href)).map((category) => (
          <CategoryCard key={category.href} category={{ ...category, href: `/places/${getPlaceCategorySlug(category.category)}` }} />
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-[#665950]">
        <Link href="/restaurants" className="ink-link">식당 전용 보기</Link>
        <Link href="/hospitals" className="ink-link">병원 전용 보기</Link>
        <Link href="/search" className="ink-link">통합 검색</Link>
      </div>

      <div className="mt-8"><DataFreshnessNotice /></div>
    </main>
  );
}