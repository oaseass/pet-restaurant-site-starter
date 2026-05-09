import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";

export const metadata = {
  title: "동물병원 찾기 | 댕냥지도",
  description: "가까운 동물병원과 24시 응급병원 정보 안내. 방문 전 체크리스트와 진료비 공개 항목을 확인하세요.",
};

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [counts, places] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("ANIMAL_HOSPITAL")]);
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="동물병원" mapHref="/map?category=hospitals" listHref="/hospitals" searchParams={resolvedSearchParams} />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.hospital} />
    </PublicPageShell>
  );
}