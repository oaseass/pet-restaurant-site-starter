import { CategoryCard } from "@/components/CategoryCard";
import { QUICK_CATEGORIES } from "@/lib/platform-content";

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">카테고리</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">전체 카테고리</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">식당, 병원, 미용, 유치원, 여행, 장례, 실종 제보까지 필요한 정보로 바로 이동할 수 있습니다.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_CATEGORIES.map((category) => <CategoryCard key={category.href} category={category} />)}
      </section>
    </main>
  );
}