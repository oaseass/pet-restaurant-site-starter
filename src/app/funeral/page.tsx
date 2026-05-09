import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";

export const metadata = {
  title: "반려동물 장례 | 댕냥지도",
  description: "반려동물 장례 절차와 합법 장묘업체 확인 방법 안내. 사망 신고 방법과 화장·봉안·수목장 차이를 확인하세요.",
};

export default async function FuneralPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [counts, places] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("FUNERAL")]);
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="반려동물 장례" mapHref="/map?category=funeral" listHref="/funeral" searchParams={resolvedSearchParams} />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.funeral} />
    </PublicPageShell>
  );
}