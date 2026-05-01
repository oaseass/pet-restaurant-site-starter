import Link from "next/link";
import { MapPinned } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

const HEADER_NAV = [
  { href: "/map", label: "지도" },
  { href: "/restaurants", label: "식당" },
  { href: "/hospitals", label: "병원" },
  { href: "/grooming", label: "미용" },
  { href: "/lost-pets", label: "찾아요" },
  { href: "/guide", label: "가이드" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(250,247,242,0.92)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-black tracking-tight text-[var(--ink)]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--brand)] shadow-[0_6px_16px_rgba(23,23,23,0.05)]">
            <MapPinned size={18} />
          </span>
          <span className="truncate text-base sm:text-lg">{BRAND_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/map" className="hidden min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 text-sm font-black text-white md:inline-flex">
            내 주변 보기
          </Link>
          <Link href="/map" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 text-sm font-black text-white md:hidden">
            지도
          </Link>
        </div>
      </div>
    </header>
  );
}
