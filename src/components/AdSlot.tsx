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
    <aside className={clsx("my-8", className)} aria-label={label}>
      <div className="card rounded-[2rem] p-4 sm:p-5">
        <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex h-8 items-center rounded-full bg-[#1f2d29] px-3 text-xs font-black uppercase tracking-[0.2em] text-white">Ad</span>
          <p className="text-right text-xs font-semibold text-[#9d8f83]">{label}</p>
        </div>
        <ins
          className="adsbygoogle block min-h-28 w-full overflow-hidden rounded-[1.6rem] bg-white/85"
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
