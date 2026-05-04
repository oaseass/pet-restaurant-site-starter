"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  MapPin,
  Utensils,
  Stethoscope,
  Scissors,
  Building2,
  HeartHandshake,
  FlaskConical,
  Search,
  BookOpen,
  PlusCircle,
} from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  exact?: boolean;
}> = [
  { href: "/", label: "전체", icon: LayoutGrid, exact: true },
  { href: "/map", label: "지도", icon: MapPin },
  { href: "/restaurants", label: "식당", icon: Utensils },
  { href: "/hospitals", label: "병원", icon: Stethoscope },
  { href: "/grooming", label: "미용", icon: Scissors },
  { href: "/daycare", label: "유치원·호텔", icon: Building2 },
  { href: "/funeral", label: "장례", icon: HeartHandshake },
  { href: "/pharmacy", label: "약국", icon: FlaskConical },
  { href: "/lost-pets", label: "찾아요", icon: Search },
  { href: "/guide", label: "가이드", icon: BookOpen },
  { href: "/business", label: "업체 등록", icon: PlusCircle },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <SmartLink
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "0 14px",
              height: "40px",
              fontSize: "14px",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--brand)" : "#444",
              background: isActive ? "var(--brand-soft)" : "transparent",
              textDecoration: "none",
              transition: "background 0.1s, color 0.1s",
              borderLeft: isActive ? "2px solid var(--brand)" : "2px solid transparent",
            }}
            className={!isActive ? "hover:bg-[#f3f4f5]" : ""}
          >
            <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
            {label}
          </SmartLink>
        );
      })}
    </nav>
  );
}
