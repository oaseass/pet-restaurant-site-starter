import Link from "next/link";
import { MapPin } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { BoardList } from "@/components/BoardList";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

const CATEGORY_LINKS = [
  { label: "식당", href: "/restaurants", color: "#f0fdf4", textColor: "#166534" },
  { label: "병원", href: "/hospitals", color: "#e8f0fe", textColor: "#2563eb" },
  { label: "미용", href: "/grooming", color: "#fce7f3", textColor: "#be185d" },
  { label: "유치원", href: "/daycare", color: "#fef3c7", textColor: "#92400e" },
  { label: "장례", href: "/funeral", color: "#f3f4f6", textColor: "#4b5563" },
  { label: "찾아요", href: "/lost-pets", color: "#fff7ed", textColor: "#c2410c" },
  { label: "가이드", href: "/guide", color: "#faf5ff", textColor: "#7c3aed" },
  { label: "지도", href: "/map", color: "var(--brand-soft)", textColor: "var(--brand)" },
] as const;

export default async function HomePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* 검색 + 지도 CTA 헤더 */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--line)",
          background: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            댕냥지도
          </h1>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            식당 {counts.restaurantCount.toLocaleString("ko-KR")}건 등록
          </span>
        </div>

        {/* 검색창 */}
        <InstantSearchBox
          placeholder="식당, 지역, 업종 검색"
          autoFocus={false}
        />

        {/* 카테고리 바로가기 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            marginTop: "8px",
          }}
        >
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: cat.textColor,
                background: cat.color,
                borderRadius: "6px",
                padding: "4px 10px",
                textDecoration: "none",
                border: "1px solid transparent",
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 지도 열기 CTA 바 */}
      <Link
        href="/map"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--brand)",
          textDecoration: "none",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={15} color="rgba(255,255,255,0.9)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
            지도에서 검색
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
            위치 기반 식당 탐색
          </span>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
          지도 열기 →
        </span>
      </Link>

      {/* 식당 목록 */}
      <BoardList />
    </PublicPageShell>
  );
}
