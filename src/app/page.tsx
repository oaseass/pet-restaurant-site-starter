import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";
import { RestaurantCard } from "@/components/RestaurantCard";
import { SourceNotice } from "@/components/SourceNotice";
import { AdSlot } from "@/components/AdSlot";

const REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export default async function HomePage() {
  const count = await prisma.restaurant.count({ where: { status: "ACTIVE" } });
  const recent = await prisma.restaurant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
  const lastSync = await prisma.syncLog.findFirst({
    where: { status: "SUCCESS" },
    orderBy: { finishedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-5">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-12">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm font-extrabold text-gray-600">
            공식 공개 데이터 기반 · 1일 1회 업데이트
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            반려동물 동반 가능 식당을<br className="hidden sm:block" /> 더 쉽게 찾으세요.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            식품안전나라 공개 정보를 지역별 검색, 업소명 검색, 상세 페이지로 정리한 조회 서비스입니다.
          </p>
          <div className="mt-8"><SearchBox /></div>
          <p className="mt-4 text-sm font-bold text-gray-500">
            현재 DB 등록 {count.toLocaleString("ko-KR")}곳
            {lastSync?.finishedAt ? ` · 마지막 업데이트 ${lastSync.finishedAt.toLocaleString("ko-KR")}` : ""}
          </p>
        </div>
        <div className="card rounded-[2.5rem] p-4 sm:p-6">
          <div className="rounded-[2rem] bg-gray-950 p-6 text-white">
            <p className="text-sm font-bold text-lime-200">오늘의 체크</p>
            <h2 className="mt-3 text-3xl font-black">방문 전 3가지만 확인</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-gray-200">
              <li>1. 실제 영업 여부와 좌석 운영 방식</li>
              <li>2. 목줄·케이지·대형견 가능 여부</li>
              <li>3. 업소별 반려동물 동반 조건</li>
            </ul>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">등록 업소</p>
              <p className="mt-2 text-2xl font-black text-gray-900">{count.toLocaleString("ko-KR")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">SEO 지역</p>
              <p className="mt-2 text-2xl font-black text-gray-900">{REGIONS.length}개</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <h2 className="mb-4 text-2xl font-black">지역별 바로가기</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <Link key={region} href={`/regions/${encodeURIComponent(region)}`} className="badge px-4 py-2 text-sm">
              {region}
            </Link>
          ))}
        </div>
      </section>

      <AdSlot label="메인 중단 광고 영역" />

      <section className="py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black">최근 업데이트 업소</h2>
          <Link href="/search" className="text-sm font-black text-gray-600">전체 보기</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
        </div>
      </section>

      <SourceNotice className="mt-8" />
    </main>
  );
}
