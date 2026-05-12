import { SmartLink } from "@/components/SmartLink";

export type HomeRecentUpdateItem = {
  id: string;
  href: string;
  name: string;
  categoryLabel: string;
  regionLabel: string;
  statusLabel: string;
  updatedLabel: string;
};

interface HomeRestaurantHighlightsProps {
  items: HomeRecentUpdateItem[];
}

export function HomeRestaurantHighlights({ items }: HomeRestaurantHighlightsProps) {
  return (
    <section className="section-shell px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--muted)]">업데이트</p>
          <h2 className="mt-2 text-[18px] font-black tracking-tight text-[var(--ink)]">최근 업데이트된 장소</h2>
        </div>
        <SmartLink href="/map" className="text-[13px] font-bold text-[var(--brand)]">
          전체 보기
        </SmartLink>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <SmartLink key={item.id} href={item.href} className="group rounded-2xl border border-[var(--line)] bg-white p-4 transition hover:border-[var(--brand)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[16px] font-black tracking-tight text-[var(--ink)]">{item.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand)]">{item.categoryLabel}</span>
                  <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-black text-[var(--muted)]">{item.statusLabel}</span>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[var(--muted)] transition group-hover:text-[var(--brand)]">→</span>
            </div>
            <div className="mt-4 grid gap-2 text-[13px] leading-5 text-[var(--muted)] sm:grid-cols-2">
              <div>
                <span className="font-bold text-[var(--ink)]">지역</span>
                <div className="mt-1">{item.regionLabel}</div>
              </div>
              <div>
                <span className="font-bold text-[var(--ink)]">업데이트</span>
                <div className="mt-1">{item.updatedLabel}</div>
              </div>
            </div>
          </SmartLink>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[#fbfcfb] px-4 py-5 text-[13px] text-[var(--muted)]">
          최근 업데이트된 장소를 정리 중입니다.
        </div>
      ) : null}
    </section>
  );
}
