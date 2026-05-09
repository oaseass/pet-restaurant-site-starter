"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";
import { useRouteProgress } from "@/components/RouteProgress";

export function MapLocationButton({ category }: { category?: string }) {
  const router = useRouter();
  const { start } = useRouteProgress();
  const [status, setStatus] = useState<"idle" | "loading" | "opening" | "error" | "unsupported">("idle");

  const handleClick = () => {
    if (status === "loading" || status === "opening") return;
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const params = new URLSearchParams({ lat, lng });
        params.set("radiusKm", "5");
        if (category) params.set("category", category);
        setStatus("opening");
        start("지도 여는 중...");
        router.push(`/map?${params.toString()}`);
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const label =
    status === "loading"
      ? "위치 확인 중..."
      : status === "opening"
        ? "지도 여는 중..."
        : status === "error"
          ? "위치 재시도"
          : status === "unsupported"
            ? "현재 위치 미지원"
            : "내 위치 반영";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading" || status === "opening"}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
    >
      <Crosshair size={16} />
      {label}
    </button>
  );
}
