import { MapPin, Navigation, Phone } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import { SmartLink } from "@/components/SmartLink";
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
  };
}) {
  const mapCategoryKey = item.category === "ANIMAL_HOSPITAL"
    ? "hospitals"
    : item.category === "PHARMACY"
      ? "pharmacy"
      : item.category === "GROOMING"
        ? "grooming"
        : item.category === "DAYCARE"
          ? "daycare"
          : item.category === "FUNERAL"
            ? "funeral"
            : "all";
  const mapHref = item.lat !== null && item.lat !== undefined && item.lng !== null && item.lng !== undefined
    ? `/map?category=${mapCategoryKey}&lat=${item.lat.toFixed(6)}&lng=${item.lng.toFixed(6)}`
    : `/map?category=${mapCategoryKey}&q=${encodeURIComponent(item.name)}`;
  const body = (
    <>
      <div className="flex flex-wrap gap-2">
        <SourceBadge
          label={item.sourceType === "OWNER_SUBMISSION" ? "업체 등록" : item.sourceType === "USER_REPORT" ? "사용자 제보" : item.sourceType === "ADMIN_VERIFIED" ? "관리자 확인" : "공식 데이터"}
          tone={item.sourceType === "OWNER_SUBMISSION" ? "owner" : item.sourceType === "USER_REPORT" ? "user" : item.sourceType === "ADMIN_VERIFIED" ? "admin" : "official"}
        />
        <span className="badge">{item.categoryLabel}</span>
        <span className="badge">{item.lat !== null && item.lat !== undefined ? "지도 가능" : "주소 검색"}</span>
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
      {!item.address && !item.phone ? <p className="mt-3 text-sm leading-7 text-[var(--muted)]">기본 정보는 순차적으로 보강하고 있습니다. 먼저 운영 여부와 위치를 확인해 주세요.</p> : null}
    </>
  );

  if (!item.href) {
    return <article className="card rounded-[1rem] p-5">{body}</article>;
  }

  return (
    <article className="card rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <SmartLink href={item.href} className="block text-[var(--ink)] no-underline">{body}</SmartLink>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
        <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--brand)] px-3 text-xs font-black text-[var(--brand)]">
          <Navigation size={13} />
          지도
        </SmartLink>
        {item.phone ? (
          <a href={`tel:${item.phone.replace(/\s+/g, "")}`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--line)] px-3 text-xs font-black text-[var(--ink)]">
            <Phone size={13} />
            전화
          </a>
        ) : null}
        <SmartLink href={item.href} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 text-xs font-black text-white">
          상세
        </SmartLink>
      </div>
    </article>
  );
}