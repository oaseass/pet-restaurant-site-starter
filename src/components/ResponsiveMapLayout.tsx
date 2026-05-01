"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type MapItem = {
  id: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  categoryLabel?: string;
  href?: string;
};

declare global {
  interface Window {
    L?: {
      map: (container: HTMLElement) => {
        setView: (center: [number, number], zoom: number) => unknown;
        fitBounds: (bounds: [number, number][]) => void;
        remove: () => void;
        eachLayer: (callback: (layer: unknown) => void) => void;
        removeLayer: (layer: unknown) => void;
      };
      tileLayer: (url: string, options: { attribution: string }) => { addTo: (map: unknown) => void };
      marker: (latLng: [number, number]) => {
        addTo: (map: unknown) => { on: (event: string, handler: () => void) => void };
        on: (event: string, handler: () => void) => void;
      };
    };
  }
}

function useLeafletScript() {
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

  useEffect(() => {
    if (window.L) {
      setStatus("ready");
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-map="true"]');
    const existingStyle = document.querySelector<HTMLLinkElement>('link[data-leaflet-map="true"]');

    if (existingScript && existingStyle) {
      existingScript.addEventListener("load", () => setStatus("ready"), { once: true });
      existingScript.addEventListener("error", () => setStatus("error"), { once: true });
      return;
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
    script.addEventListener("load", () => setStatus("ready"), { once: true });
    script.addEventListener("error", () => setStatus("error"), { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("error", () => setStatus("error"));
      script.removeEventListener("load", () => setStatus("ready"));
    };
  }, []);

  return status;
}

export function ResponsiveMapLayout({
  sidebar,
  title,
  description,
  items,
}: {
  sidebar: ReactNode;
  title: string;
  description: string;
  items: MapItem[];
}) {
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const mapStatus = useLeafletScript();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<{ remove: () => void; setView: (center: [number, number], zoom: number) => unknown } | null>(null);
  const mappableItems = items.filter((item) => typeof item.lat === "number" && typeof item.lng === "number");
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    if (selectedId || !items[0]?.id) return;
    setSelectedId(items[0].id);
  }, [items, selectedId]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !window.L) return;

    mapInstanceRef.current?.remove();

    const map = window.L.map(mapRef.current);
    map.setView([36.35, 127.9], mappableItems.length > 1 ? 7 : 8);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    if (mappableItems.length > 0) {
      const bounds = mappableItems.map((item) => [item.lat as number, item.lng as number] as [number, number]);
      map.fitBounds(bounds);

      for (const item of mappableItems) {
        const marker = window.L.marker([item.lat as number, item.lng as number]).addTo(map);
        marker.on("click", () => setSelectedId(item.id));
      }
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStatus, mappableItems, selectedItem]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedItem?.lat || !selectedItem.lng) return;
    mapInstanceRef.current.setView([selectedItem.lat, selectedItem.lng], 8);
  }, [selectedItem]);

  return (
    <section>
      <div className="mb-4 flex gap-2 md:hidden">
        <button type="button" onClick={() => setMobileView("list")} className={`flex-1 rounded-full px-4 py-3 text-sm font-black ${mobileView === "list" ? "bg-[var(--brand)] text-white" : "bg-white/70 text-[#5f5550]"}`.trim()}>
          리스트
        </button>
        <button type="button" onClick={() => setMobileView("map")} className={`flex-1 rounded-full px-4 py-3 text-sm font-black ${mobileView === "map" ? "bg-[var(--brand)] text-white" : "bg-white/70 text-[#5f5550]"}`.trim()}>
          지도
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
        <div className={mobileView === "map" ? "hidden md:block" : "space-y-4"}>{sidebar}</div>
        <aside className={mobileView === "list" ? "hidden md:block" : "section-shell min-h-[420px] p-5"}>
          <div className="relative z-10 flex h-full flex-col rounded-[1.8rem] border border-[rgba(56,41,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(243,239,234,0.9))] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Live Map</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-[#665950]">{description}</p>
            <div className="mt-5 flex-1 overflow-hidden rounded-[1.5rem] border border-[rgba(56,41,29,0.1)] bg-white/70">
              <div ref={mapRef} className="h-[360px] w-full bg-[radial-gradient(circle_at_20%_20%,rgba(189,237,220,0.45),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(255,184,107,0.35),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,244,238,0.95))]" />
              <div className="border-t border-[rgba(56,41,29,0.08)] p-4 text-sm leading-7 text-[#665950]">
                {mapStatus === "error" ? (
                  <p>지도 SDK를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
                ) : mappableItems.length === 0 ? (
                  <p>현재 저장된 좌표 데이터가 없어 목록 중심으로 보여주고 있습니다. 다음 배치 동기화에서 공식 파일 좌표 또는 서버 지오코딩이 반영되면 지도 마커가 나타납니다.</p>
                ) : selectedItem ? (
                  <div>
                    <p className="font-black text-[var(--ink)]">{selectedItem.name}</p>
                    <p className="mt-1">{selectedItem.categoryLabel ?? "장소"}</p>
                    {selectedItem.address ? <p className="mt-1">{selectedItem.address}</p> : null}
                  </div>
                ) : (
                  <p>지도의 마커를 누르거나 왼쪽 리스트를 선택하면 현재 선택 장소 정보가 여기 표시됩니다.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}