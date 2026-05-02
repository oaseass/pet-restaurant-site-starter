import Link from "next/link";
import { MapPin, Plus, AlertTriangle } from "lucide-react";

interface RightRailProps {
  restaurantCount?: number;
  lastUpdatedAt?: string | null;
}

const REGION_LINKS = [
  { label: "서울", href: "/regions/서울" },
  { label: "경기", href: "/regions/경기" },
  { label: "부산", href: "/regions/부산" },
  { label: "광주", href: "/regions/광주" },
  { label: "제주", href: "/regions/제주" },
  { label: "전체", href: "/restaurants" },
];

export function RightRail({ restaurantCount, lastUpdatedAt }: RightRailProps) {
  const updatedDateStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleDateString("ko-KR")
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* 지도 카드 */}
      <Link
        href="/map"
        className="map-preview-card"
        style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      >
        {/* 지도 격자 배경 */}
        <svg
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1f6b5b" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* 핀 아이콘 */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} color="#fff" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1b" }}>지도에서 보기</div>
            {restaurantCount !== undefined && (
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                식당 {restaurantCount.toLocaleString("ko-KR")}곳 등록
              </div>
            )}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "var(--brand)", color: "#fff", fontSize: "11px", fontWeight: 700, borderRadius: "999px", padding: "4px 12px" }}>
            <MapPin size={10} />
            지도 열기
          </div>
        </div>
      </Link>

      {/* 지역 바로가기 */}
      <div style={{ border: "1px solid var(--line)", borderRadius: "10px", background: "var(--surface)", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px 6px", fontSize: "11px", fontWeight: 800, color: "#666", borderBottom: "1px solid var(--line)" }}>
          지역별 탐색
        </div>
        <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {REGION_LINKS.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              style={{ fontSize: "12px", fontWeight: 700, color: "#444", background: "#f3f4f6", border: "1px solid var(--line)", borderRadius: "6px", padding: "4px 10px", textDecoration: "none", transition: "background 0.1s" }}
              className="hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 데이터 기준 */}
      {(restaurantCount !== undefined || updatedDateStr) && (
        <div style={{ border: "1px solid var(--line)", borderRadius: "10px", background: "var(--surface)", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px 6px", fontSize: "11px", fontWeight: 800, color: "#666", borderBottom: "1px solid var(--line)" }}>
            데이터 기준
          </div>
          <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {restaurantCount !== undefined && (
              <div style={{ fontSize: "12px", color: "#555" }}>
                등록 식당 <strong style={{ color: "#222" }}>{restaurantCount.toLocaleString("ko-KR")}건</strong>
              </div>
            )}
            {updatedDateStr && (
              <div style={{ fontSize: "12px", color: "#555" }}>
                업데이트 <strong style={{ color: "#222" }}>{updatedDateStr}</strong>
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>식품안전나라 공공데이터 기반</div>
          </div>
        </div>
      )}

      {/* 제보·업체 등록 */}
      <div style={{ border: "1px solid var(--line)", borderRadius: "10px", background: "var(--surface)", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px 6px", fontSize: "11px", fontWeight: 800, color: "#666", borderBottom: "1px solid var(--line)" }}>
          제보 · 등록
        </div>
        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <Link
            href="/business"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--brand)", textDecoration: "none", padding: "5px 8px", borderRadius: "6px", background: "var(--brand-soft)" }}
          >
            <Plus size={12} />
            업체 등록하기
          </Link>
          <Link
            href="/lost-pets"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#b45309", textDecoration: "none", padding: "5px 8px", borderRadius: "6px", background: "#fef3c7" }}
          >
            <AlertTriangle size={12} />
            실종 제보하기
          </Link>
        </div>
      </div>
    </div>
  );
}
