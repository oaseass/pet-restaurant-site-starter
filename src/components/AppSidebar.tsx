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
    <aside className="hidden lg:block" style={{ width: "240px", flexShrink: 0 }}>
      <div
        className="sticky"
        style={{
          top: "56px",
          height: "calc(100vh - 56px)",
          overflowY: "auto",
          paddingTop: "12px",
          paddingBottom: "24px",
        }}
      >
        <nav>
          {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--line)] mx-2"
              style={{ minHeight: "40px" }}
            >
              <Icon size={17} className="shrink-0 text-[var(--muted)]" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div
          className="mx-2 mt-4 rounded-lg border border-[var(--line)] bg-[var(--brand-soft)] p-3"
        >
          <p className="text-xs font-bold text-[var(--brand)]">댕냥지도</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            반려동물 동반 정보를 지도와 피드에서 확인하세요.
          </p>
        </div>
      </div>
    </aside>
  );
}
