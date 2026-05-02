"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, MapPin, MapPinned } from "lucide-react";
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

function useKakaoMapSdk(enabled: boolean) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();
  const [status, setStatus] = useState<"not-requested" | "unavailable" | "loading" | "ready" | "error">(
    !enabled ? "not-requested" : appKey ? "loading" : "unavailable",
  );

  useEffect(() => {
    if (!enabled) {
      setStatus("not-requested");
      return;
    }
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
  }, [appKey, enabled]);

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
  mapStatus: "not-requested" | "unavailable" | "loading" | "ready" | "error";
  mappableCount: number;
}) {
  if (activeCategory === "lost-pets") {
    return {
      title: "찾아요는 지도를 지원하지 않습니다.",
      description: "보호동물 공고와 실종 제보는 찾아요 페이지에서 확인하세요.",
    };
  }

  if (mapStatus === "error") {
    return {
      title: "지도를 불러오지 못했습니다.",
      description: "잠시 후 다시 시도하거나 아래 목록에서 먼저 식당을 확인해 주세요.",
    };
  }

  if (mapStatus === "unavailable") {
    return {
      title: "지도를 준비 중입니다.",
      description: "아래 목록에서 먼저 식당을 확인해 주세요.",
    };
  }

  if (mappableCount === 0) {
    return {
      title: "식당 지도",
      description: "목록에서 식당을 선택하면 위치를 확인할 수 있습니다.",
    };
  }

  return {
    title: "식당 지도",
    description: "지도에 마커가 표시된 식당을 목록에서 선택하세요.",
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
  shouldLoadMap,
  preparedState,
  emptyState,
  initialUserLocation,
}: {
  items: MapRestaurantListItem[];
  activeCategory: MapCategoryKey;
  activeCategoryLabel: string;
  filteredCount: number;
  visibleCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  shouldLoadMap?: boolean;
  preparedState?: PreparedCategoryState;
  emptyState?: { title: string; description: string; href: string; hrefLabel: string };
  initialUserLocation?: { lat: number; lng: number };
}) {
  const mapStatus = useKakaoMapSdk(shouldLoadMap ?? true);
  const desktopMapRef = useRef<HTMLDivElement | null>(null);
  const mobileMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(items.find((item) => item.coordinateStatus === "ready")?.id ?? items[0]?.id ?? null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(initialUserLocation ?? null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error" | "unsupported">(initialUserLocation ? "ready" : "idle");
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
    // 현재 위치가 있으면 그 좌표로 center, 없으면 한국 중심
    const initialCenter = userLocation
      ? new kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      : new kakao.maps.LatLng(36.35, 127.9);
    const initialLevel = userLocation ? 8 : 12;

    const map = new kakao.maps.Map(activeMapElement, {
      center: initialCenter,
      level: initialLevel,
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
  const shouldUseFallback =
    activeCategory === "lost-pets" ||
    mapStatus === "error" ||
    mapStatus === "unavailable";
  // mapStatus === "loading": 스켈레톤 표시 (실제 지도 div 유지)
  // mapStatus === "ready": 실제 카카오맵 표시
  // error/unavailable만 fallback

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
          title={activeCategory === "all" ? "전체 장소" : `${activeCategoryLabel} 목록`}
          subtitle={
            activeCategory === "all"
              ? "현재 위치 기준 식당, 병원, 약국, 미용, 유치원·호텔, 장례 정보를 함께 보여드립니다."
              : `지도로 볼 수 있는 ${activeCategoryLabel}와 목록으로 먼저 확인할 ${activeCategoryLabel}을 함께 보여드립니다.`
          }
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

        <section className="section-shell min-h-[760px] p-4 lg:sticky lg:top-[92px]">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">지도</p>
              <h2 className="mt-3 text-[1.85rem] font-black tracking-tight text-[var(--ink)]">{activeCategoryLabel} 지도</h2>
            </div>
            <button type="button" onClick={requestUserLocation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--ink)]">
              <Crosshair size={16} />
              {locationButtonLabel}
            </button>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <span className="badge">{activeCategoryLabel}</span>
            {coordinateReadyCount > 0 && (
              <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">지도 {coordinateReadyCount.toLocaleString("ko-KR")}건</span>
            )}
          </div>

          <div className="relative z-10 mt-5 overflow-hidden rounded-[1.125rem] border border-[var(--line)] bg-white shadow-[0_8px_24px_rgba(23,23,23,0.06)]">
            <div className="h-[620px] w-full">
              {mapStatus === "not-requested" ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f6faf7] p-8">
                  <MapPin size={32} color="var(--brand)" />
                  <p className="text-center text-[16px] font-black text-[var(--ink)]">지도 검색</p>
                  <p className="text-center text-sm leading-6 text-[var(--muted)]">
                    검색어나 지역을 입력하면<br />지도가 열립니다.
                  </p>
                </div>
              ) : shouldUseFallback ? (
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
                <div ref={desktopMapRef} className="h-full w-full bg-[#f4f7f5]" />
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 rounded-[1rem] border border-[var(--line)] bg-white p-4 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
            <div className="flex items-center gap-2 text-[11px] font-black text-[var(--muted)]">
              <MapPinned size={15} />
              현재 선택 정보
            </div>
            {selectedItem ? (
              <div className="mt-3">
                <p className="text-lg font-black text-[var(--ink)]">{selectedItem.name}</p>
                <p className="mt-1 text-sm font-bold text-[var(--brand)]">{selectedItem.businessType}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{selectedItem.address}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">리스트에서 장소를 고르면 이 영역에 위치 정보가 표시됩니다.</p>
            )}
          </div>
        </section>
      </div>

      <div className="lg:hidden">
        <section className="section-shell overflow-hidden p-4">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">지도</p>
              <h2 className="mt-2 text-[1.6rem] font-black tracking-tight text-[var(--ink)]">{activeCategoryLabel} 지도</h2>
            </div>
            <button type="button" onClick={requestUserLocation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--ink)]">
              <Crosshair size={16} />
              {locationButtonLabel}
            </button>
          </div>

          <div className="relative z-10 mt-4 flex gap-2 overflow-x-auto pb-1">
            {coordinateReadyCount > 0 && (
              <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand)]">지도 {coordinateReadyCount.toLocaleString("ko-KR")}건</span>
            )}
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[var(--muted)]">목록 {visibleCount.toLocaleString("ko-KR")}건</span>
          </div>

          <div className="relative z-10 mt-4 overflow-hidden rounded-[1rem] border border-[var(--line)] bg-white shadow-[0_8px_24px_rgba(23,23,23,0.06)]">
            <div className="h-[42vh] min-h-[320px] w-full">
              {mapStatus === "not-requested" ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f6faf7] p-6">
                  <MapPin size={28} color="var(--brand)" />
                  <p className="text-center text-[15px] font-black text-[var(--ink)]">지도 검색</p>
                  <p className="text-center text-sm leading-6 text-[var(--muted)]">
                    검색어나 지역을 입력하면 지도가 열립니다.
                  </p>
                </div>
              ) : shouldUseFallback ? (
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
                <div ref={mobileMapRef} className="h-full w-full bg-[#f4f7f5]" />
              )}
            </div>
          </div>

          <div className="relative z-10 mt-4 rounded-[1rem] border border-[var(--line)] bg-white p-4 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
            <div className="flex items-center gap-2 text-[11px] font-black text-[var(--muted)]">
              <MapPinned size={15} />
              현재 선택 정보
            </div>
            {selectedItem ? (
              <div className="mt-3">
                <p className="text-lg font-black text-[var(--ink)]">{selectedItem.name}</p>
                <p className="mt-1 text-sm font-bold text-[var(--brand)]">{selectedItem.businessType}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{selectedItem.address}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">지도를 누르거나 리스트에서 식당을 선택하면 이곳에 현재 선택이 표시됩니다.</p>
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