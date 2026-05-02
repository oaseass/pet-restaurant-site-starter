import { MapPin } from "lucide-react";
import type { MapRestaurantListItem } from "@/components/map/types";

export function MapFallback({
  selectedItem,
  title,
  description,
}: {
  items: MapRestaurantListItem[];
  selectedItem: MapRestaurantListItem | null;
  title: string;
  description: string;
  coordinateReadyCount: number;
  coordinatePendingCount: number;
  activeCategoryLabel: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f6faf7] p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)]">
        <MapPin size={24} color="var(--brand)" />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-black text-[var(--ink)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {selectedItem && (
        <div className="mt-2 w-full max-w-xs rounded-[10px] border border-[var(--line)] bg-white p-4 text-left">
          <p className="text-[11px] font-black text-[var(--muted)]">선택된 식당</p>
          <p className="mt-2 text-base font-black text-[var(--ink)]">{selectedItem.name}</p>
          <p className="mt-1 text-sm font-bold text-[var(--brand)]">{selectedItem.businessType}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{selectedItem.address}</p>
        </div>
      )}
    </div>
  );
}
