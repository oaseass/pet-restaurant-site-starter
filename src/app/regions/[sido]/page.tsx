import { prisma } from "@/lib/prisma";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SearchBox } from "@/components/SearchBox";
import { AdSlot } from "@/components/AdSlot";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { CharacterImage } from "@/components/CharacterImage";

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
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-2 top-6 hidden h-24 w-36 opacity-95 sm:block">
          <CharacterImage asset="puppy-side-white" className="h-full w-full mascot-float" imageClassName="object-contain" />
        </div>
        <div className="relative z-10">
          <p className="eyebrow">지역별 식당</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{sido} 반려동물 동반 식당</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#655a53] sm:text-base">식품안전나라 공개자료를 기준으로 {restaurants.length.toLocaleString("ko-KR")}곳을 정리했어요. 좌석 구역과 동반 조건은 업소별로 다를 수 있습니다.</p>
        </div>
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

      <section className="card mt-10 rounded-[2rem] p-6 leading-7 text-[#5e544d]">
        <h2 className="mb-3 text-xl font-black">{sido} 식당에 가기 전 물어볼 것</h2>
        <p>업소마다 동반 가능 좌석, 목줄·이동장 조건, 대형견 가능 여부, 혼잡 시간 운영 기준이 다를 수 있습니다. 공식 등록 업소라도 방문 전 전화로 물어보는 편이 좋습니다.</p>
      </section>
      <OfficialDataNotice className="mt-5" />
    </main>
  );
}
