import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchBox } from "@/components/SearchBox";
import { CategoryCard } from "@/components/CategoryCard";
import { CharacterImage } from "@/components/CharacterImage";
import { DataFreshnessNotice } from "@/components/DataFreshnessNotice";
import { GuideCard } from "@/components/GuideCard";
import { LostPetCard } from "@/components/LostPetCard";
import { PriceNote } from "@/components/PriceNote";
import { RestaurantCard } from "@/components/RestaurantCard";
import { AdSlot } from "@/components/AdSlot";
import { BRAND_NAME, BRAND_SUBTITLE, BRAND_TAGLINE } from "@/lib/brand";
import { AROUND_ME_ITEMS, QUICK_CATEGORIES, TODAY_GUIDES } from "@/lib/platform-content";

export default async function HomePage() {
  const [restaurantCount, placeCount, lostPetCount, recentRestaurants, recentLostPets, lastSync] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.lostPet.count({ where: { status: { in: ["APPROVED", "FOUND"] } } }),
    prisma.restaurant.findMany({ where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: 6 }),
    prisma.lostPet.findMany({ where: { status: { in: ["APPROVED", "FOUND"] } }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.syncLog.findFirst({ where: { status: "SUCCESS" }, orderBy: { finishedAt: "desc" } }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-10">
      <section className="grid gap-6 py-8 lg:grid-cols-[1.16fr_0.84fr] lg:items-stretch lg:py-10">
        <div className="section-shell px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute -bottom-1 right-4 hidden h-36 w-36 opacity-95 sm:block lg:h-40 lg:w-40">
            <CharacterImage asset="cat-peeking" className="h-full w-full mascot-float" priority imageClassName="object-contain" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow">{BRAND_NAME}</p>
            <h1 className="mt-5 display-title">{BRAND_TAGLINE}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#655a53] sm:text-lg">
              {BRAND_SUBTITLE} 검색은 내부 DB만 사용하고, 공식 원천은 서버 배치에서만 접근합니다. 원본 사이트를 사용자 요청마다 다시 호출하지 않습니다.
            </p>
            <div className="mt-8 max-w-3xl"><SearchBox /></div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/places" className="btn-secondary">내 주변 카테고리 보기</Link>
              <Link href="/guide" className="btn-secondary">생활 가이드 보기</Link>
            </div>
            <p className="mt-6 text-sm font-bold text-[#85786d]">
              현재 식당 {restaurantCount.toLocaleString("ko-KR")}곳 · 장소 {placeCount.toLocaleString("ko-KR")}건 · 실종 제보 {lostPetCount.toLocaleString("ko-KR")}건
              {lastSync?.finishedAt ? ` · 마지막 업데이트 ${lastSync.finishedAt.toLocaleString("ko-KR")}` : ""}
            </p>
          </div>
        </div>

        <div className="section-shell p-5 sm:p-6">
          <div className="absolute right-4 top-4 h-28 w-28 opacity-95 sm:h-32 sm:w-32">
            <CharacterImage asset="dog-hoodie" className="h-full w-full mascot-drift" imageClassName="object-contain" />
          </div>
          <div className="relative z-10 rounded-[1.9rem] bg-[#162320] p-6 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e7c694]">Daily Policy</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">데이터는 내부에 저장하고, 검색은 내부에서 끝냅니다.</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#d4cdc8]">
              <li>1. 사용자 검색 시 원본 사이트 호출 금지</li>
              <li>2. 공식/공공 데이터는 서버 배치로만 접근</li>
              <li>3. 공식 데이터 업데이트는 하루 1회 이하 유지</li>
            </ul>
          </div>
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
            <div className="stat-tile">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9d8e82]">식당</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink)]">{restaurantCount.toLocaleString("ko-KR")}</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9d8e82]">장소</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink)]">{placeCount.toLocaleString("ko-KR")}</p>
            </div>
          </div>
          <div className="relative z-10 mt-4 rounded-[1.6rem] border border-[rgba(56,41,29,0.08)] bg-white/72 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9d8e82]">오늘 많이 찾는 카테고리</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AROUND_ME_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="badge">{item.title}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell px-5 py-6 sm:px-6">
        <div className="absolute bottom-3 right-4 hidden h-20 w-20 opacity-90 sm:block">
          <CharacterImage asset="puppy-front-white" className="h-full w-full" imageClassName="object-contain" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Categories</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">생활 동선을 기준으로 카테고리를 나눴습니다.</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#645952] sm:text-base">식당과 병원만 따로 떼지 않고 여행, 접종, 실종 제보까지 실제 반려생활 흐름에 맞춰 묶었습니다.</p>
          </div>
        </div>
        <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_CATEGORIES.slice(0, 9).map((category) => <CategoryCard key={category.href} category={category} />)}
        </div>
      </section>

      <DataFreshnessNotice className="mt-8" />

      <AdSlot label="메인 중단 광고 영역" />

      <section className="py-2">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Guides</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">오늘 많이 보는 생활 가이드</h2>
          </div>
          <Link href="/guide" className="ink-link text-sm">전체 가이드</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {TODAY_GUIDES.map((guide) => (
            <GuideCard key={guide.href} title={guide.title} description={guide.description} href={guide.href} character={guide.character} />
          ))}
        </div>
      </section>

      <section className="py-2">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recent</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">최근 반영 식당</h2>
          </div>
          <Link href="/restaurants" className="ink-link text-sm">식당 전체 보기</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentRestaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Lost Pets</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">최근 실종 제보</h2>
            </div>
            <Link href="/lost-pets" className="ink-link text-sm">전체 보기</Link>
          </div>
          <div className="grid gap-4">
            {recentLostPets.length > 0 ? recentLostPets.map((item) => <LostPetCard key={item.id} item={item} />) : <div className="card rounded-[2rem] p-6 text-sm leading-7 text-[#665950]">공개된 실종 제보가 아직 없습니다.</div>}
          </div>
        </div>
        <PriceNote />
      </section>
    </main>
  );
}
