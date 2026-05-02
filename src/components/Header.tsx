import Link from "next/link";
import { MapPinned } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";

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

        {/* 자동완성 검색창 */}
        <div className="flex-1 max-w-xl">
          <InstantSearchBox
            placeholder="식당, 지역, 업종 검색"
            compact
          />
        </div>

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
