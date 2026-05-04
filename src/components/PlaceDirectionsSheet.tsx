"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, MapPin, Navigation, X } from "lucide-react";
import { buildNavigationLinks } from "@/lib/navigation-links";

type PlaceDirectionsSheetProps = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

const INSTALL_LINKS = {
  kakao: "https://map.kakao.com/",
  naver: "https://map.naver.com/",
  tmap: "https://www.tmap.co.kr/",
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

export function PlaceDirectionsSheet({ name, lat, lng, address }: PlaceDirectionsSheetProps) {
  const links = useMemo(() => buildNavigationLinks({ name, lat, lng, address }), [address, lat, lng, name]);
  const [isOpen, setIsOpen] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const fallbackTimerRef = useRef<number | null>(null);

  const disabledMessage = "주소 정보가 없어 길찾기를 제공할 수 없습니다.";

  const handleCopyAddress = async () => {
    const copied = await copyText(links.copyAddress);
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1600);
  };

  const openApp = (url: string | null) => {
    if (!url) return;
    setShowInstallHelp(false);
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = window.setTimeout(() => {
      if (!document.hidden) setShowInstallHelp(true);
    }, 1200);
    window.location.href = url;
  };

  if (!links.canNavigate) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--muted)] opacity-60"
        >
          <Navigation size={15} />
          길찾기
        </button>
        <p className="max-w-[260px] text-xs font-bold leading-5 text-[var(--muted)]">{disabledMessage}</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)] md:hidden"
      >
        <Navigation size={15} />
        길찾기
      </button>

      <div className="hidden flex-wrap gap-3 md:flex">
        {links.webFallbackUrl ? (
          <a
            href={links.webFallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)]"
          >
            <Navigation size={15} />
            카카오맵 보기
          </a>
        ) : null}
        {links.naverWebUrl ? (
          <a
            href={links.naverWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)]"
          >
            <MapPin size={15} />
            네이버지도 검색
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleCopyAddress}
          disabled={!links.hasAddress}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy size={15} />
          {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사 실패" : "주소 복사"}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="길찾기 선택">
          <button type="button" aria-label="길찾기 닫기" className="absolute inset-0 bg-black/45" onClick={() => setIsOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.25rem] bg-white p-5 shadow-[0_-12px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">길찾기</p>
                <h2 className="mt-2 text-lg font-black leading-snug text-[var(--ink)]">{name}</h2>
                {links.copyAddress ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{links.copyAddress}</p> : null}
              </div>
              <button type="button" aria-label="닫기" onClick={() => setIsOpen(false)} className="rounded-full border border-[var(--line)] p-2 text-[var(--muted)]">
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              <button type="button" onClick={() => openApp(links.kakaoMapUrl)} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                카카오맵
                <Navigation size={16} />
              </button>
              <button type="button" onClick={() => openApp(links.naverMapUrl)} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                네이버지도
                <MapPin size={16} />
              </button>
              <button type="button" onClick={() => openApp(links.tmapUrl)} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                티맵
                <Navigation size={16} />
              </button>
              <button
                type="button"
                onClick={handleCopyAddress}
                disabled={!links.hasAddress}
                className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copyState === "copied" ? "주소가 복사되었습니다" : copyState === "failed" ? "주소 복사 실패" : "주소 복사"}
                <Copy size={16} />
              </button>
            </div>

            {showInstallHelp ? (
              <div className="mt-4 rounded-xl bg-[#f6faf7] p-4 text-xs leading-6 text-[var(--muted)]">
                <p className="font-bold text-[var(--ink)]">앱이 열리지 않으면 설치 후 다시 시도하거나 주소를 복사해 주세요.</p>
                <div className="mt-3 flex flex-wrap gap-2 font-black text-[var(--brand)]">
                  <a href={INSTALL_LINKS.kakao} target="_blank" rel="noopener noreferrer" className="underline">카카오맵/카카오내비 설치</a>
                  <a href={INSTALL_LINKS.naver} target="_blank" rel="noopener noreferrer" className="underline">네이버지도 설치</a>
                  <a href={INSTALL_LINKS.tmap} target="_blank" rel="noopener noreferrer" className="underline">티맵 설치</a>
                </div>
                {links.webFallbackUrl ? (
                  <a href={links.webFallbackUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-black text-[var(--brand)] underline">
                    웹에서 보기
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}