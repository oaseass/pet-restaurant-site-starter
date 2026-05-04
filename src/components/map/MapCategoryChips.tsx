import { clsx } from "clsx";
import type { MapCategoryKey, MapCategoryOption } from "@/components/map/types";
import { SmartLink } from "@/components/SmartLink";

export function MapCategoryChips({
  categories,
  activeCategory,
}: {
  categories: MapCategoryOption[];
  activeCategory: MapCategoryKey;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {categories.map((category) => {
        const isActive = category.key === activeCategory;

        return (
          <SmartLink
            key={category.key}
            href={category.href}
            pendingLabel="지도 여는 중..."
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition",
              isActive
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]",
            )}
          >
            <span>{category.label}</span>
            {category.status === "active" && category.countLabel ? (
              <span
                className={clsx(
                  "text-[11px] font-black",
                  isActive ? "text-white/80" : "text-[var(--brand)]",
                )}
              >
                {category.countLabel}
              </span>
            ) : category.status !== "active" ? (
              <span className="text-[10px] text-[var(--muted)] opacity-70">준비</span>
            ) : null}
          </SmartLink>
        );
      })}
    </div>
  );
}
