import Link from "next/link";
import { clsx } from "clsx";
import type { MapCategoryKey, MapCategoryOption } from "@/components/map/types";

export function MapCategoryChips({
  categories,
  activeCategory,
}: {
  categories: MapCategoryOption[];
  activeCategory: MapCategoryKey;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => {
        const isActive = category.key === activeCategory;

        return (
          <Link
            key={category.key}
            href={category.href}
            className={clsx(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-black transition",
              isActive
                ? "border-transparent bg-[#1a463f] text-white shadow-[0_18px_35px_rgba(26,70,63,0.24)]"
                : "border-[rgba(34,34,34,0.08)] bg-white/88 text-[#1f1915] hover:border-[rgba(255,141,76,0.26)] hover:bg-white",
            )}
          >
            <span>{category.label}</span>
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                isActive
                  ? "bg-white/16 text-white"
                  : category.status === "active"
                    ? "bg-[#dff3ec] text-[#1a463f]"
                    : "bg-[#fff0e3] text-[#b9632e]",
              )}
            >
              {category.countLabel}
            </span>
          </Link>
        );
      })}
    </div>
  );
}