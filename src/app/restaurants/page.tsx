import type { Metadata } from "next";
import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";
import type { ListPageSearchParams } from "@/lib/list-location-filters";
import { absoluteUrl } from "@/lib/brand";

export const metadata: Metadata = {
  title: "반려동물 동반 식당 | 댕냥지도",
  description: "동네별 반려동물 동반 식당을 찾고, 방문 전에 좌석과 동반 조건을 확인할 수 있게 정리했습니다.",
  alternates: { canonical: absoluteUrl("/restaurants") },
};

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<ListPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  return <PlaceDirectoryPage categorySlug="pet-restaurant" title="반려동물 동반 식당" description="식품안전나라 공개자료를 바탕으로 동네와 업소명으로 찾기 쉽게 정리했어요." baseHref="/restaurants" searchParams={resolvedSearchParams} />;
}