import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SourceNotice } from "@/components/SourceNotice";
import { AdSlot } from "@/components/AdSlot";

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
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="card rounded-[2.2rem] p-7">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="badge"><ShieldCheck size={14} /> 공식 등록 데이터</span>
          <span className="badge">{restaurant.businessType}</span>
          <span className="badge">{restaurant.sido}{restaurant.sigungu ? ` · ${restaurant.sigungu}` : ""}</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">{restaurant.name}</h1>
        <p className="mt-4 flex gap-2 text-gray-700"><MapPin className="mt-1 shrink-0" size={18} /> {restaurant.address}</p>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="업종" value={restaurant.businessType} />
          <Info label="지역" value={`${restaurant.sido}${restaurant.sigungu ? ` ${restaurant.sigungu}` : ""}`} />
          <Info label="데이터 기준일" value={restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")} />
          <Info label="출처" value="식품안전나라 공개 정보" />
        </div>
      </div>

      <AdSlot label="상세 페이지 광고 영역" />

      <section className="card rounded-3xl p-6">
        <h2 className="text-xl font-black">방문 전 확인 체크리스트</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-700">
          <li>· 현재 영업 중인지 확인</li>
          <li>· 실내·실외 중 어느 좌석에 반려동물 동반이 가능한지 확인</li>
          <li>· 목줄, 케이지, 대형견, 짖음 관련 운영 기준 확인</li>
          <li>· 업소별 추가 조건이 있는지 확인</li>
        </ul>
      </section>

      <SourceNotice className="mt-5" />

      {nearby.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-black">주변 같은 지역 업소</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nearby.map((item) => (
              <Link key={item.id} href={`/restaurants/${item.id}`} className="card rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-soft">
                <p className="font-black">{item.name}</p>
                <p className="mt-2 text-sm text-gray-600">{item.address}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-4">
      <p className="text-xs font-black text-gray-400">{label}</p>
      <p className="mt-1 font-bold text-gray-800">{value}</p>
    </div>
  );
}
