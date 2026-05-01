"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, MapPinned } from "lucide-react";
import { MapBottomSheet } from "@/components/map/MapBottomSheet";
import { MapFallback } from "@/components/map/MapFallback";
import { MapListPanel } from "@/components/map/MapListPanel";
import type { MapCategoryKey, MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";

declare global {
  interface Window {
    kakao?: any;
  }
}

type UserLocation = {
  lat: number;
  lng: number;
};

function useKakaoMapSdk() {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();
  const [status, setStatus] = useState<"unavailable" | "loading" | "ready" | "error">(appKey ? "loading" : "unavailable");

  useEffect(() => {
    if (!appKey) {
      setStatus("unavailable");
      return;
    }

    const onReady = () => {
      if (!window.kakao?.maps?.load) {
        setStatus("error");
        return;
      }

      window.kakao.maps.load(() => setStatus("ready"));
    };

    const onError = () => setStatus("error");
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]');

    if (window.kakao?.maps) {
      onReady();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", onReady, { once: true });
      existingScript.addEventListener("error", onError, { once: true });

      return () => {
        existingScript.removeEventListener("load", onReady);
        existingScript.removeEventListener("error", onError);
      };
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.dataset.kakaoMapSdk = "true";
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", onReady);
      script.removeEventListener("error", onError);
    };
  }, [appKey]);

  return status;
}

function createMarkerImage(color: string) {
  const svg = `<svg width="42" height="54" viewBox="0 0 42 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 53C21 53 38 34.66 38 22.44C38 10.22 30.39 2 21 2C11.61 2 4 10.22 4 22.44C4 34.66 21 53 21 53Z" fill="${color}"/><circle cx="21" cy="22" r="8" fill="white"/><circle cx="21" cy="22" r="4" fill="${color}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildMapAreaCopy({
  activeCategoryLabel,
  activeCategory,
  mapStatus,
  mappableCount,
}: {
  activeCategoryLabel: string;
  activeCategory: MapCategoryKey;
  mapStatus: "unavailable" | "loading" | "ready" | "error";
  mappableCount: number;
}) {
  if (activeCategory !== "restaurants") {
    return {
      title: `${activeCategoryLabel} 지도 슬롯`,
      description: `${activeCategoryLabel} 카테고리는 아직 준비중이라 실제 핀 대신 지도 레이아웃만 먼저 보여줍니다. 현재 공개 운영은 식당 지도에 집중합니다.`,
    };
  }

  if (mapStatus === "error") {
    return {
      title: "지도 데이터 표시 영역",
      description: "지도 스크립트를 불러오지 못해도 내부 DB 기반 리스트와 위치 분포를 자연스럽게 이어서 보여줍니다.",
    };
  }

  if (mapStatus === "unavailable") {
    return {
      title: "지도 데이터 표시 영역",
      description: "지도 키가 없는 환경에서도 화면이 깨지지 않도록 내부 DB 좌표 분포와 선택 정보를 이 영역에 정돈해 보여줍니다.",
    };
  }

  if (mappableCount === 0) {
    return {
      title: "좌표 기반 핀 대기 영역",
      description: "현재 필터 결과에는 좌표가 있는 식당이 없어 리스트를 중심으로 탐색합니다. 좌표가 준비되면 이 영역에 핀이 자동으로 반영됩니다.",
    };
  }

  return {
    title: "지도 데이터 표시 영역",
    description: "내부 DB에 저장된 좌표를 기준으로 핀을 올리고, 좌표가 없는 식당은 리스트에서만 안전하게 보여줍니다.",
  };
}

export function MapShell({
  items,
  activeCategory,
  activeCategoryLabel,
  filteredCount,
  visibleCount,
  coordinateReadyCount,
  coordinatePendingCount,
  preparedState,
  emptyState,
}: {
  items: MapRestaurantListItem[];
  activeCategory: MapCategoryKey;
  activeCategoryLabel: string;
  filteredCount: number;
  visibleCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  preparedState?: PreparedCategoryState;
  emptyState?: { title: string; description: string; href: string; hrefLabel: string };
}) {
  const mapStatus = useKakaoMapSdk();
  const desktopMapRef = useRef<HTMLDivElement | null>(null);
  const mobileMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(items.find((item) => item.coordinateStatus === "ready")?.id ?? items[0]?.id ?? null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error" | "unsupported">("idle");
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  const mappableItems = useMemo(
    () => items.filter((item) => item.coordinateStatus === "ready" && item.lat !== null && item.lng !== null),
    [items],
  );
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId(items.find((item) => item.coordinateStatus === "ready")?.id ?? items[0]?.id ?? null);
  }, [items]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsDesktopViewport(event?.matches ?? mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    const activeMapElement = isDesktopViewport ? desktopMapRef.current : mobileMapRef.current;
    if (mapStatus !== "ready" || !activeMapElement || !window.kakao?.maps) return;

    const kakao = window.kakao;
    const center = new kakao.maps.LatLng(36.35, 127.9);
    const map = new kakao.maps.Map(activeMapElement, {
      center,
      level: 12,
      draggable: true,
      scrollwheel: true,
    });

    mapInstanceRef.current = map;

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      if (desktopMapRef.current) {
        desktopMapRef.current.innerHTML = "";
      }
      if (mobileMapRef.current) {
        mobileMapRef.current.innerHTML = "";
      }
      mapInstanceRef.current = null;
    };
  }, [isDesktopViewport, mapStatus]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapInstanceRef.current || !window.kakao?.maps) return;

    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    const bounds = new kakao.maps.LatLngBounds();
    let hasBounds = false;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    for (const item of mappableItems) {
      const position = new kakao.maps.LatLng(item.lat, item.lng);
      const marker = new kakao.maps.Marker({
        position,
        image: new kakao.maps.MarkerImage(createMarkerImage("#1a463f"), new kakao.maps.Size(42, 54), {
          offset: new kakao.maps.Point(21, 54),
        }),
      });

      marker.setMap(map);
      kakao.maps.event.addListener(marker, "click", () => setSelectedId(item.id));
      markerRefs.current.push(marker);
      bounds.extend(position);
      hasBounds = true;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const position = new kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      userMarkerRef.current = new kakao.maps.Marker({
        position,
        image: new kakao.maps.MarkerImage(createMarkerImage("#ff9248"), new kakao.maps.Size(42, 54), {
          offset: new kakao.maps.Point(21, 54),
        }),
      });
      userMarkerRef.current.setMap(map);
      bounds.extend(position);
      hasBounds = true;
    }

    if (hasBounds) {
      map.setBounds(bounds, 60, 60, 60, 60);
    }
  }, [mapStatus, mappableItems, userLocation]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapInstanceRef.current || !window.kakao?.maps || !selectedItem?.lat || !selectedItem.lng) return;
    mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(selectedItem.lat, selectedItem.lng));
  }, [mapStatus, selectedItem]);

  const mapAreaCopy = buildMapAreaCopy({
    activeCategoryLabel,
    activeCategory,
    mapStatus,
    mappableCount: mappableItems.length,
  });
  const shouldUseFallback = activeCategory !== "restaurants" || mapStatus !== "ready" || mappableItems.length === 0;

  const locationButtonLabel = locationStatus === "loading"
    ? "위치 확인 중"
    : locationStatus === "ready"
      ? "현재 위치 적용됨"
      : locationStatus === "unsupported"
        ? "현재 위치 미지원"
        : locationStatus === "error"
          ? "위치 재시도"
          : "현재 위치";

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <section className="mt-6">
      <div className="hidden gap-5 lg:grid lg:grid-cols-[380px_minmax(0,1fr)]">
        <MapListPanel
          title="식당 리스트"
          subtitle="지도에 바로 올릴 수 있는 식당과 좌표 준비중 식당을 한 화면에서 함께 봅니다."
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filteredCount={filteredCount}
          visibleCount={visibleCount}
          coordinateReadyCount={coordinateReadyCount}
          coordinatePendingCount={coordinatePendingCount}
          preparedState={preparedState}
          emptyState={emptyState}
        />

        <section className="section-shell min-h-[760px] p-5 lg:sticky lg:top-[118px]">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f7f73]">Map Stage</p>
              <h2 className="mt-3 text-[1.85rem] font-black tracking-tight text-[#1f1915]">{activeCategoryLabel} 지도</h2>
            </div>
            <button type="button" onClick={requestUserLocation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(28,28,28,0.08)] bg-white/88 px-4 py-2 text-sm font-black text-[#1f1915] shadow-[0_16px_30px_rgba(39,30,24,0.08)]">
              <Crosshair size={16} />
              {locationButtonLabel}
            </button>
          </div>

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[rgba(28,28,28,0.08)] bg-white/82 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">선택 카테고리</p>
              <p className="mt-2 text-lg font-black text-[#1f1915]">{activeCategoryLabel}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(28,28,28,0.08)] bg-[#e9f8f2] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">핀 표시</p>
              <p className="mt-2 text-lg font-black text-[#1f1915]">{coordinateReadyCount.toLocaleString("ko-KR")}곳</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(28,28,28,0.08)] bg-[#fff1e6] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">좌표 준비중</p>
              <p className="mt-2 text-lg font-black text-[#1f1915]">{coordinatePendingCount.toLocaleString("ko-KR")}곳</p>
            </div>
          </div>

          <div className="relative z-10 mt-5 overflow-hidden rounded-[1.9rem] border border-[rgba(28,28,28,0.08)] bg-white/74 shadow-[0_20px_42px_rgba(35,26,22,0.08)]">
            <div className="h-[620px] w-full">
              {shouldUseFallback ? (
                <MapFallback
                  items={items}
                  selectedItem={selectedItem}
                  title={mapAreaCopy.title}
                  description={mapAreaCopy.description}
                  coordinateReadyCount={coordinateReadyCount}
                  coordinatePendingCount={coordinatePendingCount}
                  activeCategoryLabel={activeCategoryLabel}
                />
              ) : (
                <div ref={desktopMapRef} className="h-full w-full bg-[linear-gradient(180deg,rgba(249,246,241,0.96),rgba(244,238,230,0.92))]" />
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 rounded-[1.6rem] border border-[rgba(28,28,28,0.08)] bg-[#1f2624] p-4 text-white shadow-[0_18px_36px_rgba(22,27,25,0.18)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f4bf90]">
              <MapPinned size={15} />
              현재 선택 정보
            </div>
            {selectedItem ? (
              <div className="mt-3">
                <p className="text-lg font-black">{selectedItem.name}</p>
                <p className="mt-1 text-sm font-bold text-[#f1d2b4]">{selectedItem.businessType}</p>
                <p className="mt-2 text-sm leading-7 text-[#d7cfc6]">{selectedItem.address}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#d7cfc6]">리스트에서 항목을 고르면 이 영역에 선택 정보가 표시됩니다.</p>
            )}
          </div>
        </section>
      </div>

      <div className="lg:hidden">
        <section className="section-shell overflow-hidden p-4">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f7f73]">Map Stage</p>
              <h2 className="mt-2 text-[1.6rem] font-black tracking-tight text-[#1f1915]">{activeCategoryLabel} 지도</h2>
            </div>
            <button type="button" onClick={requestUserLocation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(28,28,28,0.08)] bg-white/88 px-4 py-2 text-sm font-black text-[#1f1915] shadow-[0_16px_30px_rgba(39,30,24,0.08)]">
              <Crosshair size={16} />
              {locationButtonLabel}
            </button>
          </div>

          <div className="relative z-10 mt-4 flex gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 rounded-full bg-[#e9f8f2] px-3 py-1.5 text-xs font-black text-[#1a463f]">핀 {coordinateReadyCount.toLocaleString("ko-KR")}</span>
            <span className="shrink-0 rounded-full bg-[#fff1e6] px-3 py-1.5 text-xs font-black text-[#b9632e]">좌표 준비중 {coordinatePendingCount.toLocaleString("ko-KR")}</span>
            <span className="shrink-0 rounded-full bg-white/84 px-3 py-1.5 text-xs font-black text-[#5f5750]">표시 {visibleCount.toLocaleString("ko-KR")}건</span>
          </div>

          <div className="relative z-10 mt-4 overflow-hidden rounded-[1.8rem] border border-[rgba(28,28,28,0.08)] bg-white/80 shadow-[0_20px_42px_rgba(35,26,22,0.08)]">
            <div className="h-[42vh] min-h-[320px] w-full">
              {shouldUseFallback ? (
                <MapFallback
                  items={items}
                  selectedItem={selectedItem}
                  title={mapAreaCopy.title}
                  description={mapAreaCopy.description}
                  coordinateReadyCount={coordinateReadyCount}
                  coordinatePendingCount={coordinatePendingCount}
                  activeCategoryLabel={activeCategoryLabel}
                />
              ) : (
                <div ref={mobileMapRef} className="h-full w-full bg-[linear-gradient(180deg,rgba(249,246,241,0.96),rgba(244,238,230,0.92))]" />
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 rounded-[1.5rem] bg-[#1f2624] p-4 text-white shadow-[0_18px_36px_rgba(22,27,25,0.18)]">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f4bf90]">
              <MapPinned size={15} />
              현재 선택 정보
            </div>
            {selectedItem ? (
              <div className="mt-3">
                <p className="text-lg font-black">{selectedItem.name}</p>
                <p className="mt-1 text-sm font-bold text-[#f1d2b4]">{selectedItem.businessType}</p>
                <p className="mt-2 text-sm leading-7 text-[#d7cfc6]">{selectedItem.address}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#d7cfc6]">지도를 누르거나 리스트에서 항목을 선택하면 이 영역에 현재 선택이 반영됩니다.</p>
            )}
          </div>
        </section>

        <MapBottomSheet
          open={bottomSheetOpen}
          onToggle={() => setBottomSheetOpen((current) => !current)}
          items={items}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setBottomSheetOpen(true);
          }}
          filteredCount={filteredCount}
          coordinateReadyCount={coordinateReadyCount}
          coordinatePendingCount={coordinatePendingCount}
          preparedState={preparedState}
          emptyState={emptyState}
        />
      </div>
    </section>
  );
}