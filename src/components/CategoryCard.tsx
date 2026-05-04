import { SmartLink } from "@/components/SmartLink";
import type { CategorySummary } from "@/lib/platform-content";

export function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <SmartLink href={category.href} className="card group block rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">{category.shortLabel}</p>
          <h3 className="mt-2 text-lg font-black tracking-tight">{category.title}</h3>
        </div>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-black text-[var(--accent)]">바로가기</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
    </SmartLink>
  );
}