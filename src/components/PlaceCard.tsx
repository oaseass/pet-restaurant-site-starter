import { CalendarDays, MapPin, Phone } from "lucide-react";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { SourceBadge } from "@/components/SourceBadge";
import { SmartLink } from "@/components/SmartLink";
import { buildDiscoveryMapHref, buildReviewHref, formatDiscoveryDate, getPlaceMapCategoryKey, getReviewSummaryLabel, hasUsableCoordinates } from "@/lib/discovery-cards";
import type { PlaceCategory, SourceType } from "@prisma/client";

export function PlaceCard({
  item,
}: {
  item: {
    id: string;
    href?: string;
    name: string;
    categoryLabel: string;
    address?: string | null;
    phone?: string | null;
    lat?: number | null;
    lng?: number | null;
    sido?: string | null;
    sigungu?: string | null;
    ownerVerified?: boolean;
    sourceType?: SourceType;
    category?: PlaceCategory;
    businessStatus?: string | null;
    sourceName?: string | null;
    externalCategory?: string | null;
    externalHref?: string | null;
    reviewCount?: number | null;
    reviewAverage?: number | null;
    dataUpdatedAt?: string | Date | null;
  };
}) {
  const mapCategoryKey = getPlaceMapCategoryKey(item.category);
  const hasCoordinates = hasUsableCoordinates(item.lat, item.lng);
  const mapHref = buildDiscoveryMapHref({ categoryKey: mapCategoryKey, name: item.name, lat: item.lat, lng: item.lng });
  const reviewLabel = getReviewSummaryLabel(item.reviewCount, item.reviewAverage);
  const externalLabel = item.externalCategory ?? (item.externalHref ? "외부정보 있음" : "공공 데이터");
  const reviewHref = item.href ? buildReviewHref("PLACE", item.id) : undefined;
  const body = (
    <>
      <div className="flex flex-wrap gap-2">
        <SourceBadge
          label={item.sourceType === "OWNER_SUBMISSION" ? "업체 등록" : item.sourceType === "USER_REPORT" ? "사용자 제보" : item.sourceType === "ADMIN_VERIFIED" ? "관리자 확인" : "공식 데이터"}
          tone={item.sourceType === "OWNER_SUBMISSION" ? "owner" : item.sourceType === "USER_REPORT" ? "user" : item.sourceType === "ADMIN_VERIFIED" ? "admin" : "official"}
        />
        <span className="badge">{item.categoryLabel}</span>
        <span className="badge">{hasCoordinates ? "지도 가능" : "주소 검색"}</span>
        <span className="badge">{item.phone ? "전화 가능" : "전화 제보 필요"}</span>
        {item.businessStatus ? <span className="badge">{item.businessStatus}</span> : null}
        {item.ownerVerified ? <SourceBadge label="업체 인증" tone="owner" /> : null}
      </div>
      <h3 className="mt-4 text-xl font-black tracking-tight">{item.name}</h3>
      {item.address ? (
        <p className="mt-3 flex gap-2 text-sm leading-7 text-[var(--muted)]">
          <MapPin className="mt-1 shrink-0" size={16} />
          <span>{item.address}</span>
        </p>
      ) : null}
      {item.phone ? (
        <p className="mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]">
          <Phone className="mt-0.5 shrink-0" size={15} />
          <span>{item.phone}</span>
        </p>
      ) : null}
      <div className="mt-3 grid gap-1.5 text-xs font-bold text-[#7b746d] sm:grid-cols-2">
        <span>{externalLabel}</span>
        <span>{reviewLabel}</span>
        {item.dataUpdatedAt ? <span className="flex items-center gap-1"><CalendarDays size={13} />기준 {formatDiscoveryDate(item.dataUpdatedAt)}</span> : null}
        {!item.phone ? <span>방문 전 전화번호 제보 필요</span> : null}
      </div>
      {!item.address && !item.phone ? <p className="mt-3 text-sm leading-7 text-[var(--muted)]">기본 정보는 순차적으로 보강하고 있습니다. 운영 여부와 위치는 방문 전 확인이 필요합니다.</p> : null}
    </>
  );

  if (!item.href) {
    return <article className="card rounded-[1rem] p-5">{body}</article>;
  }

  return (
    <article className="card rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <SmartLink href={item.href} className="block text-[var(--ink)] no-underline">{body}</SmartLink>
      <DiscoveryCardActions
        className="mt-4 border-t border-[var(--line)] pt-3"
        detailHref={item.href}
        mapHref={mapHref}
        phone={item.phone}
        externalHref={item.externalHref}
        reviewHref={reviewHref}
      />
    </article>
  );
}