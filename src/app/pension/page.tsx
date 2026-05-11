import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";
import { matchesPlaceExperienceCategory } from "@/lib/place-experience";

export const metadata = {
  title: "애견동반 펜션 | 댕냥지도",
  description: "반려견과 함께 묵을 수 있는 펜션 후보를 찾고 객실 정책, 추가 요금, 동반 제한을 방문 전에 확인하세요.",
};

const PENSION_CHECKLIST = [
  "반려견 동반 객실 여부",
  "견종/무게 제한",
  "마리 수 제한",
  "추가 요금",
  "실내 동반 가능 여부",
  "침구/가구 이용 제한",
  "개별 운동장 여부",
  "바비큐장 동반 가능 여부",
];

export default async function PensionPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [counts, daycarePlaces] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("DAYCARE")]);
  const places = daycarePlaces.filter((place) => matchesPlaceExperienceCategory({ baseCategory: place.category, name: place.name, tags: place.tags }, "ACCOMMODATION_PENSION"));

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="section-shell px-6 py-6 sm:px-8 sm:py-8">
          <p className="eyebrow">Pet Pension</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">애견동반 펜션</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#655a53] sm:text-base">숙소는 식당보다 조건 차이가 큽니다. 객실 허용 범위, 추가 요금, 실내 동반 가능 여부를 후기와 함께 보고 전화로 한 번 더 확인하세요.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
            <span className="badge">후기와 지도 비교 우선</span>
            <span className="badge">객실 정책 직접 확인</span>
            <span className="badge">요금/무게 제한 체크</span>
          </div>
        </div>
      </section>

      {places.length > 0 ? (
        <PlaceListSection places={places} categoryLabel="애견동반 펜션" mapHref="/map?category=pension" mapCategoryKeyOverride="pension" listHref="/pension" searchParams={resolvedSearchParams} />
      ) : (
        <section className="mx-auto max-w-7xl px-5 pb-6">
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-8 text-center text-sm font-bold leading-7 text-[var(--muted)]">
            아직 애견동반 펜션 후보를 더 정리 중입니다. 당장은 지도 전체 검색이나 유치원·호텔 목록에서 숙소형 업체를 함께 살펴보세요.
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">방문 전 확인</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">펜션 방문 전 확인사항</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
            {PENSION_CHECKLIST.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      </section>
    </PublicPageShell>
  );
}