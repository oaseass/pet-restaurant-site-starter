import Link from "next/link";
import type { PublicRestaurantLight } from "@/lib/public-data";

const QUICK_REGIONS = ["서울", "경기", "광주", "부산", "제주", "강원", "대구", "인천"];

const QUICK_KEYWORDS = [
  { label: "카페", q: "카페" },
  { label: "일반음식점", q: "일반음식점" },
  { label: "조개", q: "조개" },
  { label: "수완", q: "수완" },
  { label: "원주", q: "원주" },
  { label: "제과점", q: "제과점" },
];

const GUIDE_SHORTCUTS = [
  { label: "동물병원", href: "/hospitals" },
  { label: "미용", href: "/grooming" },
  { label: "유치원", href: "/daycare" },
  { label: "장례", href: "/funeral" },
  { label: "약국", href: "/pharmacy" },
  { label: "여행 가이드", href: "/guide/travel" },
  { label: "예방접종", href: "/guide/vaccination" },
  { label: "비행기", href: "/guide/flight" },
  { label: "찾아요", href: "/lost-pets" },
];

interface SearchSuggestionPanelProps {
  recentRestaurants: PublicRestaurantLight[];
}

export function SearchSuggestionPanel({ recentRestaurants }: SearchSuggestionPanelProps) {
  return (
    <div>
      {/* 지역 바로가기 */}
      <div
        style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--line)" }}
      >
        <div
          style={{ fontSize: "11px", fontWeight: 800, color: "#888", marginBottom: "8px", letterSpacing: "0.02em" }}
        >
          지역 검색
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {QUICK_REGIONS.map((r) => (
            <Link
              key={r}
              href={`/search?q=${encodeURIComponent(r)}`}
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
              {r}
            </Link>
          ))}
        </div>
      </div>

      {/* 빠른 검색 */}
      <div
        style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--line)" }}
      >
        <div
          style={{ fontSize: "11px", fontWeight: 800, color: "#888", marginBottom: "8px", letterSpacing: "0.02em" }}
        >
          추천 검색
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {QUICK_KEYWORDS.map((k) => (
            <Link
              key={k.q}
              href={`/search?q=${encodeURIComponent(k.q)}`}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--brand)",
                background: "var(--brand-soft)",
                border: "1px solid #c8e6c9",
                borderRadius: "6px",
                padding: "4px 10px",
                textDecoration: "none",
              }}
            >
              {k.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 최근 등록 식당 */}
      {recentRestaurants.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--line)" }}>
          <div
            style={{ padding: "8px 14px 4px", fontSize: "11px", fontWeight: 800, color: "#888", letterSpacing: "0.02em" }}
          >
            최근 등록
          </div>
          {recentRestaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderBottom: "1px solid var(--line)",
                textDecoration: "none",
                minHeight: "40px",
              }}
              className="hover:bg-[var(--bg)]"
            >
              <span
                style={{
                  width: "34px",
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
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.name}
              </span>
              <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>
                {r.sido} {r.sigungu ?? ""}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* 가이드 바로가기 */}
      <div style={{ padding: "10px 14px 14px" }}>
        <div
          style={{ fontSize: "11px", fontWeight: 800, color: "#888", marginBottom: "8px", letterSpacing: "0.02em" }}
        >
          가이드 바로가기
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {GUIDE_SHORTCUTS.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#555",
                background: "white",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "4px 10px",
                textDecoration: "none",
              }}
            >
              {g.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
