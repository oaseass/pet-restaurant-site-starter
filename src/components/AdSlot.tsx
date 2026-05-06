"use client";

import { useEffect } from "react";
import clsx from "clsx";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSlotProps = {
  label?: string;
  slotId?: string;
  className?: string;
  format?: "auto" | "rectangle" | "fluid";
};

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
const defaultAdsenseSlotId = process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID;

export function AdSlot({ label = "광고 영역", slotId, className, format = "auto" }: AdSlotProps) {
  const resolvedSlotId = slotId ?? defaultAdsenseSlotId;
  const shouldRenderAdsense = Boolean(adsenseEnabled && adsenseClientId && resolvedSlotId);

  useEffect(() => {
    if (!shouldRenderAdsense || typeof window === "undefined") return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore duplicate pushes in development or during route transitions.
    }
  }, [shouldRenderAdsense, resolvedSlotId]);

  if (!shouldRenderAdsense) {
    return null;
  }

  return (
    <aside className={clsx("my-5 sm:my-6", className)} aria-label={label}>
      <div className="rounded-lg border border-[var(--line)] bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded bg-[#eef3f1] px-2 py-1 text-[10px] font-black uppercase text-[var(--brand)]">광고</span>
          <p className="text-right text-[11px] font-bold text-[var(--muted)]">{label}</p>
        </div>
        <ins
          className="adsbygoogle block min-h-24 w-full overflow-hidden rounded-md bg-[#f6f7f8] sm:min-h-28"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={resolvedSlotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
