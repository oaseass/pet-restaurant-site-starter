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

export function AdSlot({ label = "광고 영역", slotId, className, format = "auto" }: AdSlotProps) {
  const shouldRenderAdsense = Boolean(adsenseClientId && slotId);

  useEffect(() => {
    if (!shouldRenderAdsense || typeof window === "undefined") return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore duplicate pushes in development or during route transitions.
    }
  }, [shouldRenderAdsense, slotId]);

  return (
    <aside className={clsx("my-8", className)} aria-label={label}>
      <div className="card rounded-[2rem] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex h-8 items-center rounded-full bg-slate-950 px-3 text-xs font-black uppercase tracking-[0.18em] text-white">Ad</span>
          <p className="text-right text-xs font-semibold text-gray-400">{label}</p>
        </div>

        {shouldRenderAdsense ? (
          <ins
            className="adsbygoogle block min-h-28 w-full overflow-hidden rounded-[1.5rem] bg-white/80"
            style={{ display: "block" }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex min-h-28 items-center justify-center rounded-[1.5rem] border border-dashed border-emerald-300/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(233,246,239,0.9))] px-4 text-center text-sm font-semibold text-gray-500">
            실제 애드센스 코드를 그대로 넣을 수 있는 광고 컴포넌트 자리입니다.
          </div>
        )}
      </div>
    </aside>
  );
}
