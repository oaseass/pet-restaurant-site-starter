import { ChevronUp, MapPin, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import type { MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { SmartLink } from "@/components/SmartLink";

export function MapBottomSheet({
  open,
  onToggle,
  items,
  selectedId,
  onSelect,
  filteredCount,
  coordinateReadyCount,
  coordinatePendingCount,
  preparedState,
  emptyState,
}: {
  open: boolean;
  onToggle: () => void;
  items: MapRestaurantListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filteredCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  preparedState?: PreparedCategoryState;
  emptyState?: { title: string; description: string; href: string; hrefLabel: string; extraLinks?: Array<{ href: string; label: string }> };
}) {
  return (
    <section className="-mt-5 rounded-t-[1.25rem] border border-[var(--line)] bg-[rgba(255,255,255,0.98)] shadow-[0_-10px_28px_rgba(23,23,23,0.06)] backdrop-blur-sm lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-[rgba(23,23,23,0.12)]" />
          <p className="text-xs font-black text-[var(--muted)]">목록</p>
          <p className="mt-1 text-base font-black text-[var(--ink)]">리스트 {filteredCount.toLocaleString("ko-KR")}건</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--brand)]">핀 {coordinateReadyCount.toLocaleString("ko-KR")}</span>
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-black text-[#b9632e]">대기 {coordinatePendingCount.toLocaleString("ko-KR")}</span>
          <ChevronUp className={clsx("transition", open ? "rotate-0" : "rotate-180")} size={18} />
        </div>
      </button>

      {open ? (
        <div className="max-h-[48vh] overflow-y-auto px-4 pb-5">
          {preparedState ? (
            <div className="rounded-[1rem] border border-[var(--line)] bg-white p-5 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
              <p className="text-[11px] font-black text-[var(--brand)]">준비 중</p>
              <h3 className="mt-3 text-xl font-black tracking-tight">{preparedState.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{preparedState.description}</p>
              <p className="mt-4 rounded-[1rem] bg-[#fcfbf8] p-3 text-sm leading-6 text-[var(--muted)]">{preparedState.note}</p>
            </div>
          ) : emptyState ? (
            <div className="rounded-[1rem] border border-[var(--line)] bg-white p-5 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
              <p className="text-[11px] font-black text-[var(--muted)]">검색 결과 없음</p>
              <h3 className="mt-3 text-xl font-black tracking-tight text-[var(--ink)]">{emptyState.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{emptyState.description}</p>
              <SmartLink href={emptyState.href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
                {emptyState.hrefLabel}
              </SmartLink>
              {emptyState.extraLinks?.map((link) => (
                <SmartLink key={link.href} href={link.href} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-black text-[var(--brand)]">
                  {link.label}
                </SmartLink>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isSelected = item.id === selectedId;

                return (
                  <article
                    key={item.id}
                    className={clsx(
                      "rounded-[1rem] border p-4 transition",
                      isSelected
                        ? "border-[rgba(31,107,91,0.24)] bg-[#f4faf7] shadow-[0_8px_20px_rgba(31,107,91,0.08)]"
                        : "border-[var(--line)] bg-white",
                    )}
                  >
                    <button type="button" onClick={() => onSelect(item.id)} className="block w-full text-left">
                      <div className="flex flex-wrap gap-2">
                        {item.officialRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8f3] px-2.5 py-1 text-[11px] font-black text-[#1a463f]">
                            <ShieldCheck size={13} />
                            공식 등록
                          </span>
                        ) : null}
                        <span className="rounded-full bg-[#f5f1eb] px-2.5 py-1 text-[11px] font-black text-[#63574d]">{item.businessType}</span>
                        <span className={clsx("rounded-full px-2.5 py-1 text-[11px] font-black", item.coordinateStatus === "ready" ? "bg-[#dff3ec] text-[#1a463f]" : "bg-[#fff0e3] text-[#b9632e]")}>{item.coordinateStatus === "ready" ? "핀 표시" : "좌표 준비중"}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black tracking-tight text-[#1f1915]">{item.name}</h3>
                      <p className="mt-2 text-sm font-bold text-[var(--muted)]">{item.regionLabel}</p>
                      <p className="mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]">
                        <MapPin className="mt-0.5 shrink-0" size={15} />
                        <span>{item.address}</span>
                      </p>
                    </button>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <p className="text-xs font-bold text-[var(--muted)]">기준일 {item.dataUpdatedLabel}</p>
                      <SmartLink href={item.href} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-black text-white">
                        상세보기
                      </SmartLink>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}