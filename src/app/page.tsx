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
import { BRAND_NAME } from "@/lib/brand";
import { getCategoryCountsSnapshot, getRestaurantsLightSnapshot, toRestaurantCardItem } from "@/lib/public-data";
import { AROUND_ME_ITEMS, QUICK_CATEGORIES, TODAY_GUIDES } from "@/lib/platform-content";

export default async function HomePage() {
  const [categoryCounts, restaurantsLight] = await Promise.all([getCategoryCountsSnapshot(), getRestaurantsLightSnapshot()]);
  const recentRestaurants = restaurantsLight.slice(0, 6).map(toRestaurantCardItem);
  const recentLostPets = categoryCounts.lostPetCount > 0
    ? await prisma.lostPet.findMany({ where: { status: { in: ["APPROVED", "FOUND"] } }, orderBy: { createdAt: "desc" }, take: 3 })
    : [];
  const lastSnapshotUpdatedAt = categoryCounts.lastUpdatedAt ? new Date(categoryCounts.lastUpdatedAt) : null;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-10">
      <section className="grid gap-4 py-7 lg:grid-cols-[1.14fr_0.86fr] lg:items-stretch lg:py-8">
        <div className="section-shell px-6 py-6 sm:px-8 sm:py-8">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow">지도 중심</p>
            <h1 className="mt-5 display-title">우리 동네 반려생활을 지도에서 바로 찾기</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              반려동물 동반 식당부터 병원, 미용, 유치원, 실종 제보까지
              댕냥지도에서 한 번에 확인하세요.
            </p>
            <div className="mt-7 max-w-3xl"><SearchBox /></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/map" className="btn-primary">지도에서 찾기</Link>
              <Link href="/map" className="btn-secondary">내 주변 식당 보기</Link>
              <Link href="/restaurants" className="btn-secondary">전체 식당 보기</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-[var(--muted)]">
              <span className="badge">식당 {categoryCounts.restaurantCount.toLocaleString("ko-KR")}건</span>
              <span className="badge">병원·장소 {categoryCounts.placeCount.toLocaleString("ko-KR")}건</span>
              <span className="badge">댕냥이 찾아요 {categoryCounts.lostPetCount.toLocaleString("ko-KR")}건</span>
              {lastSnapshotUpdatedAt ? <span className="badge">업데이트 {lastSnapshotUpdatedAt.toLocaleDateString("ko-KR")}</span> : null}
            </div>
          </div>
        </div>

        <div className="section-shell p-5 sm:p-6">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">바로 둘러보기</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--ink)]">지금 많이 찾는 정보부터 빠르게 확인하세요.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">지도 진입, 핵심 카테고리, 생활 가이드를 첫 화면에서 바로 이어갈 수 있도록 정리했습니다.</p>
            </div>
            <div className="hidden h-24 w-24 shrink-0 rounded-2xl bg-[var(--accent-soft)] p-3 sm:block">
              <CharacterImage asset="cat-peeking" className="h-full w-full mascot-float" priority imageClassName="object-contain" />
            </div>
          </div>
          <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
            <div className="stat-tile">
              <p className="text-[11px] font-black text-[var(--muted)]">핀 가능 식당</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink)]">{categoryCounts.restaurantCoordinateReadyCount.toLocaleString("ko-KR")}</p>
            </div>
            <div className="stat-tile">
              <p className="text-[11px] font-black text-[var(--muted)]">좌표 준비중</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink)]">{categoryCounts.restaurantCoordinatePendingCount.toLocaleString("ko-KR")}</p>
            </div>
          </div>
          <div className="relative z-10 mt-4 rounded-[1rem] border border-[var(--line)] bg-[#fcfbf8] p-4">
            <p className="text-[11px] font-black text-[var(--muted)]">자주 찾는 지도 진입</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AROUND_ME_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="badge">{item.title}</Link>
              ))}
            </div>
            <Link href="/map" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
              지도 열기
            </Link>
          </div>
        </div>
      </section>

      <section className="py-2">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">카테고리</p>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">자주 찾는 생활 카테고리</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">식당, 병원, 미용, 유치원, 실종 제보까지 반려생활 동선에 맞게 빠르게 진입할 수 있습니다.</p>
          </div>
          <Link href="/categories" className="ink-link text-sm">전체 카테고리</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_CATEGORIES.slice(0, 9).map((category) => <CategoryCard key={category.href} category={category} />)}
        </div>
      </section>

      <DataFreshnessNotice className="mt-8" />

      <AdSlot label="메인 중단 광고 영역" />

      <section className="py-2">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">생활 가이드</p>
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
            <p className="eyebrow">최근 등록</p>
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
              <p className="eyebrow">댕냥이 찾아요</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">최근 실종 제보</h2>
            </div>
            <Link href="/lost-pets" className="ink-link text-sm">전체 보기</Link>
          </div>
          <div className="grid gap-4">
            {recentLostPets.length > 0 ? recentLostPets.map((item) => <LostPetCard key={item.id} item={item} />) : <div className="card rounded-[1rem] p-6 text-sm leading-7 text-[var(--muted)]">공개된 실종 제보가 아직 없습니다.</div>}
          </div>
        </div>
        <PriceNote />
      </section>
    </main>
  );
}
