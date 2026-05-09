"use client";

import { MapPinned, MessageSquarePlus, MessageSquareWarning, Phone } from "lucide-react";
import { DirectionsSheet } from "@/components/detail/DirectionsSheet";
import { SmartLink } from "@/components/SmartLink";
import { trackDetailAction, type DetailActionTargetType } from "@/lib/detail-action-events";

type DetailActionBarProps = {
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  reportHref: string;
  reviewHref?: string;
  mapHref?: string;
  targetType?: DetailActionTargetType;
  targetId?: string;
};

export function DetailActionBar({ name, address, lat, lng, phone, reportHref, reviewHref, mapHref, targetType, targetId }: DetailActionBarProps) {
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;
  const track = (action: Parameters<typeof trackDetailAction>[0]["action"], label: string, href?: string | null) => {
    trackDetailAction({ targetType, targetId, action, label, href });
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {phoneHref ? (
          <a href={phoneHref} onClick={() => track("phone", "전화하기", phoneHref)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white sm:text-sm">
            <Phone size={15} />
            전화하기
          </a>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-[#f7f8f8] px-4 py-2 text-xs font-black text-[var(--muted)] sm:text-sm">
              <Phone size={15} />
              전화번호는 아직 없어요
            </span>
            <SmartLink href={`${reportHref}&topic=phone`} onClick={() => track("phone_report", "전화번호 알려주기", `${reportHref}&topic=phone`)} className="text-xs font-black text-[var(--brand)] underline underline-offset-4">
              전화번호 알려주기
            </SmartLink>
          </div>
        )}

        {mapHref ? (
          <SmartLink href={mapHref} pendingLabel="지도 여는 중..." onClick={() => track("internal_map", "지도에서 보기", mapHref)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--brand)] px-4 py-2 text-xs font-black text-[var(--brand)] sm:text-sm">
            <MapPinned size={15} />
            지도에서 보기
          </SmartLink>
        ) : null}

        <DirectionsSheet name={name} lat={lat} lng={lng} address={address} targetType={targetType} targetId={targetId} />

        {reviewHref ? (
          <SmartLink href={reviewHref} onClick={() => track("review", "후기 남기기", reviewHref)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white sm:text-sm">
            <MessageSquarePlus size={15} />
            후기 남기기
          </SmartLink>
        ) : null}

        <SmartLink href={reportHref} onClick={() => track("report", "정보 수정 요청", reportHref)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)] sm:text-sm">
          <MessageSquareWarning size={15} />
          정보 수정 요청
        </SmartLink>
      </div>
    </div>
  );
}