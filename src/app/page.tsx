import Link from "next/link";
import { MapPin } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { LocationSearchButton } from "@/components/LocationSearchButton";
import { getCategoryCountsSnapshot, getRestaurantsLightSnapshot } from "@/lib/public-data";

const QUICK_REGIONS = [
  { label: "서울", q: "서울" },
  { label: "경기", q: "경기" },
  { label: "부산", q: "부산" },
  { label: "광주", q: "광주" },
  { label: "제주", q: "제주" },
  { label: "강원", q: "강원" },
  { label: "대구", q: "대구" },
  { label: "인천", q: "인천" },
];

const CATEGORY_LINKS = [
  { label: "식당", href: "/restaurants" },
  { label: "병원", href: "/hospitals" },
  { label: "미용", href: "/grooming" },
  { label: "유치원", href: "/daycare" },
  { label: "장례", href: "/funeral" },
  { label: "찾아요", href: "/lost-pets" },
  { label: "가이드", href: "/guide" },
];

export default async function HomePage() {
  const [counts, restaurants] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
  ]);

  const recent = restaurants.slice(0, 15);

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* 검색 허브 헤더 */}
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: "1px solid var(--line)",
          background: "white",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
            댕냥지도
          </h1>
          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", margin: 0 }}>
            반려동물 동반 식당 · 카카오맵 기반 장소 검색
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px", margin: 0 }}>
            식당 {counts.restaurantCount.toLocaleString("ko-KR")}건 등록
          </p>
        </div>

        {/* 메인 검색창 */}
        <InstantSearchBox placeholder="식당명, 지역, 업종으로 검색" />

        {/* 현재 위치로 찾기 */}
        <div style={{ marginTop: "7px" }}>
          <LocationSearchButton />
        </div>

        {/* 지역 빠른 선택 */}
        <div style={{ marginTop: "10px" }}>
          <div
            style={{ fontSize: "11px", fontWeight: 700, color: "#bbb", marginBottom: "6px", letterSpacing: "0.02em" }}
          >
            지역 바로가기
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {QUICK_REGIONS.map((r) => (
              <Link
                key={r.q}
                href={`/search?q=${encodeURIComponent(r.q)}`}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#444",
                  background: "#f3f4f6",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  textDecoration: "none",
                }}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div style={{ marginTop: "10px" }}>
          <div
            style={{ fontSize: "11px", fontWeight: 700, color: "#bbb", marginBottom: "6px", letterSpacing: "0.02em" }}
          >
            카테고리
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {CATEGORY_LINKS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--brand)",
                  background: "var(--brand-soft)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  textDecoration: "none",
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 지도에서 검색 CTA */}
      <Link
        href="/map"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: "var(--brand)",
          textDecoration: "none",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <MapPin size={14} color="rgba(255,255,255,0.9)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>지도에서 검색</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>위치 기반 탐색</span>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          지도 열기 →
        </span>
      </Link>

      {/* 최근 등록 식당 compact list */}
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#aaa",
            padding: "8px 14px 4px",
            letterSpacing: "0.02em",
          }}
        >
          최근 등록 식당
        </div>
        {recent.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderBottom: "1px solid var(--line)",
              minHeight: "42px",
            }}
          >
            <span
              style={{
                width: "30px",
                fontSize: "10px",
                fontWeight: 700,
                color: "#1f6b5b",
                background: "#f0fdf4",
                borderRadius: "4px",
                padding: "2px 3px",
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              식당
            </span>
            <Link
              href={`/restaurants/${r.id}`}
              style={{
                flex: 1,
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ink)",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.name}
            </Link>
            <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>
              {r.sigungu ?? r.sido}
            </span>
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              <Link
                href={`/map?q=${encodeURIComponent(r.name)}`}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--brand)",
                  background: "var(--brand-soft)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  textDecoration: "none",
                }}
              >
                지도
              </Link>
              <Link
                href={`/restaurants/${r.id}`}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#555",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  textDecoration: "none",
                }}
              >
                상세
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
