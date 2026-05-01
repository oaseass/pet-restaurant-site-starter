import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";

export const dynamic = "force-dynamic";

export default function RestaurantsPage() {
  return <PlaceDirectoryPage categorySlug="pet-restaurant" title="반려동물 동반 식당" description="식품안전나라 공개 정보를 내부 DB에 저장한 뒤 지역과 업소명으로 바로 탐색합니다." />;
}