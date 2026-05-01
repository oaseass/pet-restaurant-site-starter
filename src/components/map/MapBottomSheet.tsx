import Link from "next/link";
import { ChevronUp, MapPin, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import type { MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";

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
  emptyState?: { title: string; description: string; href: string; hrefLabel: string };
}) {
  return (
    <section className="-mt-7 rounded-t-[2rem] border border-[rgba(28,28,28,0.08)] bg-[rgba(255,251,247,0.96)] shadow-[0_-14px_38px_rgba(30,22,18,0.08)] backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-[rgba(31,25,21,0.12)]" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f7f73]">Bottom Sheet</p>
          <p className="mt-1 text-base font-black text-[#1f1915]">리스트 {filteredCount.toLocaleString("ko-KR")}건</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#dff3ec] px-2.5 py-1 text-[11px] font-black text-[#1a463f]">핀 {coordinateReadyCount.toLocaleString("ko-KR")}</span>
          <span className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-[11px] font-black text-[#b9632e]">대기 {coordinatePendingCount.toLocaleString("ko-KR")}</span>
          <ChevronUp className={clsx("transition", open ? "rotate-0" : "rotate-180")} size={18} />
        </div>
      </button>

      {open ? (
        <div className="max-h-[48vh] overflow-y-auto px-4 pb-5">
          {preparedState ? (
            <div className="rounded-[1.7rem] bg-[#1d2624] p-5 text-white shadow-[0_20px_40px_rgba(20,22,21,0.18)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6bf91]">Coming Soon</p>
              <h3 className="mt-3 text-xl font-black tracking-tight">{preparedState.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#d6cec7]">{preparedState.description}</p>
              <p className="mt-4 rounded-[1.3rem] bg-white/8 p-3 text-sm leading-6 text-[#efe8e1]">{preparedState.note}</p>
            </div>
          ) : emptyState ? (
            <div className="rounded-[1.7rem] border border-[rgba(28,28,28,0.08)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(41,31,25,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">No Results</p>
              <h3 className="mt-3 text-xl font-black tracking-tight text-[#1f1915]">{emptyState.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#5f5750]">{emptyState.description}</p>
              <Link href={emptyState.href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1a463f] px-4 py-2 text-sm font-black text-white">
                {emptyState.hrefLabel}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isSelected = item.id === selectedId;

                return (
                  <article
                    key={item.id}
                    className={clsx(
                      "rounded-[1.5rem] border p-4 transition",
                      isSelected
                        ? "border-[rgba(26,70,63,0.24)] bg-[#f3fbf8] shadow-[0_18px_32px_rgba(26,70,63,0.12)]"
                        : "border-[rgba(28,28,28,0.08)] bg-white/84",
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
                      <p className="mt-2 text-sm font-bold text-[#675b51]">{item.regionLabel}</p>
                      <p className="mt-2 flex gap-2 text-sm leading-6 text-[#5f5750]">
                        <MapPin className="mt-0.5 shrink-0" size={15} />
                        <span>{item.address}</span>
                      </p>
                    </button>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[rgba(28,28,28,0.08)] pt-3">
                      <p className="text-xs font-bold text-[#8f7f73]">기준일 {item.dataUpdatedLabel}</p>
                      <Link href={item.href} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1f1915] px-4 py-2 text-sm font-black text-white">
                        상세보기
                      </Link>
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