import { BookOpen, HeartPulse, MapPin, PawPrint, Pill, Utensils } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { LocationSearchButton } from "@/components/LocationSearchButton";
import { SmartLink } from "@/components/SmartLink";
import { AdSlot } from "@/components/AdSlot";
import { HomeCategoryCards } from "@/components/home/HomeCategoryCards";
import { HomeRestaurantHighlights } from "@/components/home/HomeRestaurantHighlights";
import { HomeGuideSection } from "@/components/home/HomeGuideSection";
import { getCategoryCountsSnapshot, getRestaurantsLightSnapshot } from "@/lib/public-data";

const HOME_ENTRY_LINKS = [
  { label: "병원", href: "/hospitals", icon: HeartPulse },
  { label: "약국", href: "/pharmacy", icon: Pill },
  { label: "식당", href: "/restaurants", icon: Utensils },
  { label: "찾아요", href: "/lost-pets?tab=shelter", icon: PawPrint },
  { label: "챙길 것", href: "/guide/travel", icon: BookOpen },
] as const;

export default async function HomePage() {
  const [counts, restaurants] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
  ]);
  const homeSignals = [
    { label: "내 주변", value: "지도 열기", href: "/map" },
    { label: "보호동물", value: "공고 보기", href: "/lost-pets?tab=shelter" },
    { label: "가기 전", value: "질문 보기", href: "/guide/travel" },
  ];

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* SearchHero */}
      <div
        style={{
          padding: "14px 14px 12px",
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
          강아지 데리고 갈 곳 찾기
        </h1>
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px" }}>
          지도, 카테고리, 보호동물 공고, 가이드까지 오늘 필요한 것부터 보세요.
        </p>

        <InstantSearchBox placeholder="동네, 업종, 업체명 검색" />

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "6px",
            marginTop: "9px",
          }}
        >
          {HOME_ENTRY_LINKS.map(({ label, href, icon: Icon }) => (
            <SmartLink
              key={href}
              href={href}
              pendingLabel="이동 중..."
              style={{
                display: "flex",
                minWidth: 0,
                minHeight: "58px",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                background: "#fff",
                color: "var(--ink)",
                fontSize: "10.5px",
                fontWeight: 800,
                lineHeight: 1.15,
                padding: "7px 4px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: "24px",
                  height: "24px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "7px",
                  background: "var(--brand-soft)",
                  color: "var(--brand)",
                }}
              >
                <Icon size={14} />
              </span>
              {label}
            </SmartLink>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "6px",
            marginTop: "8px",
          }}
        >
          {homeSignals.map((item) => (
            <SmartLink
              key={item.href}
              href={item.href}
              pendingLabel="이동 중..."
              style={{
                minWidth: 0,
                border: "1px solid var(--line)",
                borderRadius: "8px",
                background: "#fbfcfb",
                padding: "7px 8px",
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--muted)", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.label}
              </div>
              <div style={{ marginTop: "2px", fontSize: "12px", fontWeight: 900, color: "var(--brand)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.value}
              </div>
            </SmartLink>
          ))}
        </div>
      </div>

      {/* CategoryCards */}
      <HomeCategoryCards counts={counts} />

      {/* RestaurantHighlights */}
      <HomeRestaurantHighlights restaurants={restaurants} />

      <AdSlot label="홈 추천 흐름 광고" className="mx-3 sm:mx-4" />

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
        <div style={{ fontWeight: 700, color: "#666", marginBottom: "4px" }}>정보 안내</div>
        식당 정보는 식품안전나라 공개자료를 보기 쉽게 정리한 내용입니다.
        누락·오류 정보는{" "}
        <SmartLink href="/business" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
          업체 등록
        </SmartLink>
        으로 알려주세요.
      </div>

      {/* 하단 여백 */}
      <div style={{ height: "24px" }} />
    </PublicPageShell>
  );
}
