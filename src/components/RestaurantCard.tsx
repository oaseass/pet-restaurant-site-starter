import { CalendarDays, MapPin, Navigation } from "lucide-react";
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
  const lat = typeof restaurant.lat === "number" ? restaurant.lat : null;
  const lng = typeof restaurant.lng === "number" ? restaurant.lng : null;
  const hasCoordinates = lat !== null && lng !== null;
  const mapHref = hasCoordinates
    ? `/map?category=restaurants&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`
    : `/map?category=restaurants&q=${encodeURIComponent(restaurant.name)}`;

  return (
    <article className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 transition hover:bg-[var(--bg)]">
      <SmartLink href={`/restaurants/${restaurant.id}`} className="block text-[var(--ink)] no-underline">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand)]">식당</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{restaurant.businessType}</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{hasCoordinates ? "지도 가능" : "주소 검색"}</span>
            </div>
            <h3 className="mt-2 truncate text-[15px] font-black leading-snug">{restaurant.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel}</p>
          </div>
          <span className="shrink-0 text-xs font-black text-[var(--brand)]">상세 →</span>
        </div>
        <p className="mt-2 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{restaurant.address}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#9ca3af]"><CalendarDays size={12} /> 기준 {restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")}</p>
      </SmartLink>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
        <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--brand)] px-3 text-xs font-black text-[var(--brand)]">
          <Navigation size={13} />
          지도
        </SmartLink>
        <SmartLink href={`/restaurants/${restaurant.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 text-xs font-black text-white">
          상세
        </SmartLink>
      </div>
    </article>
  );
}

