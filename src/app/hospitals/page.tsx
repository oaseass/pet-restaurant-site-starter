import { CategoryInfoPage } from "@/components/CategoryInfoPage";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";

export const metadata = {
  title: "동물병원 찾기 | 댕냥지도",
  description: "가까운 동물병원과 24시 응급병원 정보 안내. 방문 전 체크리스트와 진료비 공개 항목을 확인하세요.",
};

export default function HospitalsPage() {
  return <CategoryInfoPage data={CATEGORY_CONTENT.hospital} />;
}