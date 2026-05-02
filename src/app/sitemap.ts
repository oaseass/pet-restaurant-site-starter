import type { MetadataRoute } from "next";
import { getRestaurantsLightSnapshot } from "@/lib/public-data";
import { CALCULATOR_CARDS, GUIDE_DOCS, POLICY_LINKS, REGION_OPTIONS, getPlaceCategorySlug, PLACE_DIRECTORY_CATEGORIES } from "@/lib/platform-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim().replace(/\/$/, "");
  const generatedAt = new Date();
  const restaurants = await getRestaurantsLightSnapshot().catch(() => []);

  return [
    { url: `${baseUrl}/`, lastModified: generatedAt },
    { url: `${baseUrl}/map`, lastModified: generatedAt },
    { url: `${baseUrl}/categories`, lastModified: generatedAt },
    { url: `${baseUrl}/places`, lastModified: generatedAt },
    { url: `${baseUrl}/restaurants`, lastModified: generatedAt },
    { url: `${baseUrl}/hospitals`, lastModified: generatedAt },
    { url: `${baseUrl}/hospitals/emergency`, lastModified: generatedAt },
    { url: `${baseUrl}/grooming`, lastModified: generatedAt },
    { url: `${baseUrl}/daycare`, lastModified: generatedAt },
    { url: `${baseUrl}/training`, lastModified: generatedAt },
    { url: `${baseUrl}/funeral`, lastModified: generatedAt },
    { url: `${baseUrl}/pharmacy`, lastModified: generatedAt },
    { url: `${baseUrl}/search`, lastModified: generatedAt },
    { url: `${baseUrl}/guide`, lastModified: generatedAt },
    { url: `${baseUrl}/calculators`, lastModified: generatedAt },
    { url: `${baseUrl}/lost-pets`, lastModified: generatedAt },
    { url: `${baseUrl}/business`, lastModified: generatedAt },
    { url: `${baseUrl}/report`, lastModified: generatedAt },
    { url: `${baseUrl}/policies`, lastModified: generatedAt },
    ...PLACE_DIRECTORY_CATEGORIES.map((category) => ({ url: `${baseUrl}/places/${getPlaceCategorySlug(category)}`, lastModified: generatedAt })),
    ...GUIDE_DOCS.map((guide) => ({ url: `${baseUrl}/guide/${guide.slug}`, lastModified: new Date(guide.reviewedAt) })),
    ...CALCULATOR_CARDS.map((card) => ({ url: `${baseUrl}${card.href}`, lastModified: generatedAt })),
    ...POLICY_LINKS.map((policy) => ({ url: `${baseUrl}${policy.href}`, lastModified: generatedAt })),
    ...REGION_OPTIONS.map((region) => ({ url: `${baseUrl}/regions/${encodeURIComponent(region)}`, lastModified: generatedAt })),
    ...restaurants.map((restaurant) => ({
      url: `${baseUrl}/restaurants/${restaurant.id}`,
      lastModified: restaurant.updatedAt ? new Date(restaurant.updatedAt) : generatedAt,
    })),
  ];
}
