"use client";

import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";
import { useState } from "react";
import { useRouteProgress } from "@/components/RouteProgress";

export function LocationSearchButton() {
  const router = useRouter();
  const { start } = useRouteProgress();
  const [status, setStatus] = useState<"idle" | "loading" | "opening" | "error">("idle");

  const openMap = (href: string) => {
    setStatus("opening");
    start("지도 여는 중...");
    router.push(href);
  };

  const handleClick = () => {
    if (status === "loading" || status === "opening") return;
    if (!navigator.geolocation) {
      setStatus("error");
      window.setTimeout(() => openMap("/map"), 400);
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        openMap(
          `/map?lat=${pos.coords.latitude.toFixed(6)}&lng=${pos.coords.longitude.toFixed(6)}&category=all`,
        );
      },
      () => {
        setStatus("error");
        window.setTimeout(() => openMap("/map"), 400);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading" || status === "opening"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        minHeight: "36px",
        padding: "0 14px",
        background: status === "loading" || status === "opening" ? "#eef1ef" : "#ffffff",
        color: "var(--brand)",
        border: "1px solid var(--line)",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 800,
        cursor: status === "loading" || status === "opening" ? "wait" : "pointer",
        transition: "opacity 0.15s, border-color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      <Crosshair size={15} />
      {status === "loading"
        ? "위치 확인 중..."
        : status === "opening"
          ? "지도 여는 중..."
          : status === "error"
            ? "위치 권한 없음"
            : "내 위치 반영"}
    </button>
  );
}
