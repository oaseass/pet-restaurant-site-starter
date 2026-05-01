import Link from "next/link";
import { CharacterImage } from "@/components/CharacterImage";
import type { CategorySummary } from "@/lib/platform-content";

export function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <Link href={category.href} className="card group block rounded-[2rem] p-5 transition hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9b8d81]">{category.shortLabel}</p>
          <h3 className="mt-2 text-lg font-black tracking-tight">{category.title}</h3>
        </div>
        <div className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,184,107,0.24),rgba(189,237,220,0.2),transparent_72%)] p-2">
          <CharacterImage asset={category.character} className="h-full w-full" imageClassName="object-contain transition group-hover:scale-105" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#665950]">{category.description}</p>
    </Link>
  );
}