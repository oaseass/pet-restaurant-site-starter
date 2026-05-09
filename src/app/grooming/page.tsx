import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";

export const metadata = {
  title: "반려동물 미용 | 댕냥지도",
  description: "반려동물 미용 종류, 가격 기준, 위생 확인 포인트 안내. 방문 전 체크리스트를 확인하세요.",
};

export default async function GroomingPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [counts, places] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("GROOMING")]);
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="반려동물 미용" mapHref="/map?category=grooming" listHref="/grooming" searchParams={resolvedSearchParams} />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.grooming} />
    </PublicPageShell>
  );
}