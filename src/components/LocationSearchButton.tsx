"use client";

import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";
import { useState } from "react";

export function LocationSearchButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleClick = () => {
    if (!navigator.geolocation) {
      router.push("/map");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(
          `/map?lat=${pos.coords.latitude.toFixed(6)}&lng=${pos.coords.longitude.toFixed(6)}`,
        );
      },
      () => {
        setStatus("error");
        router.push("/map");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "9px 14px",
        width: "100%",
        background: status === "loading" ? "#e8e8e8" : "var(--brand-soft)",
        color: "var(--brand)",
        border: "1px solid rgba(31,107,91,0.2)",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 700,
        cursor: status === "loading" ? "wait" : "pointer",
        transition: "opacity 0.15s",
      }}
    >
      <Crosshair size={15} />
      {status === "loading"
        ? "위치 확인 중..."
        : status === "error"
          ? "위치 권한 없음 — 지도 열기"
          : "현재 위치로 찾기"}
    </button>
  );
}
