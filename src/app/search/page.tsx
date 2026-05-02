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
    <main className="mx-auto max-w-4xl px-5 py-6 sm:py-8">
      {/* 검색 헤더 */}
      <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: "17px", fontWeight: 800, color: "var(--ink)", marginBottom: "10px" }}>통합 검색</h1>
        <SearchBox defaultValue={keyword} />
        {(keyword || params.sido || params.category) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {keyword && <span className="badge">검색어: {keyword}</span>}
            {params.sido && <span className="badge">지역: {params.sido}</span>}
            {params.category && <span className="badge">카테고리: {params.category}</span>}
            <span className="badge">결과 {total.toLocaleString("ko-KR")}건</span>
          </div>
        )}
      </div>

      <AdSlot label="검색 결과 상단 광고 영역" />

      {total === 0 && keyword ? <EmptyState title="검색 결과가 없습니다." description="지역명이나 카테고리를 조금 넓게 입력해 보세요." character="dog-brown" /> : null}

      {result.restaurants.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black text-[var(--ink)]">식당 <span className="text-[var(--muted)] font-medium">{result.restaurants.length}건</span></h2>
          <div>
            {result.restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        </section>
      ) : null}

      {result.places.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black text-[var(--ink)]">장소 <span className="text-[var(--muted)] font-medium">{result.places.length}건</span></h2>
          <div className="grid gap-3 md:grid-cols-2">
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
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black text-[var(--ink)]">가이드 <span className="text-[var(--muted)] font-medium">{result.guides.length}건</span></h2>
          <div className="grid gap-3 md:grid-cols-2">
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
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-black text-[var(--ink)]">찾아요 <span className="text-[var(--muted)] font-medium">{result.lostPets.length}건</span></h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {result.lostPets.map((item) => <LostPetCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      <DataFreshnessNotice className="mt-8" />
    </main>
  );
}
