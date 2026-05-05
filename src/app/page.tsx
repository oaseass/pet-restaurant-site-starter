import { MapPin } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { LocationSearchButton } from "@/components/LocationSearchButton";
import { SmartLink } from "@/components/SmartLink";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { HomeStartPaths } from "@/components/home/HomeStartPaths";
import { HomeCategoryCards } from "@/components/home/HomeCategoryCards";
import { HomeRestaurantHighlights } from "@/components/home/HomeRestaurantHighlights";
import { HomeGuideSection } from "@/components/home/HomeGuideSection";
import { getCategoryCountsSnapshot, getRestaurantsLightSnapshot } from "@/lib/public-data";

export default async function HomePage() {
  const [counts, restaurants] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
  ]);

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* SearchHero */}
      <div
        style={{
          padding: "16px 14px 14px",
          borderBottom: "1px solid var(--line)",
          background: "#fff",
        }}
      >
        <h1
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: "var(--ink)",
            margin: "0 0 2px",
            lineHeight: 1.3,
          }}
        >
          반려동물 동반 장소, 빠르게 찾기
        </h1>
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px" }}>
          식당명, 지역, 업종을 검색하거나 현재 위치로 가까운 장소를 찾아보세요.
        </p>

        <InstantSearchBox placeholder="식당명, 지역, 업종으로 검색" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            marginTop: "7px",
          }}
        >
          <LocationSearchButton />
          <SmartLink
            href="/map"
            pendingLabel="지도 여는 중..."
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "9px 14px",
              background: "var(--brand)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <MapPin size={14} />
            지도에서 보기
          </SmartLink>
        </div>
      </div>

      {/* QuickActions */}
      <HomeQuickActions />

      <HomeStartPaths />

      {/* CategoryCards */}
      <HomeCategoryCards counts={counts} />

      {/* RestaurantHighlights */}
      <HomeRestaurantHighlights restaurants={restaurants} />

      {/* GuideSection */}
      <HomeGuideSection />

      {/* 데이터 출처 / 등록 CTA */}
      <div
        style={{
          margin: "16px 14px",
          padding: "12px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: "#666", marginBottom: "4px" }}>데이터 안내</div>
        식당 정보는 식품안전나라 공공데이터를 기반으로 합니다.
        누락·오류 정보는{" "}
        <SmartLink href="/business" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
          업체등록
        </SmartLink>
        으로 제보해주세요.
      </div>

      {/* 하단 여백 */}
      <div style={{ height: "24px" }} />
    </PublicPageShell>
  );
}
