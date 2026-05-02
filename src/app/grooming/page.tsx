import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { getCategoryCountsSnapshot, getPlacesLightSnapshot } from "@/lib/public-data";

export const metadata = {
  title: "반려동물 미용 | 댕냥지도",
  description: "반려동물 미용 종류, 가격 기준, 위생 확인 포인트 안내. 방문 전 체크리스트를 확인하세요.",
};

export default async function GroomingPage() {
  const [counts, allPlaces] = await Promise.all([getCategoryCountsSnapshot(), getPlacesLightSnapshot()]);
  const places = allPlaces.filter((p) => p.category === "GROOMING");
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="반려동물 미용" mapHref="/map?category=grooming" />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.grooming} />
    </PublicPageShell>
  );
}