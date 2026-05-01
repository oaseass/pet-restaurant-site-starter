import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";

export const dynamic = "force-dynamic";

export default function HospitalsPage() {
  return <PlaceDirectoryPage categorySlug="animal-hospital" title="동물병원" description="동물병원 정보는 공식 배치 데이터와 관리자 검수 정책을 구분해 단계적으로 확장합니다." />;
}