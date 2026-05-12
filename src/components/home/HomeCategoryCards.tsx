import { ArrowRight, type LucideIcon } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

export type HomeCategoryCardItem = {
  label: string;
  href: string;
  description: string;
  countLabel: string;
  icon: LucideIcon;
};

export function HomeCategoryCards({ items }: { items: HomeCategoryCardItem[] }) {
  return (
    <section className="section-shell px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--muted)]">카테고리</p>
          <h2 className="mt-2 text-[18px] font-black tracking-tight text-[var(--ink)]">같은 기준으로 둘러보기</h2>
        </div>
        <SmartLink href="/categories" className="text-[13px] font-bold text-[var(--brand)]">
          전체 보기
        </SmartLink>
      </div>

      <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">식당, 병원, 약국, 미용, 숙소, 보호동물 정보까지 한 화면에서 같은 방식으로 찾을 수 있게 정리했습니다.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SmartLink
              key={item.href}
              href={item.href}
              className="group flex min-h-[132px] flex-col rounded-2xl border border-[var(--line)] bg-white p-[18px] transition hover:border-[var(--brand)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--brand)]">
                  <Icon size={18} />
                </span>
                <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--brand)]" />
              </div>
              <div className="mt-4 text-[16px] font-black tracking-tight text-[var(--ink)]">{item.label}</div>
              <div className="mt-1 text-[13px] font-extrabold text-[var(--brand)]">{item.countLabel}</div>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">{item.description}</p>
            </SmartLink>
          );
        })}
      </div>
    </section>
  );
}
