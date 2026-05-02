import Link from "next/link";
import { MapPin, AlertCircle, PlusCircle } from "lucide-react";

interface RightRailProps {
  restaurantCount?: number;
  lastUpdatedAt?: string | null;
}

const POPULAR_REGIONS = ["서울", "부산", "제주", "경기", "대구", "인천"];

const CHECKLIST = [
  "동반 가능 여부 전화 확인",
  "예방접종 기록 챙기기",
  "이동장·물·간식 준비",
  "주차 가능 여부 확인",
];

export function RightRail({ restaurantCount, lastUpdatedAt }: RightRailProps) {
  const updatedDateStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleDateString("ko-KR")
    : null;

  const widgetStyle = {
    marginBottom: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    overflow: "hidden",
  };

  const headerStyle = {
    padding: "7px 10px 6px",
    fontSize: "11px",
    fontWeight: 800 as const,
    color: "#555",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
    letterSpacing: "0.02em",
  };

  return (
    <div style={{ paddingTop: "2px" }}>
      {/* 지도 열기 */}
      <div style={widgetStyle}>
        <div style={headerStyle}>지도에서 찾기</div>
        <div style={{ padding: "10px" }}>
          <Link
            href="/map"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              width: "100%",
              background: "#1f6b5b",
              color: "#fff",
              borderRadius: "4px",
              padding: "7px 0",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <MapPin size={12} />
            지도 열기
          </Link>
        </div>
      </div>

      {/* 인기 지역 */}
      <div style={widgetStyle}>
        <div style={headerStyle}>지역별 탐색</div>
        <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {POPULAR_REGIONS.map((region) => (
            <Link
              key={region}
              href={`/regions/${encodeURIComponent(region)}`}
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#555",
                background: "#f3f3f3",
                border: "1px solid #ddd",
                borderRadius: "3px",
                padding: "3px 7px",
                textDecoration: "none",
              }}
            >
              {region}
            </Link>
          ))}
        </div>
      </div>

      {/* 데이터 현황 */}
      {(restaurantCount !== undefined || updatedDateStr) && (
        <div style={widgetStyle}>
          <div style={headerStyle}>데이터 기준</div>
          <div style={{ padding: "8px 10px", fontSize: "12px", color: "#666" }}>
            {restaurantCount !== undefined && (
              <div>
                등록 식당{" "}
                <strong style={{ color: "#222" }}>
                  {restaurantCount.toLocaleString("ko-KR")}건
                </strong>
              </div>
            )}
            {updatedDateStr && (
              <div style={{ marginTop: "3px" }}>
                업데이트{" "}
                <strong style={{ color: "#222" }}>{updatedDateStr}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 제보·업체 등록 */}
      <div style={widgetStyle}>
        <div style={headerStyle}>제보·업체 등록</div>
        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <Link
            href="/business"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#1f6b5b",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
            }}
          >
            <PlusCircle size={12} />
            업체 등록하기
          </Link>
          <Link
            href="/lost-pets"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#c2410c",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
            }}
          >
            <AlertCircle size={12} />
            실종 제보하기
          </Link>
        </div>
      </div>

      {/* 외출 전 체크리스트 */}
      <div style={widgetStyle}>
        <div style={headerStyle}>외출 전 체크</div>
        <ul style={{ padding: "6px 10px 8px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
          {CHECKLIST.map((item) => (
            <li
              key={item}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "5px",
                fontSize: "11px",
                color: "#555",
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: "12px",
                  height: "12px",
                  border: "1.5px solid #ccc",
                  borderRadius: "2px",
                  display: "inline-block",
                  marginTop: "1px",
                }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
