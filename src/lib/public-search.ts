import type { PublicRestaurantLight } from "@/lib/public-data";
import { GUIDE_DOCS, type GuideDoc } from "@/lib/platform-content";

const SIDO_LIST = [
  "서울", "인천", "경기", "강원", "충북", "충남", "세종", "대전",
  "경북", "대구", "전북", "광주", "전남", "경남", "울산", "부산", "제주",
];

/** 공백 제거 + 소문자 정규화 */
export function normalizeSearchKeyword(keyword: string): string {
  return keyword.replace(/\s+/g, "").toLowerCase();
}

/** 키워드에서 시도 감지 (앞부분 일치) */
export function detectRegionFromKeyword(keyword: string): string | null {
  const trimmed = keyword.trim();
  return SIDO_LIST.find((sido) => trimmed.startsWith(sido) || trimmed === sido) ?? null;
}

/** 키워드에서 업종 힌트 감지 */
export function detectCategoryFromKeyword(keyword: string): string | null {
  const norm = normalizeSearchKeyword(keyword);
  if (norm.includes("카페") || norm.includes("cafe") || norm.includes("커피") || norm.includes("coffee")) return "휴게음식점";
  if (norm.includes("제과") || norm.includes("베이커리") || norm.includes("빵") || norm.includes("케이크")) return "제과점영업";
  if (norm.includes("일반음식점")) return "일반음식점";
  if (norm.includes("휴게음식점")) return "휴게음식점";
  return null;
}

export type SearchRestaurantResult = PublicRestaurantLight & { score: number };

/**
 * restaurants-light.json 스냅샷에서 키워드 검색.
 * DB 조회 없음 — 순수 메모리 필터 + 스코어링.
 */
export function searchRestaurantsSnapshot(
  restaurants: PublicRestaurantLight[],
  params: { q: string; sido?: string; limit?: number },
): SearchRestaurantResult[] {
  const { q, sido, limit = 50 } = params;
  const norm = normalizeSearchKeyword(q);

  // 지역 필터
  const pool = sido ? restaurants.filter((r) => r.sido === sido) : restaurants;

  if (!norm) {
    // 키워드 없을 때: 좌표 우선 + 최신순
    return pool
      .slice()
      .sort((a, b) => {
        const aHasCoord = a.lat !== null;
        const bHasCoord = b.lat !== null;
        if (aHasCoord !== bHasCoord) return aHasCoord ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, limit)
      .map((r) => ({ ...r, score: 1 }));
  }

  return pool
    .map((r) => {
      const name = normalizeSearchKeyword(r.name);
      const address = normalizeSearchKeyword(r.address);
      const sigungu = r.sigungu ? normalizeSearchKeyword(r.sigungu) : "";
      const eupmyeondong = r.eupmyeondong ? normalizeSearchKeyword(r.eupmyeondong) : "";
      const bType = normalizeSearchKeyword(r.businessType);
      const sidoN = normalizeSearchKeyword(r.sido);
      let score = 0;

      // 이름 매칭: 완전 일치 > 시작 일치 > 포함
      if (name === norm) score += 100;
      else if (name.startsWith(norm)) score += 60;
      else if (name.includes(norm)) score += 40;

      // 지역 매칭
      if (eupmyeondong.includes(norm)) score += 25;
      if (sigungu.includes(norm)) score += 20;
      if (sidoN.includes(norm)) score += 15;

      // 주소 포함
      if (address.includes(norm)) score += 12;

      // 업종 매칭
      if (bType.includes(norm)) score += 8;

      // 좌표 가산점 (지도 연결 가능)
      if (r.lat !== null) score += 2;

      return score > 0 ? ({ ...r, score } as SearchRestaurantResult) : null;
    })
    .filter((r): r is SearchRestaurantResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * GUIDE_DOCS 정적 배열에서 키워드 검색.
 * DB 없이 in-memory 검색.
 */
export function searchGuidesStatic(keyword: string): GuideDoc[] {
  if (!keyword.trim()) return GUIDE_DOCS.slice(0, 4);
  const norm = normalizeSearchKeyword(keyword);
  return GUIDE_DOCS.filter((g) => {
    return (
      normalizeSearchKeyword(g.title).includes(norm) ||
      normalizeSearchKeyword(g.summary).includes(norm)
    );
  });
}

/** 최근 업데이트 식당 N개 */
export function getRecentRestaurants(
  restaurants: PublicRestaurantLight[],
  count = 10,
): PublicRestaurantLight[] {
  return [...restaurants]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, count);
}

/**
 * 텍스트에서 키워드 매칭 부분을 하이라이트용 세그먼트로 분리.
 */
export function highlightMatch(
  text: string,
  keyword: string,
): Array<{ text: string; highlight: boolean }> {
  if (!keyword.trim()) return [{ text, highlight: false }];
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKw);
  if (idx === -1) return [{ text, highlight: false }];
  const parts: Array<{ text: string; highlight: boolean }> = [];
  if (idx > 0) parts.push({ text: text.slice(0, idx), highlight: false });
  parts.push({ text: text.slice(idx, idx + keyword.length), highlight: true });
  if (idx + keyword.length < text.length) {
    parts.push({ text: text.slice(idx + keyword.length), highlight: false });
  }
  return parts;
}

/** 자동완성 후보용 경량 타입 */
export type SuggestionItem = {
  id: string;
  name: string;
  businessType: string;
  sido: string;
  sigungu: string | null;
  lat: number | null;
  lng: number | null;
};

/** 자동완성 후보 생성 (상위 N개) */
export function getSuggestions(
  restaurants: PublicRestaurantLight[],
  q: string,
  limit = 8,
): SuggestionItem[] {
  if (!q.trim()) return [];
  const results = searchRestaurantsSnapshot(restaurants, { q, limit });
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    businessType: r.businessType,
    sido: r.sido,
    sigungu: r.sigungu,
    lat: r.lat,
    lng: r.lng,
  }));
}
