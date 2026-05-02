import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { PublicPageShell } from "@/components/PublicPageShell";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export const metadata = {
  title: "반려동물 장례 | 댕냥지도",
  description: "반려동물 장례 절차와 합법 장묘업체 확인 방법 안내. 사망 신고 방법과 화장·봉안·수목장 차이를 확인하세요.",
};

export default async function FuneralPage() {
  const counts = await getCategoryCountsSnapshot();
  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      <CategoryInfoPage data={CATEGORY_CONTENT.funeral} />
    </PublicPageShell>
  );
}