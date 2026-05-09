import { MapPin, Phone } from "lucide-react";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { InformationCompletenessBadge } from "@/components/InformationCompletenessBadge";
import { SmartLink } from "@/components/SmartLink";
import { getBusinessCheckBadgeLabel, type BusinessCheckSummary } from "@/lib/business-checks-shared";
import { buildDiscoveryMapHref, getExternalInfoLabel, getInformationCompletenessSummary, getPlaceIdentity, getPlaceMapCategoryKey, getReviewSummaryLabel, hasUsableCoordinates } from "@/lib/discovery-cards";
import type { PlaceCategory, SourceType } from "@prisma/client";

const LOW_CONFIDENCE_NAME_PATTERNS = [/^#?grooming$/i, /^#?daycare$/i, /^#?funeral$/i, /^#?pharmacy$/i, /^#?hospital$/i, /^#?animal[-_\s]?hospital$/i];

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function getDisplayPlaceName(item: { name: string; categoryLabel: string; sido?: string | null; sigungu?: string | null }) {
  const cleanedName = normalizeDisplayName(item.name);
  if (cleanedName && !LOW_CONFIDENCE_NAME_PATTERNS.some((pattern) => pattern.test(cleanedName))) return cleanedName;
  const region = [item.sido, item.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${item.categoryLabel}` : `${item.categoryLabel} 업체`;
}

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
    hasPhoto?: boolean;
    reviewCount?: number | null;
    reviewAverage?: number | null;
    checkSummary?: BusinessCheckSummary | null;
    dataUpdatedAt?: string | Date | null;
  };
}) {
  const displayName = getDisplayPlaceName(item);
  const mapCategoryKey = getPlaceMapCategoryKey(item.category);
  const hasCoordinates = hasUsableCoordinates(item.lat, item.lng);
  const mapHref = buildDiscoveryMapHref({ categoryKey: mapCategoryKey, name: displayName, lat: item.lat, lng: item.lng });
  const reviewLabel = getReviewSummaryLabel(item.reviewCount, item.reviewAverage);
  const hasReview = Boolean(item.reviewCount && item.reviewCount > 0);
  const checkBadgeLabel = getBusinessCheckBadgeLabel(item.checkSummary);
  const externalLabel = item.externalCategory ?? (item.externalHref ? "지도 정보와 비교했어요" : getExternalInfoLabel(null));
  const identity = getPlaceIdentity({ category: item.category, name: displayName, externalCategory: item.externalCategory });
  const completeness = getInformationCompletenessSummary({
    hasSource: Boolean(item.sourceName || item.sourceType),
    phone: item.phone,
    externalHref: item.externalHref,
    externalCategory: item.externalCategory,
    reviewCount: item.reviewCount,
    hasCoordinates,
    hasPhoto: item.hasPhoto,
    hasBusinessCheck: Boolean(item.checkSummary?.count),
    hasUpdatedAt: Boolean(item.dataUpdatedAt),
  });
  const body = (
    <>
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">{identity.eyebrow}</span>
        <span className="badge">{identity.identityLabel}</span>
        <span className="badge">{hasCoordinates ? "지도에서 보기" : "주소로 찾기"}</span>
        <InformationCompletenessBadge summary={completeness} className="rounded-full px-3 py-1 text-xs" />
        <span className="badge">{item.phone ? "전화 가능" : "전화번호 알려주기"}</span>
        {item.businessStatus ? <span className="badge">{item.businessStatus}</span> : null}
        {item.ownerVerified ? <span className="badge bg-[#ecf8f3] text-[#1a463f]">업체 인증</span> : null}
        {checkBadgeLabel ? <span className="badge bg-[#ecfdf5] text-[#047857]">{checkBadgeLabel}</span> : null}
      </div>
      <h3 className="mt-3 text-xl font-black tracking-tight">{displayName}</h3>
      <p className="mt-2 line-clamp-1 text-sm leading-6 text-[#5f5550]">{identity.description}</p>
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
      {completeness.gapLabel ? <p className="mt-2 line-clamp-1 text-xs font-bold text-[#8a6a3f]">{completeness.gapLabel}</p> : null}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-[#7b746d]">
        <span>{externalLabel}</span>
        {item.checkSummary?.latestCheckedAt ? <span>{new Date(item.checkSummary.latestCheckedAt).toLocaleDateString("ko-KR")} 확인</span> : null}
        {hasReview ? <span>{reviewLabel}</span> : null}
      </div>
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
      />
    </article>
  );
}