import { MapPin, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import type { MapRestaurantListItem, PreparedCategoryState } from "@/components/map/types";
import { SmartLink } from "@/components/SmartLink";

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
  emptyState?: { title: string; description: string; href: string; hrefLabel: string; extraLinks?: Array<{ href: string; label: string }> };
}) {
  return (
    <section className="section-shell flex h-full min-h-[760px] flex-col p-4">
      <div className="relative z-10">
        <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">근처 목록</p>
        <h2 className="mt-3 text-[1.75rem] font-black tracking-tight text-[var(--ink)]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{subtitle}</p>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
        <Metric label="찾은 곳" value={filteredCount.toLocaleString("ko-KR")} />
        <Metric label="지도 핀" value={coordinateReadyCount.toLocaleString("ko-KR")} tone="mint" />
      </div>

      {preparedState ? (
        <div className="relative z-10 mt-5 flex flex-1 flex-col gap-4">
          <div className="rounded-[1rem] border border-[var(--line)] bg-white p-5 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
            <p className="text-[11px] font-black text-[var(--brand)]">이렇게 찾아보세요</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">{preparedState.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{preparedState.description}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--line)] bg-[#fcfbf8] p-5 text-sm leading-7 text-[var(--muted)] shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
            <p className="font-black text-[var(--ink)]">지금은 이렇게 보여드려요</p>
            <p className="mt-3">{preparedState.note}</p>
          </div>
        </div>
      ) : emptyState ? (
        <div className="relative z-10 mt-5 flex flex-1 flex-col justify-center rounded-[1rem] border border-[var(--line)] bg-white p-6 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
          <p className="text-[11px] font-black text-[var(--muted)]">아직 못 찾았어요</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-[var(--ink)]">{emptyState.title}</h3>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{emptyState.description}</p>
          <SmartLink href={emptyState.href} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
            {emptyState.hrefLabel}
          </SmartLink>
          {emptyState.extraLinks?.map((link) => (
            <SmartLink key={link.href} href={link.href} className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-black text-[var(--brand)]">
              {link.label}
            </SmartLink>
          ))}
        </div>
      ) : (
        <div className="relative z-10 mt-5 flex flex-1 flex-col overflow-hidden rounded-[1rem] border border-[var(--line)] bg-white shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 text-xs font-bold text-[var(--muted)]">
            <span>{visibleCount.toLocaleString("ko-KR")}곳을 보여드려요</span>
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
                      "rounded-[1rem] border p-4 transition",
                      isSelected
                        ? "border-[rgba(31,107,91,0.24)] bg-[#f4faf7] shadow-[0_8px_20px_rgba(31,107,91,0.08)]"
                        : "border-[var(--line)] bg-white hover:border-[rgba(31,107,91,0.18)] hover:bg-[#fcfbf9]",
                    )}
                  >
                    <SmartLink href={item.href} className="block w-full rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
                      <div className="flex flex-wrap gap-2">
                        {item.categoryLabel && (
                          <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-black text-[#2563eb]">{item.categoryLabel}</span>
                        )}
                        {item.officialRegistered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8f3] px-2.5 py-1 text-[11px] font-black text-[#1a463f]">
                            <ShieldCheck size={13} />
                            공식 등록 정보
                          </span>
                        ) : null}
                        {item.identityLabel ? <span className="rounded-full bg-[#f5f1eb] px-2.5 py-1 text-[11px] font-black text-[#63574d]">{item.identityLabel}</span> : null}
                        {item.coordinateStatus === "ready" && (
                          <span className="rounded-full bg-[#dff3ec] px-2.5 py-1 text-[11px] font-black text-[#1a463f]">
                            지도 핀 있음
                          </span>
                        )}
                        <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-black text-[var(--muted)]">{item.phone ? "전화로 확인" : "전화번호 알려주기"}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black tracking-tight text-[#1f1915]">{item.name}</h3>
                      {item.identityDescription ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5f5550]">{item.identityDescription}</p> : null}
                      <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                        {item.regionLabel}
                        {item.distanceKm !== undefined && (
                          <span className="ml-2 text-[var(--brand)]">
                            · {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)}m` : `${item.distanceKm.toFixed(1)}km`}
                          </span>
                        )}
                      </p>
                      <p className="mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]">
                        <MapPin className="mt-0.5 shrink-0" size={15} />
                        <span>{item.address}</span>
                      </p>
                      <div className="mt-3 grid gap-1.5 text-xs font-bold text-[#7b746d]">
                        <span>{item.externalCategory ?? item.sourceLabel ?? "정부 공개자료를 정리했어요"}</span>
                        {item.reviewLabel ? <span>{item.reviewLabel}</span> : null}
                      </div>
                    </SmartLink>
                    <div className="mt-4 border-t border-[var(--line)] pt-3">
                      <p className="text-xs font-bold text-[var(--muted)]">업데이트 {item.dataUpdatedLabel}</p>
                      <DiscoveryCardActions
                        className="mt-3"
                        detailHref={item.href}
                        onMapSelect={() => onSelect(item.id)}
                        mapLabel={item.coordinateStatus === "ready" ? "지도에서 보기" : "주소로 찾기"}
                        phone={item.phone}
                        externalHref={item.externalHref}
                        reviewHref={item.reviewHref}
                        detailLabel="자세히 보기"
                      />
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
    <div className={clsx("rounded-[1rem] border border-[var(--line)] p-3", toneClassName)}>
      <p className="text-[11px] font-black text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">{value}</p>
    </div>
  );
}