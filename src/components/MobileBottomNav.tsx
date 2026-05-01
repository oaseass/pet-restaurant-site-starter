import Link from "next/link";
import { Home, Map, Megaphone, BookOpenText, UserRound } from "lucide-react";
import { MOBILE_NAV } from "@/lib/platform-content";

const ICONS = [Home, Map, Megaphone, BookOpenText, UserRound];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(56,41,29,0.08)] bg-[rgba(255,250,245,0.94)] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-2">
        {MOBILE_NAV.map((item, index) => {
          const Icon = ICONS[index];
          return (
            <Link key={item.href} href={item.href} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-[#665950] transition hover:bg-white/70">
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}