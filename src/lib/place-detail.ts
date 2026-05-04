import { prisma } from "@/lib/prisma";
import { getPlacesByCategorySnapshot, PLACE_DB_CATEGORIES } from "@/lib/public-data";

export type PlaceDetail = {
  id: string;
  category: string;
  name: string;
  address: string | null;
  roadAddress: string | null;
  sido: string | null;
  sigungu: string | null;
  eupmyeondong: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  businessStatus: string | null;
  sourceName: string | null;
  updatedAt: string;
  /** 주소가 * 마스킹 포함 여부 */
  addressMasked: boolean;
};

/**
 * Place 상세 조회 — DB 우선, fallback은 per-category 스냅샷.
 * DB 조회는 이 함수에서만 수행한다 (목록/지도에서는 호출 금지).
 */
export async function getPlaceDetailById(id: string): Promise<PlaceDetail | null> {
  // 1. Prisma DB 조회
  try {
    const place = await prisma.place.findUnique({
      where: { id },
      select: {
        id: true,
        category: true,
        name: true,
        address: true,
        roadAddress: true,
        sido: true,
        sigungu: true,
        eupmyeondong: true,
        phone: true,
        lat: true,
        lng: true,
        businessStatus: true,
        sourceName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (place && place.isActive) {
      const addr = place.roadAddress ?? place.address ?? "";
      return {
        id: place.id,
        category: place.category as string,
        name: place.name,
        address: place.address,
        roadAddress: place.roadAddress,
        sido: place.sido,
        sigungu: place.sigungu,
        eupmyeondong: place.eupmyeondong,
        phone: place.phone,
        lat: place.lat,
        lng: place.lng,
        businessStatus: place.businessStatus,
        sourceName: place.sourceName,
        updatedAt: place.updatedAt.toISOString(),
        addressMasked: addr.includes("*"),
      };
    }
  } catch {
    // DB 실패 시 스냅샷으로 fallback
  }

  // 2. per-category 스냅샷에서 ID로 검색 (fallback)
  for (const cat of PLACE_DB_CATEGORIES) {
    const places = await getPlacesByCategorySnapshot(cat);
    const found = places.find((p) => p.id === id);
    if (found) {
      const addr = found.roadAddress ?? found.address ?? "";
      return {
        id: found.id,
        category: found.category,
        name: found.name,
        address: found.address,
        roadAddress: found.roadAddress,
        sido: found.sido,
        sigungu: found.sigungu,
        eupmyeondong: null,
        phone: found.phone,
        lat: found.lat,
        lng: found.lng,
        businessStatus: found.businessStatus,
        sourceName: found.sourceName,
        updatedAt: found.updatedAt,
        addressMasked: addr.includes("*"),
      };
    }
  }

  return null;
}
