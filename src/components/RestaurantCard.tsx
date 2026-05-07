import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { CategoryVisualBlock } from "@/components/discovery/CategoryVisualBlock";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { SmartLink } from "@/components/SmartLink";
import { buildDiscoveryMapHref, buildReviewHref, formatDiscoveryDate, getExternalInfoLabel, getRestaurantIdentity, getReviewSummaryLabel, hasUsableCoordinates } from "@/lib/discovery-cards";

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
  phone?: string | null;
  externalCategory?: string | null;
  externalHref?: string | null;
  reviewCount?: number | null;
  reviewAverage?: number | null;
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardItem }) {
  const regionLabel = restaurant.sigungu
    ? `${restaurant.sido} ${restaurant.sigungu}`
    : restaurant.sido;
  const hasCoordinates = hasUsableCoordinates(restaurant.lat, restaurant.lng);
  const mapHref = buildDiscoveryMapHref({ categoryKey: "restaurants", name: restaurant.name, lat: restaurant.lat, lng: restaurant.lng });
  const reviewHref = buildReviewHref("RESTAURANT", restaurant.id);
  const reviewLabel = getReviewSummaryLabel(restaurant.reviewCount, restaurant.reviewAverage);
  const externalLabel = restaurant.externalCategory ?? (restaurant.externalHref ? "지도 정보와 비교했어요" : getExternalInfoLabel(null));
  const identity = getRestaurantIdentity({ businessType: restaurant.businessType, externalCategory: restaurant.externalCategory });

  return (
    <article className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:bg-[var(--bg)]">
      <SmartLink href={`/restaurants/${restaurant.id}`} className="block text-[var(--ink)] no-underline">
        <div className="grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
          <CategoryVisualBlock kind={identity.visualKind} title={identity.identityLabel} description={identity.serviceLabel} compact />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand)]">{identity.eyebrow}</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{identity.identityLabel}</span>
              <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{hasCoordinates ? "지도에서 보기" : "주소로 찾기"}</span>
              {restaurant.officialRegistered ? (
                <span className="inline-flex items-center gap-1 rounded bg-[#ecf8f3] px-2 py-0.5 text-[10px] font-black text-[#1a463f]"><ShieldCheck size={11} />공식 등록 정보</span>
              ) : null}
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[15px] font-black leading-snug">{restaurant.name}</h3>
              <span className="shrink-0 text-xs font-black text-[var(--brand)]">자세히 →</span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5f5550]">{identity.description}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel}</p>
          </div>
        </div>
        <p className="mt-2 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{restaurant.address}</p>
        <div className="mt-3 grid gap-1.5 text-[11px] font-bold text-[#7b746d] sm:grid-cols-2">
          <span>{restaurant.phone ? "전화로 좌석 확인" : "전화번호는 제보를 기다려요"}</span>
          <span>{externalLabel}</span>
          <span>{reviewLabel}</span>
          <span>{identity.serviceLabel}</span>
          <span className="flex items-center gap-1 sm:col-span-2"><CalendarDays size={12} />업데이트 {formatDiscoveryDate(restaurant.dataUpdatedAt)}</span>
        </div>
      </SmartLink>
      <DiscoveryCardActions
        className="mt-3 border-t border-[var(--line)] pt-3"
        detailHref={`/restaurants/${restaurant.id}`}
        mapHref={mapHref}
        phone={restaurant.phone}
        externalHref={restaurant.externalHref}
        reviewHref={reviewHref}
      />
    </article>
  );
}

