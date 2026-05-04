"use client";

import { useState } from "react";
import { Crosshair } from "lucide-react";

export function MapLocationButton({ category }: { category?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "unsupported">("idle");

  const handleClick = () => {
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
        if (category && category !== "all") params.set("category", category);
        window.location.href = `/map?${params.toString()}`;
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const label =
    status === "loading"
      ? "위치 확인 중…"
      : status === "error"
        ? "위치 재시도"
        : status === "unsupported"
          ? "현재 위치 미지원"
          : "현재 위치로 찾기";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
    >
      <Crosshair size={16} />
      {label}
    </button>
  );
}
