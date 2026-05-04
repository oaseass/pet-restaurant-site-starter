"use client";

import { useMemo, useState } from "react";
import { Copy, MapPin, MessageSquareWarning, Navigation, Phone } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import { buildNavigationLinks } from "@/lib/navigation-links";

type DetailActionBarProps = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  reportHref: string;
};

function copyText(value: string) {
  if (!value) return Promise.resolve(false);
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value).then(() => true).catch(() => false);
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve(copied);
}

export function DetailActionBar({ name, address, lat, lng, phone, reportHref }: DetailActionBarProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const links = useMemo(() => buildNavigationLinks({ name, lat, lng, address }), [address, lat, lng, name]);
  const hasCoordinates = typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng);
  const mapHref = hasCoordinates
    ? `/map?category=restaurants&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`
    : `/map?category=restaurants&q=${encodeURIComponent(name)}`;
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;

  const handleCopyAddress = async () => {
    const copied = await copyText(links.copyAddress || address);
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1600);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {phoneHref ? (
          <a href={phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            <Phone size={15} />
            전화하기
          </a>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[#f7f8f8] px-5 py-2.5 text-sm font-black text-[var(--muted)]">
            <Phone size={15} />
            전화번호 정보 없음
          </span>
        )}

        <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-black text-[var(--brand)]">
          <Navigation size={15} />
          길찾기
        </SmartLink>

        {links.webFallbackUrl ? (
          <a href={links.webFallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)]">
            <MapPin size={15} />
            카카오맵
          </a>
        ) : null}

        {links.naverWebUrl ? (
          <a href={links.naverWebUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)]">
            <MapPin size={15} />
            네이버지도
          </a>
        ) : null}

        <button type="button" onClick={handleCopyAddress} disabled={!links.hasAddress && !address} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50">
          <Copy size={15} />
          {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사 실패" : "주소 복사"}
        </button>

        <SmartLink href={reportHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--muted)]">
          <MessageSquareWarning size={15} />
          정보 수정 제보
        </SmartLink>
      </div>
    </div>
  );
}