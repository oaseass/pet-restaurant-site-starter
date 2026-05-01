import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
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
    sido?: string | null;
    sigungu?: string | null;
    ownerVerified?: boolean;
    sourceType?: SourceType;
    category?: PlaceCategory;
  };
}) {
  const body = (
    <>
      <div className="flex flex-wrap gap-2">
        <SourceBadge
          label={item.sourceType === "OWNER_SUBMISSION" ? "업체 등록" : item.sourceType === "USER_REPORT" ? "사용자 제보" : item.sourceType === "ADMIN_VERIFIED" ? "관리자 확인" : "공식 데이터"}
          tone={item.sourceType === "OWNER_SUBMISSION" ? "owner" : item.sourceType === "USER_REPORT" ? "user" : item.sourceType === "ADMIN_VERIFIED" ? "admin" : "official"}
        />
        <span className="badge">{item.categoryLabel}</span>
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

  return <Link href={item.href} className="card block rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">{body}</Link>;
}