import { BookOpenText, Home, LayoutGrid, Map, PlusCircle } from "lucide-react";
import { MOBILE_NAV } from "@/lib/platform-content";
import { SmartLink } from "@/components/SmartLink";

const ICONS = [Home, Map, LayoutGrid, BookOpenText, PlusCircle];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[rgba(255,255,255,0.96)] px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-2">
        {MOBILE_NAV.map((item, index) => {
          const Icon = ICONS[index];
          return (
            <SmartLink key={item.href} href={item.href} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--brand)]">
              <Icon size={18} />
              <span>{item.label}</span>
            </SmartLink>
          );
        })}
      </div>
    </nav>
  );
}