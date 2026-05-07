import { HeartPulse, PawPrint, Pill, ShieldCheck, Utensils } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import type { DiscoveryVisualKind } from "@/lib/discovery-cards";

type CategoryVisualBlockProps = {
  kind: DiscoveryVisualKind;
  title: string;
  description: string;
  compact?: boolean;
  photoHref?: string;
};

const VISUALS = {
  restaurant: {
    label: "식당",
    Icon: Utensils,
    className: "border-[#f3d4b4] bg-[#fff8ef] text-[#9a4f17]",
    pattern: "bg-[linear-gradient(135deg,rgba(255,185,105,0.28)_0%,rgba(255,255,255,0)_46%),repeating-linear-gradient(90deg,rgba(154,79,23,0.08)_0,rgba(154,79,23,0.08)_1px,transparent_1px,transparent_12px)]",
  },
  hospital: {
    label: "케어",
    Icon: HeartPulse,
    className: "border-[#bddfd6] bg-[#f2fbf7] text-[#1a6b59]",
    pattern: "bg-[linear-gradient(135deg,rgba(88,184,154,0.22)_0%,rgba(255,255,255,0)_48%),repeating-linear-gradient(0deg,rgba(26,107,89,0.07)_0,rgba(26,107,89,0.07)_1px,transparent_1px,transparent_12px)]",
  },
  pharmacy: {
    label: "약국",
    Icon: Pill,
    className: "border-[#c7d7ee] bg-[#f4f8ff] text-[#2563eb]",
    pattern: "bg-[linear-gradient(135deg,rgba(96,165,250,0.2)_0%,rgba(255,255,255,0)_48%),repeating-linear-gradient(90deg,rgba(37,99,235,0.07)_0,rgba(37,99,235,0.07)_1px,transparent_1px,transparent_12px)]",
  },
  grooming: {
    label: "미용",
    Icon: PawPrint,
    className: "border-[#ead0dc] bg-[#fff6fa] text-[#a43d67]",
    pattern: "bg-[linear-gradient(135deg,rgba(244,114,182,0.17)_0%,rgba(255,255,255,0)_50%),repeating-linear-gradient(0deg,rgba(164,61,103,0.07)_0,rgba(164,61,103,0.07)_1px,transparent_1px,transparent_13px)]",
  },
  daycare: {
    label: "돌봄",
    Icon: PawPrint,
    className: "border-[#d9d1b8] bg-[#fbfaf0] text-[#75621e]",
    pattern: "bg-[linear-gradient(135deg,rgba(217,190,91,0.18)_0%,rgba(255,255,255,0)_48%),repeating-linear-gradient(90deg,rgba(117,98,30,0.07)_0,rgba(117,98,30,0.07)_1px,transparent_1px,transparent_12px)]",
  },
  funeral: {
    label: "추모",
    Icon: ShieldCheck,
    className: "border-[#cfd4dc] bg-[#f7f8fa] text-[#4b5563]",
    pattern: "bg-[linear-gradient(135deg,rgba(148,163,184,0.18)_0%,rgba(255,255,255,0)_48%),repeating-linear-gradient(0deg,rgba(75,85,99,0.07)_0,rgba(75,85,99,0.07)_1px,transparent_1px,transparent_12px)]",
  },
} satisfies Record<DiscoveryVisualKind, { label: string; Icon: typeof Utensils; className: string; pattern: string }>;

export function CategoryVisualBlock({ kind, title, description, compact = false, photoHref }: CategoryVisualBlockProps) {
  const visual = VISUALS[kind];
  const Icon = visual.Icon;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${visual.className} ${visual.pattern} ${compact ? "p-3" : "p-5 sm:p-6"}`}>
      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/82 shadow-sm">
            <Icon size={compact ? 18 : 21} />
          </span>
          <span className="rounded-full bg-white/76 px-2.5 py-1 text-[10px] font-black">실제 사진 아님</span>
        </div>
        <div>
          <p className="text-[11px] font-black tracking-[0.04em] opacity-75">{visual.label}</p>
          <p className={`${compact ? "mt-1 text-sm" : "mt-2 text-xl"} font-black leading-snug text-current`}>{title}</p>
          <p className={`${compact ? "mt-1 line-clamp-2 text-[11px] leading-5" : "mt-3 text-sm leading-7"} opacity-80`}>{description}</p>
          {photoHref ? (
            <SmartLink href={photoHref} className="mt-4 inline-flex min-h-9 items-center rounded-full bg-white/82 px-3 py-1.5 text-xs font-black text-current no-underline shadow-sm">
              사진 제보하기
            </SmartLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}