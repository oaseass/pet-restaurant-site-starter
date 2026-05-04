import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PlaceListSection } from "@/components/PlaceListSection";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { getCategoryCountsSnapshot, getPlacesByCategorySnapshot } from "@/lib/public-data";

export const metadata = {
  title: "동물약국 찾기 | 댕냥지도",
  description: "가까운 동물약국 정보와 처방전 필요 의약품 안내. 구충제·심장사상충 예방약 등 구입 가능한 의약품을 확인하세요.",
};

export default async function PharmacyPage() {
  const [counts, places] = await Promise.all([getCategoryCountsSnapshot(), getPlacesByCategorySnapshot("PHARMACY")]);
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {places.length > 0 && (
        <PlaceListSection places={places} categoryLabel="동물약국" mapHref="/map?category=pharmacy" />
      )}
      <CategoryInfoPage data={CATEGORY_CONTENT.pharmacy} />
    </PublicPageShell>
  );
}
