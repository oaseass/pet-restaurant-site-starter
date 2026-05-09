"use client";

export type DetailActionTargetType = "RESTAURANT" | "PLACE";

export type DetailActionName =
  | "phone"
  | "phone_report"
  | "internal_map"
  | "kakao_map"
  | "google_maps"
  | "naver_map"
  | "tmap"
  | "copy_address"
  | "review"
  | "report";

type TrackDetailActionInput = {
  targetType?: DetailActionTargetType;
  targetId?: string;
  action: DetailActionName;
  label?: string;
  href?: string | null;
};

export function trackDetailAction({ targetType, targetId, action, label, href }: TrackDetailActionInput) {
  if (typeof window === "undefined" || !targetType || !targetId) return;

  const payload = JSON.stringify({
    targetType,
    targetId,
    action,
    label,
    href,
    path: `${window.location.pathname}${window.location.search}`,
  });

  if (navigator.sendBeacon) {
    const body = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/events", body);
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}