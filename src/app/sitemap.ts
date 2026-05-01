import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CALCULATOR_CARDS, GUIDE_DOCS, POLICY_LINKS, REGION_OPTIONS, getPlaceCategorySlug, PLACE_DIRECTORY_CATEGORIES } from "@/lib/platform-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
  const [restaurants, lostPets] = await Promise.all([
    prisma.restaurant.findMany({ where: { status: "ACTIVE" }, select: { id: true, updatedAt: true }, take: 5000 }),
    prisma.lostPet.findMany({ where: { status: { in: ["APPROVED", "FOUND"] } }, select: { id: true, updatedAt: true }, take: 1000 }),
  ]);

  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/categories`, lastModified: new Date() },
    { url: `${baseUrl}/places`, lastModified: new Date() },
    { url: `${baseUrl}/restaurants`, lastModified: new Date() },
    { url: `${baseUrl}/hospitals`, lastModified: new Date() },
    { url: `${baseUrl}/hospitals/emergency`, lastModified: new Date() },
    { url: `${baseUrl}/grooming`, lastModified: new Date() },
    { url: `${baseUrl}/daycare`, lastModified: new Date() },
    { url: `${baseUrl}/training`, lastModified: new Date() },
    { url: `${baseUrl}/funeral`, lastModified: new Date() },
    { url: `${baseUrl}/search`, lastModified: new Date() },
    { url: `${baseUrl}/guide`, lastModified: new Date() },
    { url: `${baseUrl}/calculators`, lastModified: new Date() },
    { url: `${baseUrl}/lost-pets`, lastModified: new Date() },
    { url: `${baseUrl}/business`, lastModified: new Date() },
    { url: `${baseUrl}/report`, lastModified: new Date() },
    ...PLACE_DIRECTORY_CATEGORIES.map((category) => ({ url: `${baseUrl}/places/${getPlaceCategorySlug(category)}`, lastModified: new Date() })),
    ...GUIDE_DOCS.map((guide) => ({ url: `${baseUrl}/guide/${guide.slug}`, lastModified: new Date(guide.reviewedAt) })),
    ...CALCULATOR_CARDS.map((card) => ({ url: `${baseUrl}${card.href}`, lastModified: new Date() })),
    ...POLICY_LINKS.map((policy) => ({ url: `${baseUrl}${policy.href}`, lastModified: new Date() })),
    ...REGION_OPTIONS.map((region) => ({ url: `${baseUrl}/regions/${encodeURIComponent(region)}`, lastModified: new Date() })),
    ...restaurants.map((restaurant) => ({ url: `${baseUrl}/restaurants/${restaurant.id}`, lastModified: restaurant.updatedAt })),
    ...lostPets.map((item) => ({ url: `${baseUrl}/lost-pets/${item.id}`, lastModified: item.updatedAt })),
  ];
}
