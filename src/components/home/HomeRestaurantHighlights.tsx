import type { PublicRestaurantLight } from "@/lib/public-data";
import { SmartLink } from "@/components/SmartLink";

interface HomeRestaurantHighlightsProps {
  restaurants: PublicRestaurantLight[];
}

export function HomeRestaurantHighlights({ restaurants }: HomeRestaurantHighlightsProps) {
  const items = restaurants.slice(0, 6);

  return (
    <section style={{ padding: "16px 14px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#999", letterSpacing: "0.05em" }}>
          최근 등록 식당
        </div>
        <SmartLink
          href="/restaurants"
          style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}
        >
          전체 보기 →
        </SmartLink>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "6px",
        }}
      >
        {items.map((r) => (
          <div
            key={r.id}
            style={{
              padding: "10px 12px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
              {r.sigungu ?? r.sido} · {r.businessType}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#bbb",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.address}
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <SmartLink
                href={`/map?q=${encodeURIComponent(r.name)}`}
                pendingLabel="지도 여는 중..."
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--brand)",
                  background: "var(--brand-soft)",
                  borderRadius: "5px",
                  padding: "3px 8px",
                  textDecoration: "none",
                }}
              >
                지도
              </SmartLink>
              <SmartLink
                href={`/restaurants/${r.id}`}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#555",
                  background: "#f3f4f6",
                  borderRadius: "5px",
                  padding: "3px 8px",
                  textDecoration: "none",
                }}
              >
                상세
              </SmartLink>
            </div>
          </div>
        ))}
      </div>

      <SmartLink
        href="/restaurants"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "8px",
          padding: "9px",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#555",
          textDecoration: "none",
        }}
      >
        전체 식당 보기 →
      </SmartLink>
    </section>
  );
}
