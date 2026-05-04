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
    if (cat === category) continue;
    const places = await getPlacesByCategorySnapshot(cat);
    const found = places.find((p) => p.id === id);
    if (found) return snapshotToDetail(found);
  }

  return null;
}

/**
 * Place 상세 조회 — snapshot 전용.
 * 공개 상세 페이지는 DB를 사용하지 않는다.
 * DB 조회는 관리자/동기화 스크립트에서만 수행한다.
 */
export async function getPlaceDetailById(id: string): Promise<PlaceDetail | null> {
  return getPlaceDetailFromSnapshots(id);
}


