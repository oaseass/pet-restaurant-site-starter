"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SmartLink } from "@/components/SmartLink";

type DetailMapCardProps = {
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapHref: string;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
};

type LeafletApi = {
  map: (container: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: { attribution: string }) => { addTo: (map: unknown) => void };
  marker: (latLng: [number, number]) => { addTo: (map: unknown) => unknown };
};

function getLeaflet() {
  return (window as typeof window & { L?: LeafletApi }).L;
}

function useLeafletScript(enabled: boolean) {
  const [status, setStatus] = useState<"idle" | "ready" | "error">(enabled ? "idle" : "ready");

  useEffect(() => {
    if (!enabled) {
      setStatus("ready");
      return;
    }

    if (getLeaflet()) {
      setStatus("ready");
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-map="true"]');
    const existingStyle = document.querySelector<HTMLLinkElement>('link[data-leaflet-map="true"]');
    const onLoad = () => setStatus("ready");
    const onError = () => setStatus("error");

    if (existingScript && existingStyle) {
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return () => {
        existingScript.removeEventListener("load", onLoad);
        existingScript.removeEventListener("error", onError);
      };
    }

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    style.dataset.leafletMap = "true";
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.leafletMap = "true";
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [enabled]);

  return status;
}

function buildKakaoMapHref({ name, address, lat, lng }: DetailMapCardProps) {
  const destinationName = name.trim() || "목적지";
  if (typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng)) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(destinationName)},${lat.toFixed(6)},${lng.toFixed(6)}`;
  }

  const query = [destinationName, address?.trim()].filter(Boolean).join(" ");
  return `https://map.kakao.com/link/search/${encodeURIComponent(query || destinationName)}`;
}

export function DetailMapCard({ name, address, lat, lng, mapHref }: DetailMapCardProps) {
  const hasCoordinates = typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng);
  const mapStatus = useLeafletScript(hasCoordinates);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const kakaoMapHref = buildKakaoMapHref({ name, address, lat, lng, mapHref });

  useEffect(() => {
    const leaflet = getLeaflet();
    if (!hasCoordinates || mapStatus !== "ready" || !mapRef.current || !leaflet) return;

    const map = leaflet.map(mapRef.current, { scrollWheelZoom: false }).setView([lat as number, lng as number], 15);
    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    leaflet.marker([lat as number, lng as number]).addTo(map);

    return () => map.remove();
  }, [hasCoordinates, lat, lng, mapStatus]);

  return (
    <section className="mt-6 overflow-hidden rounded-[1rem] border border-[var(--line)] bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[280px] bg-[#f4f7f5]">
          {hasCoordinates ? (
            <>
              <div ref={mapRef} className="h-[280px] w-full" />
              {mapStatus === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#f6faf7] p-6 text-center">
                  <MapPin size={28} color="var(--brand)" />
                  <p className="text-sm font-black text-[var(--ink)]">지도를 불러오지 못했습니다.</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 p-6 text-center">
              <MapPin size={30} color="var(--brand)" />
              <p className="text-base font-black text-[var(--ink)]">좌표를 정리 중이에요</p>
              <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">주소 기준으로 지도 검색을 열 수 있습니다.</p>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--line)] p-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">위치</p>
          <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--ink)]">{name}</h2>
          {address ? <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{address}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <SmartLink href={mapHref} pendingLabel="지도 여는 중..." className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">
              <MapPin size={14} />
              큰 지도 보기
            </SmartLink>
            <a href={kakaoMapHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
              <ExternalLink size={14} />
              카카오맵
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}