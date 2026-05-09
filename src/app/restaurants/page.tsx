import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";
import type { ListPageSearchParams } from "@/lib/list-location-filters";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  return <PlaceDirectoryPage categorySlug="pet-restaurant" title="반려동물 동반 식당" description="식품안전나라 공개자료를 바탕으로 동네와 업소명으로 찾기 쉽게 정리했어요." baseHref="/restaurants" searchParams={resolvedSearchParams} />;
}