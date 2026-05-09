import { MapPin, ShieldCheck } from "lucide-react";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { InformationCompletenessBadge } from "@/components/InformationCompletenessBadge";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessCheckBadgeLabel, type BusinessCheckSummary } from "@/lib/business-checks-shared";
import { buildDiscoveryMapHref, getExternalInfoLabel, getInformationCompletenessSummary, getRestaurantIdentity, getReviewSummaryLabel, hasUsableCoordinates } from "@/lib/discovery-cards";

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
  hasPhoto?: boolean;
  reviewCount?: number | null;
  reviewAverage?: number | null;
  checkSummary?: BusinessCheckSummary | null;
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardItem }) {
  const regionLabel = restaurant.sigungu
    ? `${restaurant.sido} ${restaurant.sigungu}`
    : restaurant.sido;
  const hasCoordinates = hasUsableCoordinates(restaurant.lat, restaurant.lng);
  const mapHref = buildDiscoveryMapHref({ categoryKey: "restaurants", name: restaurant.name, lat: restaurant.lat, lng: restaurant.lng });
  const reviewLabel = getReviewSummaryLabel(restaurant.reviewCount, restaurant.reviewAverage);
  const hasReview = Boolean(restaurant.reviewCount && restaurant.reviewCount > 0);
  const checkBadgeLabel = getBusinessCheckBadgeLabel(restaurant.checkSummary);
  const externalLabel = restaurant.externalCategory ?? (restaurant.externalHref ? "지도 정보와 비교했어요" : getExternalInfoLabel(null));
  const identity = getRestaurantIdentity({ businessType: restaurant.businessType, externalCategory: restaurant.externalCategory });
  const completeness = getInformationCompletenessSummary({
    hasSource: restaurant.officialRegistered,
    phone: restaurant.phone,
    externalHref: restaurant.externalHref,
    externalCategory: restaurant.externalCategory,
    reviewCount: restaurant.reviewCount,
    hasCoordinates,
    hasPhoto: restaurant.hasPhoto,
    hasBusinessCheck: Boolean(restaurant.checkSummary?.count),
    hasUpdatedAt: Boolean(restaurant.dataUpdatedAt),
  });

  return (
    <article className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:bg-[var(--bg)]">
      <SmartLink href={`/restaurants/${restaurant.id}`} className="block text-[var(--ink)] no-underline">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand)]">{identity.eyebrow}</span>
          <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{identity.identityLabel}</span>
          <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{hasCoordinates ? "지도에서 보기" : "주소로 찾기"}</span>
          <InformationCompletenessBadge summary={completeness} />
          {restaurant.officialRegistered ? (
            <span className="inline-flex items-center gap-1 rounded bg-[#ecf8f3] px-2 py-0.5 text-[10px] font-black text-[#1a463f]"><ShieldCheck size={11} />공식 등록 정보</span>
          ) : null}
          {checkBadgeLabel ? <span className="rounded bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-black text-[#047857]">{checkBadgeLabel}</span> : null}
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-black leading-snug">{restaurant.name}</h3>
          <span className="shrink-0 text-xs font-black text-[var(--brand)]">자세히 →</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel}</p>
        <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{restaurant.address}</p>
        {completeness.gapLabel ? <p className="mt-2 line-clamp-1 text-[11px] font-bold text-[#8a6a3f]">{completeness.gapLabel}</p> : null}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-[#7b746d]">
          <span>{restaurant.phone ? "전화 가능" : "전화번호 알려주기"}</span>
          <span>{externalLabel}</span>
          {restaurant.checkSummary?.latestCheckedAt ? <span>{new Date(restaurant.checkSummary.latestCheckedAt).toLocaleDateString("ko-KR")} 확인</span> : null}
          {hasReview ? <span>{reviewLabel}</span> : null}
        </div>
      </SmartLink>
      <DiscoveryCardActions
        className="mt-3 border-t border-[var(--line)] pt-3"
        detailHref={`/restaurants/${restaurant.id}`}
        mapHref={mapHref}
        phone={restaurant.phone}
        externalHref={restaurant.externalHref}
      />
    </article>
  );
}

