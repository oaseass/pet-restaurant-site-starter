"use client";

import { Crosshair } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouteProgress } from "@/components/RouteProgress";

type LocationApplyButtonProps = {
  baseHref?: string;
  radiusKm?: number;
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export function LocationApplyButton({
  baseHref = "/map?category=all",
  radiusKm = 5,
  className = "btn-primary text-sm",
  label = "내 위치 반영",
  pendingLabel,
}: LocationApplyButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { start } = useRouteProgress();
  const [status, setStatus] = useState<"idle" | "loading" | "opening" | "error" | "unsupported">("idle");
  const openingLabel = pendingLabel ?? (baseHref.startsWith("/map") ? "지도 여는 중..." : "목록 바꾸는 중...");
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setStatus("idle");
  }, [routeKey]);

  const handleClick = () => {
    if (status === "loading" || status === "opening") return;
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const url = new URL(baseHref, window.location.origin);
        url.searchParams.set("lat", position.coords.latitude.toFixed(6));
        url.searchParams.set("lng", position.coords.longitude.toFixed(6));
        url.searchParams.set("radiusKm", radiusKm.toString());
        if (url.pathname === "/map" && !url.searchParams.has("category")) {
          url.searchParams.set("category", "all");
        }

        setStatus("opening");
        start(openingLabel);
        router.push(`${url.pathname}${url.search}${url.hash}`);
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const currentLabel =
    status === "loading"
      ? "위치 확인 중..."
      : status === "opening"
        ? openingLabel
        : status === "error"
          ? "위치 재시도"
          : status === "unsupported"
            ? "현재 위치 미지원"
            : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading" || status === "opening"}
      className={`${className} gap-2 disabled:cursor-wait disabled:opacity-60`.trim()}
    >
      <Crosshair size={16} />
      {currentLabel}
    </button>
  );
}