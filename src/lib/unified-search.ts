import type { Guide, LostPet, LostPetStatus, Place, Prisma, Restaurant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/address";
import { GUIDE_DOCS } from "@/lib/platform-content";

export type UnifiedSearchParams = {
  keyword?: string;
  category?: string;
  sido?: string;
};

export type UnifiedSearchDeps = {
  restaurant: Pick<typeof prisma.restaurant, "findMany">;
  place: Pick<typeof prisma.place, "findMany">;
  guide: Pick<typeof prisma.guide, "findMany">;
  lostPet: Pick<typeof prisma.lostPet, "findMany">;
};

export type UnifiedSearchResult = {
  restaurants: Restaurant[];
  places: Place[];
  guides: Array<Pick<Guide, "id" | "slug" | "title" | "summary" | "category"> | { id: string; slug: string; title: string; summary: string; category: string }>;
  lostPets: LostPet[];
};

export function normalizeUnifiedSearchParams(params: UnifiedSearchParams) {
  return {
    keyword: normalizeText(params.keyword ?? ""),
    category: normalizeText(params.category ?? ""),
    sido: normalizeText(params.sido ?? ""),
  };
}

export function createUnifiedSearchService(deps: UnifiedSearchDeps) {
  return async function searchUnifiedContent(params: UnifiedSearchParams): Promise<UnifiedSearchResult> {
    const { keyword, category, sido } = normalizeUnifiedSearchParams(params);
    const visibleLostPetStatuses: LostPetStatus[] = ["APPROVED", "FOUND"];

    const restaurantWhere = {
      status: "ACTIVE" as const,
      ...(sido ? { sido } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: "insensitive" as const } },
              { address: { contains: keyword, mode: "insensitive" as const } },
              { sido: { contains: keyword, mode: "insensitive" as const } },
              { sigungu: { contains: keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const placeWhere = {
      isActive: true,
      ...(sido ? { sido } : {}),
      ...(category ? { category: category as never } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: "insensitive" as const } },
              { address: { contains: keyword, mode: "insensitive" as const } },
              { roadAddress: { contains: keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const guideWhere = keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: "insensitive" as const } },
            { summary: { contains: keyword, mode: "insensitive" as const } },
            { content: { contains: keyword, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const lostPetWhere: Prisma.LostPetWhereInput = {
      status: { in: visibleLostPetStatuses },
      ...(sido ? { lostSido: sido } : {}),
      ...(keyword
        ? {
            OR: [
              { petName: { contains: keyword, mode: "insensitive" as const } },
              { breed: { contains: keyword, mode: "insensitive" as const } },
              { lostAddress: { contains: keyword, mode: "insensitive" as const } },
              { description: { contains: keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [restaurants, places, guidesFromDb, lostPets] = await Promise.all([
      deps.restaurant.findMany({ where: restaurantWhere, orderBy: [{ sido: "asc" }, { sigungu: "asc" }, { name: "asc" }], take: 12 }),
      deps.place.findMany({ where: placeWhere, orderBy: [{ ownerVerified: "desc" }, { updatedAt: "desc" }], take: 12 }),
      deps.guide.findMany({ where: guideWhere, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, slug: true, title: true, summary: true, category: true } }),
      deps.lostPet.findMany({ where: lostPetWhere, orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

    const staticGuides = GUIDE_DOCS.filter((guide) => {
      if (!keyword) return true;
      return [guide.title, guide.summary, ...guide.sections.flatMap((section) => [section.title, ...section.bullets])]
        .join(" ")
        .toLowerCase()
        .includes(keyword.toLowerCase());
    }).map((guide) => ({
      id: `static-${guide.slug}`,
      slug: guide.slug,
      title: guide.title,
      summary: guide.summary,
      category: guide.category,
    }));

    const guideMap = new Map<string, UnifiedSearchResult["guides"][number]>();
    for (const guide of [...guidesFromDb, ...staticGuides]) {
      guideMap.set(guide.slug, guide);
    }

    return {
      restaurants,
      places,
      guides: Array.from(guideMap.values()).slice(0, 8),
      lostPets,
    };
  };
}

export const searchUnifiedContent = createUnifiedSearchService({
  restaurant: prisma.restaurant,
  place: prisma.place,
  guide: prisma.guide,
  lostPet: prisma.lostPet,
});