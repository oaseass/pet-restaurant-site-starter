import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PlaceDirectionsSheet } from "@/components/PlaceDirectionsSheet";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { AdSlot } from "@/components/AdSlot";
import { CharacterImage } from "@/components/CharacterImage";
import { SmartLink } from "@/components/SmartLink";

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "ACTIVE") notFound();

  const nearby = await prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
      id: { not: restaurant.id },
      sido: restaurant.sido,
      sigungu: restaurant.sigungu,
    },
    orderBy: { name: "asc" },
    take: 6,
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell p-6 sm:p-8">
        <div className="absolute right-3 top-4 hidden h-24 w-24 opacity-95 sm:block">
          <CharacterImage asset="puppy-front-white" className="h-full w-full mascot-drift" imageClassName="object-contain scale-[1.04]" />
        </div>
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="badge"><ShieldCheck size={14} /> 공식 등록 데이터</span>
            <span className="badge">{restaurant.businessType}</span>
            <span className="badge">{restaurant.sido}{restaurant.sigungu ? ` · ${restaurant.sigungu}` : ""}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-[2.7rem]">{restaurant.name}</h1>
          <p className="mt-4 flex gap-2 text-[#5f5550]"><MapPin className="mt-1 shrink-0" size={18} /> {restaurant.address}</p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="업종" value={restaurant.businessType} />
            <Info label="지역" value={`${restaurant.sido}${restaurant.sigungu ? ` ${restaurant.sigungu}` : ""}`} />
            <Info label="데이터 기준일" value={restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")} />
            <Info label="출처" value="식품안전나라 공개 정보" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {restaurant.lat !== null && restaurant.lng !== null ? (
              <SmartLink
                href={`/map?category=restaurants&lat=${restaurant.lat.toFixed(6)}&lng=${restaurant.lng.toFixed(6)}`}
                pendingLabel="지도 여는 중..."
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-black text-[var(--brand)]"
              >
                <MapPin size={15} />
                지도에서 보기
              </SmartLink>
            ) : null}
            <PlaceDirectionsSheet name={restaurant.name} lat={restaurant.lat} lng={restaurant.lng} address={restaurant.address} />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black">방문 전 확인 체크리스트</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-[#5f5550]">
            <li>· 현재 영업 중인지 확인</li>
            <li>· 실내·실외 중 어느 좌석에 반려동물 동반이 가능한지 확인</li>
            <li>· 목줄, 케이지, 대형견, 짖음 관련 운영 기준 확인</li>
            <li>· 업소별 추가 조건이 있는지 확인</li>
          </ul>
        </section>
        <OfficialDataNotice className="h-full" />
      </div>

      <AdSlot label="상세 페이지 광고 영역" />

      {nearby.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Nearby</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">주변 같은 지역 업소</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nearby.map((item) => (
              <SmartLink key={item.id} href={`/restaurants/${item.id}`} className="card rounded-[1.8rem] p-5 transition hover:-translate-y-1 hover:shadow-soft">
                <p className="font-black">{item.name}</p>
                <p className="mt-2 text-sm text-[#655a53]">{item.address}</p>
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-xs font-black text-[#9b8d81]">{label}</p>
      <p className="mt-1 font-bold text-[#3f352f]">{value}</p>
    </div>
  );
}
