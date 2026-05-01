import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";

export const dynamic = "force-dynamic";

export default function TrainingPage() {
  return <PlaceDirectoryPage categorySlug="training" title="훈련" description="방문훈련과 합숙훈련, 사회화 관련 정보를 지역 기준으로 정리합니다." />;
}