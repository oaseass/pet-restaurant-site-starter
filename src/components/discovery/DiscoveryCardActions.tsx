"use client";

import { ExternalLink, MapPinned, MessageSquarePlus, Phone } from "lucide-react";
import clsx from "clsx";
import { SmartLink } from "@/components/SmartLink";

type DiscoveryCardActionsProps = {
  detailHref: string;
  mapHref?: string | null;
  onMapSelect?: () => void;
  phone?: string | null;
  externalHref?: string | null;
  reviewHref?: string | null;
  mapLabel?: string;
  detailLabel?: string;
  externalLabel?: string;
  reviewLabel?: string;
  phoneUnavailableLabel?: string;
  className?: string;
};

const baseActionClassName = "inline-flex min-h-9 items-center justify-center gap-1 rounded-full px-3 text-xs font-black no-underline";

function sanitizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
}

export function DiscoveryCardActions({
  detailHref,
  mapHref,
  onMapSelect,
  phone,
  externalHref,
  reviewHref,
  mapLabel = "지도에서 보기",
  detailLabel = "자세히 보기",
  externalLabel = "카카오에서 보기",
  reviewLabel = "후기 남기기",
  phoneUnavailableLabel = "전화번호 알려주기",
  className,
}: DiscoveryCardActionsProps) {
  const cleanedPhone = phone?.trim();

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {onMapSelect ? (
        <button
          type="button"
          onClick={onMapSelect}
          className={clsx(baseActionClassName, "border border-[var(--brand)] bg-white text-[var(--brand)]")}
        >
          <MapPinned size={13} />
          {mapLabel}
        </button>
      ) : mapHref ? (
        <SmartLink
          href={mapHref}
          pendingLabel="지도 여는 중..."
          className={clsx(baseActionClassName, "border border-[var(--brand)] bg-white text-[var(--brand)]")}
        >
          <MapPinned size={13} />
          {mapLabel}
        </SmartLink>
      ) : null}

      {cleanedPhone ? (
        <a href={`tel:${sanitizePhone(cleanedPhone)}`} className={clsx(baseActionClassName, "border border-[var(--line)] bg-white text-[var(--ink)]")}>
          <Phone size={13} />
          전화
        </a>
      ) : (
        <span className={clsx(baseActionClassName, "border border-[var(--line)] bg-[#f8f8f7] text-[var(--muted)]")}>
          <Phone size={13} />
          {phoneUnavailableLabel}
        </span>
      )}

      {externalHref ? (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(baseActionClassName, "border border-[var(--line)] bg-white text-[var(--ink)]")}
        >
          {externalLabel}
          <ExternalLink size={13} />
        </a>
      ) : null}

      {reviewHref ? (
        <SmartLink href={reviewHref} className={clsx(baseActionClassName, "border border-[var(--line)] bg-white text-[var(--ink)]")}>
          <MessageSquarePlus size={13} />
          {reviewLabel}
        </SmartLink>
      ) : null}

      <SmartLink href={detailHref} className={clsx(baseActionClassName, "bg-[var(--ink)] text-white")}>
        {detailLabel}
      </SmartLink>
    </div>
  );
}