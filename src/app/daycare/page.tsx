import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { getCategoryCountsSnapshot, getPlacesLightSnapshot } from "@/lib/public-data";

export const metadata = {
  title: "유치원·호텔·위탁관리 | 댕냥지도",
  description: "반려동물 유치원, 호텔, 위탁관리 서비스 안내. 맡기기 전 체크리스트와 주의사항을 확인하세요.",
};

export default async function DaycarePage() {
  const [counts, allPlaces] = await Promise.all([getCategoryCountsSnapshot(), getPlacesLightSnapshot()]);
  const places = allPlaces.filter((p) => p.category === "DAYCARE");
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="유치원·호텔" mapHref="/map?category=daycare" />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.daycare} />
    </PublicPageShell>
  );
}