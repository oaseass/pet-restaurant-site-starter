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
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[rgba(31,107,91,0.22)] hover:bg-[#fcfbf9]",
            )}
          >
            <span>{category.label}</span>
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11px] font-black",
                isActive
                  ? "bg-white/16 text-white"
                  : category.status === "active"
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "bg-[var(--accent-soft)] text-[#b9632e]",
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