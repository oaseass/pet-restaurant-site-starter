"use client";

import { MapPinned, MessageSquarePlus, MessageSquareWarning, Phone } from "lucide-react";
import { DirectionsSheet } from "@/components/detail/DirectionsSheet";
import { SmartLink } from "@/components/SmartLink";

type DetailActionBarProps = {
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  reportHref: string;
  reviewHref?: string;
  mapHref?: string;
};

export function DetailActionBar({ name, address, lat, lng, phone, reportHref, reviewHref, mapHref }: DetailActionBarProps) {
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {phoneHref ? (
          <a href={phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            <Phone size={15} />
            전화하기
          </a>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[#f7f8f8] px-5 py-2.5 text-sm font-black text-[var(--muted)]">
              <Phone size={15} />
              전화번호는 아직 없어요
            </span>
            <SmartLink href={`${reportHref}&topic=phone`} className="text-xs font-black text-[var(--brand)] underline underline-offset-4">
              전화번호 알려주기
            </SmartLink>
          </div>
        )}

        {mapHref ? (
          <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-black text-[var(--brand)]">
            <MapPinned size={15} />
            지도에서 보기
          </SmartLink>
        ) : null}

        <DirectionsSheet name={name} lat={lat} lng={lng} address={address} />

        {reviewHref ? (
          <SmartLink href={reviewHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            <MessageSquarePlus size={15} />
            후기 남기기
          </SmartLink>
        ) : null}

        <SmartLink href={reportHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--muted)]">
          <MessageSquareWarning size={15} />
          정보 수정 요청
        </SmartLink>
      </div>
    </div>
  );
}