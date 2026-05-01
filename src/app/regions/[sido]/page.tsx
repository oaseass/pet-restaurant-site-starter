import { prisma } from "@/lib/prisma";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SearchBox } from "@/components/SearchBox";
import { AdSlot } from "@/components/AdSlot";
import { SourceNotice } from "@/components/SourceNotice";

export default async function RegionPage({ params }: { params: Promise<{ sido: string }> }) {
  const { sido: rawSido } = await params;
  const sido = decodeURIComponent(rawSido);

  const restaurants = await prisma.restaurant.findMany({
    where: { status: "ACTIVE", sido },
    orderBy: [{ sigungu: "asc" }, { name: "asc" }],
    take: 120,
  });
  const countByType = await prisma.restaurant.groupBy({
    by: ["businessType"],
    where: { status: "ACTIVE", sido },
    _count: { businessType: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="card rounded-[2.5rem] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700/80">Region</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{sido} 반려동물 동반 가능 식당</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">공식 공개 데이터 기준 {restaurants.length.toLocaleString("ko-KR")}곳을 표시합니다. 좌석 구역, 대형견 가능 여부, 실내 입장 조건은 업소별로 다를 수 있습니다.</p>
        <div className="mt-6"><SearchBox defaultValue={sido} /></div>

        <div className="mt-6 flex flex-wrap gap-2">
          {countByType.map((row) => (
            <span key={row.businessType} className="badge">{row.businessType} {row._count.businessType}</span>
          ))}
        </div>
      </section>

      <AdSlot label="지역 페이지 광고 영역" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
      </div>

      <section className="card mt-10 rounded-[2rem] p-6 leading-7 text-gray-700">
        <h2 className="mb-3 text-xl font-black">{sido} 반려동물 동반 식당 이용 전 확인사항</h2>
        <p>업소마다 동반 가능 좌석, 목줄·케이지 조건, 대형견 가능 여부, 혼잡 시간 운영 기준이 다를 수 있습니다. 공식 등록 업소라도 방문 전 전화 확인을 권장합니다.</p>
      </section>
      <SourceNotice className="mt-5" />
    </main>
  );
}
