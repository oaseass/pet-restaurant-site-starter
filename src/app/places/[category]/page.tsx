import type { Metadata } from "next";
import { PlaceDirectoryPage } from "@/components/PlaceDirectoryPage";
import { absoluteUrl } from "@/lib/brand";
import { getPlaceCategoryBySlug, getPlaceCategoryLabel } from "@/lib/platform-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const parsed = getPlaceCategoryBySlug(category);
  if (!parsed) {
    return { title: "카테고리를 찾을 수 없습니다." };
  }

  const title = `${getPlaceCategoryLabel(parsed)} | 댕냥지도`;
  return {
    title,
    description: `${getPlaceCategoryLabel(parsed)} 정보를 댕냥지도 내부 DB 기준으로 확인하세요.`,
    alternates: { canonical: absoluteUrl(`/places/${category}`) },
  };
}

export default async function PlaceCategoryRoute({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <PlaceDirectoryPage categorySlug={category} />;
}