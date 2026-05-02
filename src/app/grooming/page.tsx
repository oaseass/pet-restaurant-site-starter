import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";

export const metadata = {
  title: "반려동물 미용 | 댕냥지도",
  description: "반려동물 미용 종류, 가격 기준, 위생 확인 포인트 안내. 방문 전 체크리스트를 확인하세요.",
};

export default function GroomingPage() {
  return <CategoryInfoPage data={CATEGORY_CONTENT.grooming} />;
}