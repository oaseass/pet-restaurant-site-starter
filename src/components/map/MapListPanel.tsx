import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import type { MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";

export function MapListPanel({
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  filteredCount,
  visibleCount,
  coordinateReadyCount,
  coordinatePendingCount,
  preparedState,
  emptyState,
}: {
  title: string;
  subtitle: string;
  items: MapRestaurantListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filteredCount: number;
  visibleCount: number;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  preparedState?: PreparedCategoryState;
  emptyState?: { title: string; description: string; href: string; hrefLabel: string };
}) {
  return (
    <section className="section-shell flex h-full min-h-[760px] flex-col p-5">
      <div className="relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f7f73]">Map List</p>
        <h2 className="mt-3 text-[1.75rem] font-black tracking-tight text-[#1f1915]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#655950]">{subtitle}</p>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
        <Metric label="검색 결과" value={filteredCount.toLocaleString("ko-KR")} />
        <Metric label="핀 가능" value={coordinateReadyCount.toLocaleString("ko-KR")} tone="mint" />
        <Metric label="좌표 준비중" value={coordinatePendingCount.toLocaleString("ko-KR")} tone="orange" />
      </div>

      {preparedState ? (
        <div className="relative z-10 mt-5 flex flex-1 flex-col gap-4">
          <div className="rounded-[1.8rem] bg-[#1d2624] p-5 text-white shadow-[0_20px_42px_rgba(20,22,21,0.18)]">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6bf91]">Coming Soon</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">{preparedState.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[#d6cec7]">{preparedState.description}</p>
          </div>
          <div className="rounded-[1.8rem] border border-[rgba(28,28,28,0.08)] bg-white/82 p-5 text-sm leading-7 text-[#5f5750] shadow-[0_18px_38px_rgba(41,31,25,0.08)]">
            <p className="font-black text-[#1f1915]">현재 안내</p>
            <p className="mt-3">{preparedState.note}</p>
          </div>
        </div>
      ) : emptyState ? (
        <div className="relative z-10 mt-5 flex flex-1 flex-col justify-center rounded-[1.8rem] border border-[rgba(28,28,28,0.08)] bg-white/84 p-6 shadow-[0_18px_38px_rgba(41,31,25,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f7f73]">No Results</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-[#1f1915]">{emptyState.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[#5f5750]">{emptyState.description}</p>
          <Link href={emptyState.href} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1a463f] px-4 py-2 text-sm font-black text-white">
            {emptyState.hrefLabel}
          </Link>
        </div>
      ) : (
        <div className="relative z-10 mt-5 flex flex-1 flex-col overflow-hidden rounded-[1.8rem] border border-[rgba(28,28,28,0.08)] bg-white/78 shadow-[0_18px_38px_rgba(41,31,25,0.08)]">
          <div className="flex items-center justify-between border-b border-[rgba(28,28,28,0.08)] px-4 py-3 text-xs font-bold text-[#8f7f73]">
            <span>리스트 {visibleCount.toLocaleString("ko-KR")}건 표시</span>
            <span>최대 120건</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
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
                        : "border-[rgba(28,28,28,0.08)] bg-white/82 hover:border-[rgba(255,146,72,0.22)] hover:bg-white",
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
                        <span
                          className={clsx(
                            "rounded-full px-2.5 py-1 text-[11px] font-black",
                            item.coordinateStatus === "ready" ? "bg-[#dff3ec] text-[#1a463f]" : "bg-[#fff0e3] text-[#b9632e]",
                          )}
                        >
                          {item.coordinateStatus === "ready" ? "핀 표시" : "좌표 준비중"}
                        </span>
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
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "mint" | "orange";
}) {
  const toneClassName = tone === "mint"
    ? "bg-[#e8f7f1]"
    : tone === "orange"
      ? "bg-[#fff1e5]"
      : "bg-white/82";

  return (
    <div className={clsx("rounded-[1.4rem] border border-[rgba(28,28,28,0.08)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]", toneClassName)}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8f7f73]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-[#1f1915]">{value}</p>
    </div>
  );
}