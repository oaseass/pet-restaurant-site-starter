import { prisma } from "@/lib/prisma";
import { getPlaceDetailIndexSnapshot, getPlacesByCategorySnapshot, PLACE_DB_CATEGORIES, type PlaceDbCategory } from "@/lib/public-data";

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

function snapshotToDetail(found: {
  id: string; category: string; name: string;
  address: string | null; roadAddress: string | null;
  sido: string | null; sigungu: string | null;
  phone: string | null; lat: number | null; lng: number | null;
  businessStatus: string | null; sourceName: string | null; updatedAt: string;
}): PlaceDetail {
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

/**
 * snapshot에서 id로 place 조회.
 * detail-index.json으로 category를 먼저 찾아 해당 파일 하나만 읽는다.
 * index에 없으면 5개 파일 순차 검색 (fallback).
 */
async function getPlaceDetailFromSnapshots(id: string): Promise<PlaceDetail | null> {
  const index = await getPlaceDetailIndexSnapshot();
  const category = index[id] as PlaceDbCategory | undefined;

  if (category) {
    const places = await getPlacesByCategorySnapshot(category);
    const found = places.find((p) => p.id === id);
    if (found) return snapshotToDetail(found);
  }

  // index miss → 전체 검색 (index가 아직 없거나 오래된 경우)
  for (const cat of PLACE_DB_CATEGORIES) {
    if (cat === category) continue; // 이미 시도한 카테고리 스킵
    const places = await getPlacesByCategorySnapshot(cat);
    const found = places.find((p) => p.id === id);
    if (found) return snapshotToDetail(found);
  }

  return null;
}

/**
 * DB에서 id로 place 조회. timeoutMs 내 응답 없으면 null 반환.
 * DB가 잠든 상태에서 긴 대기를 막기 위해 반드시 짧은 timeout을 사용한다.
 */
async function getPlaceDetailFromDb(id: string, timeoutMs = 1500): Promise<PlaceDetail | null> {
  const queryPromise = prisma.place.findUnique({
    where: { id },
    select: {
      id: true, category: true, name: true,
      address: true, roadAddress: true,
      sido: true, sigungu: true, eupmyeondong: true,
      phone: true, lat: true, lng: true,
      businessStatus: true, sourceName: true,
      isActive: true, updatedAt: true,
    },
  }).then((place) => {
    if (!place || !place.isActive) return null;
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
    } satisfies PlaceDetail;
  }).catch(() => null);

  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Place 상세 조회 — snapshot 우선, DB는 1500ms timeout fallback.
 * snapshot에 있으면 DB 호출 없이 즉시 반환하므로 DB 휴면과 무관하게 빠르다.
 */
export async function getPlaceDetailById(id: string): Promise<PlaceDetail | null> {
  // 1. public snapshot 우선
  const snapshotResult = await getPlaceDetailFromSnapshots(id);
  if (snapshotResult) return snapshotResult;

  // 2. snapshot에 없을 때만 DB 시도 (최대 1500ms)
  return getPlaceDetailFromDb(id, 1500);
}

