import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";

export const dynamic = "force-dynamic";

export default function DaycarePage() {
  return <PlaceDirectoryPage categorySlug="daycare" title="유치원·호텔·위탁관리" description="돌봄과 위탁관리 정보는 지역 기반으로 묶어 보고, 가격은 참고값으로만 안내합니다." />;
}