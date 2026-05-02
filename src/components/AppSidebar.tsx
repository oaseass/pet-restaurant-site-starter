import Link from "next/link";
import {
  Home,
  Map,
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  Heart,
  Search,
  BookOpenText,
  PlusSquare,
} from "lucide-react";

const SIDEBAR_NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/map", label: "지도", icon: Map },
  { href: "/restaurants", label: "식당", icon: UtensilsCrossed },
  { href: "/hospitals", label: "병원", icon: Stethoscope },
  { href: "/grooming", label: "미용", icon: Scissors },
  { href: "/daycare", label: "유치원·호텔", icon: Building2 },
  { href: "/funeral", label: "장례", icon: Heart },
  { href: "/lost-pets", label: "댕냥이 찾아요", icon: Search },
  { href: "/guide", label: "생활 가이드", icon: BookOpenText },
  { href: "/business", label: "업체 등록", icon: PlusSquare },
] as const;

export function AppSidebar() {
  return (
    <nav>
      {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--line)] mx-1"
          style={{ minHeight: "38px" }}
        >
          <Icon size={16} className="shrink-0 text-[var(--muted)]" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
