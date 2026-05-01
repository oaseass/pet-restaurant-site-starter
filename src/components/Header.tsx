import Link from "next/link";
import { PawPrint } from "lucide-react";

const NAV_ITEMS = [
  { href: "/search", label: "식당 검색" },
  { href: "/regions/서울", label: "지역별 보기" },
  { href: "/guide", label: "이용 가이드" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/55 bg-[#f8f5ec]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-slate-950 text-white shadow-soft">
              <PawPrint size={20} />
            </span>
            <span className="text-lg">댕냥식당지도</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-white/80 hover:text-gray-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-gray-600 shadow-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
