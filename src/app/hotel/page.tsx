import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";
import { getPlaceExperienceChecklist, matchesPlaceExperienceCategory } from "@/lib/place-experience";

export const metadata = {
  title: "호텔·리조트 | 댕냥지도",
  description: "반려동물 동반 호텔과 리조트 후보를 찾고, 객실 규정과 부대시설 동반 범위를 확인하세요.",
};

const HOTEL_CHECKLIST = getPlaceExperienceChecklist("ACCOMMODATION_HOTEL");

export default async function HotelPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [counts, daycarePlaces] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("DAYCARE")]);
  const places = daycarePlaces.filter((place) => matchesPlaceExperienceCategory({ baseCategory: place.category, name: place.name, tags: place.tags }, "ACCOMMODATION_HOTEL"));

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="section-shell px-6 py-6 sm:px-8 sm:py-8">
          <p className="eyebrow">Pet Hotel</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">호텔·리조트</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#655a53] sm:text-base">호텔과 리조트는 객실 타입, 라운지 규정, 추가 요금이 크게 다릅니다. 동반 가능한 객실과 부대시설 범위를 먼저 확인하세요.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
            <span className="badge">객실 타입 먼저 확인</span>
            <span className="badge">부대시설 범위 체크</span>
            <span className="badge">추가 요금 확인</span>
          </div>
        </div>
      </section>

      {places.length > 0 ? (
        <PlaceListSection places={places} categoryLabel="호텔·리조트" mapHref="/map?category=hotel&q=호텔" mapCategoryKeyOverride="hotel" listHref="/hotel" searchParams={resolvedSearchParams} />
      ) : (
        <section className="mx-auto max-w-7xl px-5 pb-6">
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-8 text-center text-sm font-bold leading-7 text-[var(--muted)]">
            아직 반려동물 동반 호텔과 리조트 후보를 더 정리 중입니다. 당장은 유치원·호텔 목록이나 지도 검색에서 호텔 키워드로 함께 찾아보세요.
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">방문 전 확인</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">호텔 방문 전 확인사항</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
            {HOTEL_CHECKLIST.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      </section>
    </PublicPageShell>
  );
}