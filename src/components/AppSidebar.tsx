"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CirclePlus,
  LayoutGrid,
  MapPin,
  Megaphone,
  HeartHandshake,
  House,
  Pill,
  Scissors,
  Stethoscope,
  Utensils,
  Building2,
} from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  exact?: boolean;
}> = [
  { href: "/", label: "홈", icon: LayoutGrid, exact: true },
  { href: "/map", label: "지도", icon: MapPin },
  { href: "/categories", label: "카테고리", icon: LayoutGrid },
  { href: "/restaurants", label: "식당", icon: Utensils },
  { href: "/hospitals", label: "병원", icon: Stethoscope },
  { href: "/pharmacy", label: "약국", icon: Pill },
  { href: "/grooming", label: "미용", icon: Scissors },
  { href: "/pension", label: "펜션", icon: House },
  { href: "/daycare", label: "유치원·호텔", icon: Building2 },
  { href: "/funeral", label: "장례", icon: HeartHandshake },
  { href: "/lost-pets", label: "보호동물 공고", icon: Megaphone },
  { href: "/guide", label: "가이드", icon: BookOpen },
  { href: "/business", label: "업체 등록", icon: CirclePlus },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav>
      <div className="px-3 pb-3">
        <p className="px-2 text-[11px] font-extrabold tracking-[0.08em] text-[var(--muted)]">둘러보기</p>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <SmartLink
            key={href}
            href={href}
            className={`mx-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition ${isActive ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--ink)] hover:bg-[#f3f5f4]"}`.trim()}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${isActive ? "border-[rgba(22,115,95,0.18)] bg-white text-[var(--brand)]" : "border-transparent bg-[#f3f4f6] text-[var(--muted)]"}`.trim()}>
              <Icon size={15} style={{ flexShrink: 0 }} />
            </span>
            {label}
          </SmartLink>
        );
      })}
    </nav>
  );
}
