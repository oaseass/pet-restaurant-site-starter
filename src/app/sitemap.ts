import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
  const restaurants = await prisma.restaurant.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true },
    take: 5000,
  });

  const regions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/search`, lastModified: new Date() },
    { url: `${baseUrl}/guide`, lastModified: new Date() },
    ...regions.map((region) => ({ url: `${baseUrl}/regions/${encodeURIComponent(region)}`, lastModified: new Date() })),
    ...restaurants.map((restaurant) => ({ url: `${baseUrl}/restaurants/${restaurant.id}`, lastModified: restaurant.updatedAt })),
  ];
}
