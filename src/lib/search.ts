import type { Prisma } from "@prisma/client";
import { normalizeText } from "@/lib/address";

export type RestaurantSearchParams = {
  q?: string;
  sido?: string;
  type?: string;
};

export function normalizeRestaurantSearchParams(params: RestaurantSearchParams) {
  return {
    q: normalizeText(params.q ?? ""),
    sido: normalizeText(params.sido ?? ""),
    type: normalizeText(params.type ?? ""),
  };
}

export function buildRestaurantSearchWhere(params: RestaurantSearchParams): Prisma.RestaurantWhereInput {
  const { q, sido, type } = normalizeRestaurantSearchParams(params);

  return {
    status: "ACTIVE",
    ...(sido ? { sido } : {}),
    ...(type ? { businessType: type } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { sido: { contains: q, mode: "insensitive" } },
            { sigungu: { contains: q, mode: "insensitive" } },
            { eupmyeondong: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
