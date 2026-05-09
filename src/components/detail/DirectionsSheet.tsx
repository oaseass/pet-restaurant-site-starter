"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Map, MapPin, Navigation, X } from "lucide-react";
import { buildNavigationLinks } from "@/lib/navigation-links";
import { trackDetailAction, type DetailActionTargetType } from "@/lib/detail-action-events";

type DirectionsSheetProps = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  targetType?: DetailActionTargetType;
  targetId?: string;
};

const INSTALL_LINKS = {
  kakao: "https://map.kakao.com/",
  google: "https://www.google.com/maps",
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

export function DirectionsSheet({ name, lat, lng, address, targetType, targetId }: DirectionsSheetProps) {
  const links = useMemo(() => buildNavigationLinks({ name, lat, lng, address }), [address, lat, lng, name]);
  const [isOpen, setIsOpen] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const fallbackTimerRef = useRef<number | null>(null);

  const handleCopyAddress = async () => {
    const copied = await copyText(links.copyAddress);
    trackDetailAction({ targetType, targetId, action: "copy_address", label: "주소 복사", href: links.copyAddress });
    setCopyState(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  const trackMap = (action: "kakao_map" | "google_maps" | "naver_map" | "tmap", label: string, href: string | null) => {
    trackDetailAction({ targetType, targetId, action, label, href });
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
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)] opacity-60 sm:text-sm"
        >
          <Navigation size={15} />
          길찾기
        </button>
        <p className="max-w-[260px] text-xs font-bold leading-5 text-[var(--muted)]">주소 정보가 없어 길찾기를 제공할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] sm:text-sm md:hidden"
      >
        <Navigation size={15} />
        길찾기
      </button>

      <div className="hidden flex-wrap gap-2 md:flex">
        {links.webFallbackUrl ? (
          <a href={links.webFallbackUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackMap("kakao_map", "카카오맵", links.webFallbackUrl)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] sm:text-sm">
            <Navigation size={15} />
            카카오맵
          </a>
        ) : null}
        {links.googleMapsUrl ? (
          <a href={links.googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackMap("google_maps", "구글지도", links.googleMapsUrl)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] sm:text-sm">
            <Map size={15} />
            구글지도
          </a>
        ) : null}
        {links.naverWebUrl ? (
          <a href={links.naverWebUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackMap("naver_map", "네이버지도", links.naverWebUrl)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] sm:text-sm">
            <MapPin size={15} />
            네이버지도
          </a>
        ) : null}
        {links.tmapUrl ? (
          <a href={links.tmapUrl} onClick={() => trackMap("tmap", "티맵", links.tmapUrl)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] sm:text-sm">
            <Navigation size={15} />
            티맵
          </a>
        ) : null}
        <button type="button" onClick={handleCopyAddress} disabled={!links.hasAddress} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">
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
              <button type="button" onClick={() => { trackMap("kakao_map", "카카오맵", links.kakaoMapUrl); openApp(links.kakaoMapUrl); }} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                카카오맵
                <Navigation size={16} />
              </button>
              <a href={links.googleMapsUrl ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackMap("google_maps", "구글지도", links.googleMapsUrl)} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                구글지도
                <Map size={16} />
              </a>
              <button type="button" onClick={() => { trackMap("naver_map", "네이버지도", links.naverMapUrl); openApp(links.naverMapUrl); }} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                네이버지도
                <MapPin size={16} />
              </button>
              <button type="button" onClick={() => { trackMap("tmap", "티맵", links.tmapUrl); openApp(links.tmapUrl); }} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)]">
                티맵
                <Navigation size={16} />
              </button>
              <button type="button" onClick={handleCopyAddress} disabled={!links.hasAddress} className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--line)] px-4 text-sm font-black text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50">
                {copyState === "copied" ? "주소가 복사되었습니다" : copyState === "failed" ? "주소를 직접 선택해 복사해 주세요" : "주소 복사"}
                <Copy size={16} />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-[#f6faf7] p-4 text-xs leading-6 text-[var(--muted)]">
              <p className="font-bold text-[var(--ink)]">앱이 열리지 않으면 설치 후 다시 시도하거나 주소를 복사해 주세요.</p>
              <div className="mt-3 flex flex-wrap gap-2 font-black text-[var(--brand)]">
                <a href={INSTALL_LINKS.kakao} target="_blank" rel="noopener noreferrer" className="underline">카카오맵 설치</a>
                <a href={INSTALL_LINKS.google} target="_blank" rel="noopener noreferrer" className="underline">구글지도 열기</a>
                <a href={INSTALL_LINKS.naver} target="_blank" rel="noopener noreferrer" className="underline">네이버지도 설치</a>
                <a href={INSTALL_LINKS.tmap} target="_blank" rel="noopener noreferrer" className="underline">티맵 설치</a>
              </div>
              {showInstallHelp && links.webFallbackUrl ? (
                <a href={links.webFallbackUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-black text-[var(--brand)] underline">
                  웹에서 보기
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}