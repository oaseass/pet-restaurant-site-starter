import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";
import { RestaurantCard } from "@/components/RestaurantCard";
import { AdSlot } from "@/components/AdSlot";
import { SourceNotice } from "@/components/SourceNotice";
import { buildRestaurantSearchWhere, normalizeRestaurantSearchParams } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sido?: string; type?: string }> }) {
  const params = normalizeRestaurantSearchParams(await searchParams);
  const { q, sido, type } = params;

  const restaurants = await prisma.restaurant.findMany({
    where: buildRestaurantSearchWhere(params),
    orderBy: [{ sido: "asc" }, { sigungu: "asc" }, { name: "asc" }],
    take: 100,
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="card rounded-[2.5rem] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700/80">Search</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">식당 검색</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">업소명, 주소, 시도, 시군구까지 한 번에 검색합니다. 사용자 검색은 우리 DB만 조회하며 원본 사이트를 다시 호출하지 않습니다.</p>
        <div className="mt-6"><SearchBox defaultValue={q} /></div>
        <p className="mt-5 text-sm font-bold text-gray-500">검색 결과 {restaurants.length.toLocaleString("ko-KR")}곳 · 최대 100개 표시</p>
      </section>

      <AdSlot label="검색 결과 상단 광고 영역" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
      </div>
      {restaurants.length === 0 ? (
        <div className="card mt-6 rounded-3xl p-8 text-center text-gray-600">검색 결과가 없습니다. 지역명을 넓혀서 검색해보세요.</div>
      ) : null}
      <SourceNotice className="mt-8" />
    </main>
  );
}
