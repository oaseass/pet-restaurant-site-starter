import Link from "next/link";
import { CharacterImage } from "@/components/CharacterImage";
import { PRIMARY_NAV } from "@/lib/platform-content";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-4 sm:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="section-shell px-4 py-4 sm:px-5">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3 font-black tracking-tight">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border border-white/75 bg-white/78 shadow-[0_18px_34px_rgba(72,51,38,0.08)]">
                <CharacterImage asset="dog-brown" className="h-10 w-10 mascot-float" priority imageClassName="object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#88786f]">Daengnyang Map</span>
                <span className="block truncate text-lg sm:text-xl">{BRAND_NAME}</span>
                <span className="hidden text-xs font-bold text-[#8c7e74] sm:block">{BRAND_TAGLINE}</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-transparent px-4 py-2 text-sm font-bold text-[#655a52] transition hover:border-[rgba(56,41,29,0.1)] hover:bg-white/75 hover:text-[var(--ink)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href="/map" className="hidden rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white md:inline-flex">
              지도 바로 열기
            </Link>
          </div>

          <nav className="relative z-10 mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-[#655a52] shadow-[0_10px_20px_rgba(72,51,38,0.05)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
