import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot, getRestaurantsLightSnapshot, getPlacesLightSnapshot } from "@/lib/public-data";
import { detectPlaceCategoryFromKeyword, searchRestaurantsSnapshot, searchGuidesStatic, searchPlacesSnapshot, getRecentRestaurants } from "@/lib/public-search";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { SearchFilterTabs } from "@/components/search/SearchFilterTabs";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { SearchSuggestionPanel } from "@/components/search/SearchSuggestionPanel";
import { SmartLink } from "@/components/SmartLink";

// force-dynamic 제거 — DB 조회 없음, JSON 스냅샷 기반

const PLACE_CATEGORY_MAP_KEY: Record<string, string> = {
  ANIMAL_HOSPITAL: "hospitals",
  PHARMACY: "pharmacy",
  GROOMING: "grooming",
  DAYCARE: "daycare",
  FUNERAL: "funeral",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sido?: string }>;
}) {
  const params = await searchParams;
  const keyword = params.q?.trim() ?? "";
  const category = params.category ?? "all";
  const placeCategoryIntent = category === "all" ? detectPlaceCategoryFromKeyword(keyword) : null;
  const isRestaurantOnly = category === "restaurants";
  const isGuideOnly = category === "guide";
  const shouldShowRestaurants = !isGuideOnly && (isRestaurantOnly || !placeCategoryIntent);
  const shouldShowPlaces = !isRestaurantOnly && !isGuideOnly && Boolean(keyword);

  const [counts, restaurants, places] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
    shouldShowPlaces ? getPlacesLightSnapshot() : Promise.resolve([]),
  ]);

  const restaurantResults = shouldShowRestaurants ? searchRestaurantsSnapshot(restaurants, {
    q: keyword,
    sido: params.sido,
    limit: 50,
  }) : [];

  const placeResults = shouldShowPlaces ? searchPlacesSnapshot(places, {
    q: keyword,
    sido: params.sido,
    category: placeCategoryIntent ?? undefined,
    limit: 30,
  }) : [];

  const guideResults = keyword && !isRestaurantOnly ? searchGuidesStatic(keyword) : [];
  const recentRestaurants = keyword ? [] : getRecentRestaurants(restaurants, 10);
  const mapHref = placeCategoryIntent
    ? `/map?q=${encodeURIComponent(keyword)}&category=${PLACE_CATEGORY_MAP_KEY[placeCategoryIntent] ?? "all"}`
    : `/map?q=${encodeURIComponent(keyword)}`;

  const SHELTER_KEYWORDS = ["유기견", "유기묘", "유기동물", "보호소", "보호동물", "구조동물", "입양", "보호중"];
  const showShelterBanner = keyword ? SHELTER_KEYWORDS.some((kw) => keyword.includes(kw)) : false;

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* 검색창 헤더 */}
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "white",
          zIndex: 20,
        }}
      >
        <h1
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "var(--ink)",
            marginBottom: "8px",
          }}
        >
          검색
        </h1>
        <InstantSearchBox defaultValue={keyword} autoFocus={false} />
      </div>

      {/* 카테고리 탭 */}
      <SearchFilterTabs activeTab={keyword ? category : "all"} keyword={keyword} />

      {/* 검색 결과 또는 추천 화면 */}
      {keyword ? (
        <>
          {showShelterBanner && (
            <SmartLink
              href="/lost-pets?tab=shelter"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#eff6ff",
                borderBottom: "1px solid #bfdbfe",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 600 }}>
                보호동물 공고에서 지역별 보호 중인 아이를 볼 수 있어요
              </span>
              <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700 }}>공고 보기 →</span>
            </SmartLink>
          )}
          <SearchResultsList
            restaurants={restaurantResults}
            places={placeResults}
            guides={guideResults}
            keyword={keyword}
            mapHref={mapHref}
          />
        </>
      ) : (
        <SearchSuggestionPanel recentRestaurants={recentRestaurants} />
      )}
    </PublicPageShell>
  );
}
