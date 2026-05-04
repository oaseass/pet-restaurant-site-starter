import { MapPin } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

export type RestaurantCardItem = {
  id: string;
  name: string;
  businessType: string;
  sido: string;
  sigungu: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  officialRegistered?: boolean;
  dataUpdatedAt: Date;
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardItem }) {
  const regionLabel = restaurant.sigungu
    ? `${restaurant.sido} ${restaurant.sigungu}`
    : restaurant.sido;

  return (
    <SmartLink
      href={`/restaurants/${restaurant.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px 14px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        textDecoration: "none",
        color: "var(--ink)",
        transition: "background 0.1s",
      }}
      className="hover:bg-[var(--bg)] group"
    >
      {/* 업종 배지 */}
      <span style={{
        flexShrink: 0,
        fontSize: "10px",
        fontWeight: 800,
        padding: "2px 6px",
        borderRadius: "4px",
        background: "var(--brand-soft)",
        color: "var(--brand)",
        whiteSpace: "nowrap",
      }}>
        {restaurant.businessType}
      </span>

      {/* 업체명 */}
      <span style={{
        flex: 1,
        minWidth: 0,
        fontSize: "14px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {restaurant.name}
      </span>

      {/* 지역 */}
      <span style={{
        flexShrink: 0,
        fontSize: "12px",
        color: "var(--muted)",
        display: "flex",
        alignItems: "center",
        gap: "2px",
        whiteSpace: "nowrap",
      }}>
        <MapPin size={10} />
        {regionLabel}
      </span>

      {/* 액션 */}
      <span style={{
        flexShrink: 0,
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--brand)",
      }}>
        상세 →
      </span>
    </SmartLink>
  );
}

