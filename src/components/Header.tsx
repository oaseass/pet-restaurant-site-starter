import Link from "next/link";
import { MapPinned, Search } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-3 px-4 sm:gap-4 sm:px-5">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-black tracking-tight text-[var(--ink)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
            <MapPinned size={16} />
          </span>
          <span className="hidden text-sm font-black sm:block">{BRAND_NAME}</span>
        </Link>

        {/* Search bar */}
        <form action="/search" className="flex flex-1 items-center">
          <div className="flex h-9 w-full max-w-xl items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 focus-within:border-[var(--line-strong)] focus-within:bg-white transition-colors">
            <Search size={15} className="shrink-0 text-[var(--muted)]" />
            <input
              name="q"
              type="text"
              placeholder="식당, 병원, 미용, 실종 제보 검색"
              className="h-full w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none font-medium"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/map"
            className="hidden items-center gap-1.5 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white sm:flex"
          >
            지도 열기
          </Link>
          <Link
            href="/guide"
            className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] md:block"
          >
            가이드
          </Link>
          <Link
            href="/business"
            className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] md:block"
          >
            업체 등록
          </Link>
          <Link href="/map" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-white sm:hidden">
            <MapPinned size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
