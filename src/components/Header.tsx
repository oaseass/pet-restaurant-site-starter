import { MapPinned } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { SmartLink } from "@/components/SmartLink";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(255,255,255,0.92)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1424px] items-center gap-3 px-4 sm:gap-4 sm:px-5">
        <SmartLink href="/" className="flex shrink-0 items-center gap-2 text-[var(--ink)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
            <MapPinned size={16} />
          </span>
          <span className="hidden text-[15px] font-black tracking-tight sm:block">{BRAND_NAME}</span>
        </SmartLink>

        <div className="min-w-0 flex-1 max-w-[540px]">
          <InstantSearchBox
            placeholder="지역, 업종, 업체명으로 검색"
            compact
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SmartLink
            href="/map"
            pendingLabel="지도 여는 중..."
            className="hidden min-h-10 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white sm:inline-flex"
          >
            지도 열기
          </SmartLink>
          <SmartLink
            href="/guide"
            className="hidden min-h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] md:inline-flex"
          >
            가이드
          </SmartLink>
          <SmartLink
            href="/business"
            className="hidden min-h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] md:inline-flex"
          >
            업체 등록
          </SmartLink>
          <SmartLink href="/map" pendingLabel="지도 여는 중..." className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] sm:hidden">
            <MapPinned size={15} />
          </SmartLink>
        </div>
      </div>
    </header>
  );
}
