import { MapPin, Sparkles } from "lucide-react";
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
    <div className="relative h-full overflow-hidden rounded-[1.8rem] border border-[rgba(24,24,24,0.08)] bg-[linear-gradient(180deg,rgba(250,247,243,0.98),rgba(244,238,230,0.94))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(122,232,204,0.22),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(255,179,102,0.28),transparent_22%),linear-gradient(rgba(23,25,24,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(23,25,24,0.05)_1px,transparent_1px)] bg-[length:auto,auto,28px_28px,28px_28px]" />
      <div className="absolute inset-x-[9%] top-[16%] h-[58%] rounded-[2rem] border border-dashed border-[rgba(26,70,63,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.12))]" />

      {previewPins.map((item) => (
        <div
          key={item.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${item.top}%`, left: `${item.left}%` }}
        >
          <div className="rounded-full bg-[#1a463f] px-3 py-1.5 text-[11px] font-black text-white shadow-[0_18px_30px_rgba(26,70,63,0.24)]">
            {item.name}
          </div>
          <div className="mx-auto -mt-1 h-3 w-3 rounded-full border-2 border-white bg-[#ff9248] shadow-[0_10px_22px_rgba(255,146,72,0.35)]" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#5f5a55]">
              <Sparkles size={14} />
              지도 데이터 표시 영역
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-[#1f1915]">{title}</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#5f5a55]">{description}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/82 p-4 text-sm shadow-[0_16px_36px_rgba(39,30,24,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a7d73]">Visible Pins</p>
            <p className="mt-2 text-2xl font-black text-[#1f1915]">{coordinateReadyCount.toLocaleString("ko-KR")}</p>
            <p className="mt-2 text-xs font-bold text-[#807268]">좌표 준비중 {coordinatePendingCount.toLocaleString("ko-KR")}곳</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.6rem] border border-white/70 bg-white/84 p-4 shadow-[0_16px_32px_rgba(39,30,24,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a7d73]">Selected</p>
            {selectedItem ? (
              <div className="mt-3">
                <p className="text-lg font-black text-[#1f1915]">{selectedItem.name}</p>
                <p className="mt-1 text-sm font-bold text-[#1a463f]">{selectedItem.businessType}</p>
                <p className="mt-2 text-sm leading-6 text-[#5f5a55]">{selectedItem.address}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#5f5a55]">선택한 항목이 없을 때도 이 영역은 내부 DB 기반 지도 데이터를 자연스럽게 이어서 보여줍니다.</p>
            )}
          </div>
          <div className="rounded-[1.6rem] border border-white/70 bg-[#1f2624] p-4 text-white shadow-[0_18px_36px_rgba(22,27,25,0.22)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f7bf90]">Category</p>
            <p className="mt-3 text-lg font-black">{activeCategoryLabel}</p>
            <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-[#d4cbc2]">
              <MapPin className="mt-1 shrink-0" size={16} />
              <p>좌표가 있는 항목만 핀 레이어에 올리고, 좌표가 없는 항목은 리스트에서 좌표 준비중 상태로 유지합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}