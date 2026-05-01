import { SearchBox } from "@/components/SearchBox";
import { EmptyState } from "@/components/EmptyState";
import { GuideCard } from "@/components/GuideCard";
import { LostPetCard } from "@/components/LostPetCard";
import { PlaceCard } from "@/components/PlaceCard";
import { RestaurantCard } from "@/components/RestaurantCard";
import { AdSlot } from "@/components/AdSlot";
import { DataFreshnessNotice } from "@/components/DataFreshnessNotice";
import { getPlaceCategoryLabel, QUICK_CATEGORIES } from "@/lib/platform-content";
import { searchUnifiedContent } from "@/lib/unified-search";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sido?: string; category?: string }> }) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";
  const result = await searchUnifiedContent({ keyword, sido: params.sido, category: params.category });
  const total = result.restaurants.length + result.places.length + result.guides.length + result.lostPets.length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10">
          <p className="eyebrow">검색</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">통합 검색</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">식당, 병원, 장소, 생활 가이드, 실종 제보를 한 번에 찾아보세요.</p>
        </div>
        <div className="mt-6"><SearchBox defaultValue={keyword} /></div>
        <div className="mt-5 flex flex-wrap gap-2">
          {keyword ? <span className="badge">검색어 {keyword}</span> : null}
          {params.sido ? <span className="badge">시도 {params.sido}</span> : null}
          {params.category ? <span className="badge">카테고리 {params.category}</span> : null}
          <span className="badge">총 결과 {total.toLocaleString("ko-KR")}건</span>
        </div>
      </section>

      <AdSlot label="검색 결과 상단 광고 영역" />

      {total === 0 ? <EmptyState title="검색 결과가 없습니다." description="지역명이나 카테고리를 조금 넓게 입력해 보세요." character="dog-brown" /> : null}

      {result.restaurants.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">식당</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">식당</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        </section>
      ) : null}

      {result.places.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">장소</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">장소</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.places.map((place) => (
              <PlaceCard
                key={place.id}
                item={{
                  id: place.id,
                  name: place.name,
                  address: place.address,
                  phone: place.phone,
                  ownerVerified: place.ownerVerified,
                  sourceType: place.sourceType,
                  category: place.category,
                  categoryLabel: getPlaceCategoryLabel(place.category),
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {result.guides.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">생활 가이드</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">가이드</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {result.guides.map((guide) => (
              <GuideCard
                key={guide.slug}
                title={guide.title}
                description={guide.summary}
                href={`/guide/${guide.slug}`}
                character={QUICK_CATEGORIES.find((item) => item.category === guide.category)?.character ?? "cat-waving"}
              />
            ))}
          </div>
        </section>
      ) : null}

      {result.lostPets.length > 0 ? (
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">댕냥이 찾아요</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight">댕냥이 찾아요</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {result.lostPets.map((item) => <LostPetCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      <DataFreshnessNotice className="mt-8" />
    </main>
  );
}
