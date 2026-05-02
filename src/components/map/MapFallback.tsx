import { MapPin } from "lucide-react";
import type { MapRestaurantListItem } from "@/components/map/types";

function buildPreviewPins(items: MapRestaurantListItem[]) {
  const mappableItems = items.filter((item) => item.coordinateStatus === "ready" && item.lat !== null && item.lng !== null).slice(0, 8);
  if (mappableItems.length === 0) return [];

  const latitudes = mappableItems.map((item) => item.lat as number);
  const longitudes = mappableItems.map((item) => item.lng as number);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);

  return mappableItems.map((item) => ({
    ...item,
    top: 16 + (((maxLat - (item.lat as number)) / latRange) * 62),
    left: 10 + ((((item.lng as number) - minLng) / lngRange) * 78),
  }));
}

export function MapFallback({
  items,
  selectedItem,
  title,
  description,
  coordinateReadyCount,
  coordinatePendingCount,
  activeCategoryLabel,
}: {
  items: MapRestaurantListItem[];
  selectedItem: MapRestaurantListItem | null;
  title: string;
  description: string;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  activeCategoryLabel: string;
}) {
  const previewPins = buildPreviewPins(items);

  return (
    <div className="relative h-full overflow-hidden rounded-[1rem] border border-[var(--line)] bg-[#f6faf7]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(31,107,91,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(31,107,91,0.05)_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="absolute inset-x-[9%] top-[16%] h-[58%] rounded-[1rem] border border-dashed border-[rgba(31,107,91,0.18)] bg-[rgba(255,255,255,0.75)]" />

      {previewPins.map((item) => (
        <div
          key={item.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${item.top}%`, left: `${item.left}%` }}
        >
            <div className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(31,107,91,0.18)]">
            {item.name}
          </div>
            <div className="mx-auto -mt-1 h-3 w-3 rounded-full border-2 border-white bg-[var(--accent)] shadow-[0_8px_18px_rgba(255,159,88,0.22)]" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[11px] font-black text-[var(--muted)]">
                <MapPin size={14} />
                지도 안내
            </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-[var(--ink)]">{title}</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">{description}</p>
          </div>
            <div className="rounded-[1rem] border border-[var(--line)] bg-white p-4 text-sm shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
              <p className="text-[11px] font-black text-[var(--muted)]">지도 표시</p>
              <p className="mt-2 text-2xl font-black text-[var(--ink)]">{coordinateReadyCount.toLocaleString("ko-KR")}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1rem] border border-[var(--line)] bg-white p-4 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
              <p className="text-[11px] font-black text-[var(--muted)]">선택한 식당</p>
            {selectedItem ? (
              <div className="mt-3">
                  <p className="text-lg font-black text-[var(--ink)]">{selectedItem.name}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--brand)]">{selectedItem.businessType}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selectedItem.address}</p>
              </div>
            ) : (
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">목록에서 식당을 선택하면 이 영역에 위치 정보가 표시됩니다.</p>
            )}
          </div>
            <div className="rounded-[1rem] border border-[var(--line)] bg-white p-4 shadow-[0_8px_22px_rgba(23,23,23,0.05)]">
              <p className="text-[11px] font-black text-[var(--muted)]">카테고리</p>
              <p className="mt-3 text-lg font-black text-[var(--ink)]">{activeCategoryLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}