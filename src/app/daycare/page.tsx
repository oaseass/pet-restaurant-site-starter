import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";

export const metadata = {
  title: "유치원·호텔·위탁관리 | 댕냥지도",
  description: "반려동물 유치원, 호텔, 위탁관리 서비스 안내. 맡기기 전 체크리스트와 주의사항을 확인하세요.",
};

export default function DaycarePage() {
  return <CategoryInfoPage data={CATEGORY_CONTENT.daycare} />;
}