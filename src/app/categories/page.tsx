import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { absoluteUrl } from "@/lib/brand";
import { QUICK_CATEGORIES } from "@/lib/platform-content";

export const metadata: Metadata = {
  title: "전체 카테고리 | 댕냥지도",
  description: "식당, 병원, 약국, 미용, 유치원, 장례, 찾아요, 가이드까지 필요한 반려생활 카테고리로 바로 이동하세요.",
  alternates: { canonical: absoluteUrl("/categories") },
};

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

      <section className="mt-10 rounded-[2rem] border border-[var(--line)] bg-white p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Derived Categories</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--ink)]">숙소·쇼핑 파생 카테고리</h2>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">유치원·호텔 데이터 안에서도 숙소형 업체는 확인할 조건이 달라서 펜션, 호텔, 캠핑으로 다시 나눠 보기 쉽게 열었습니다.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/pension" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <p className="text-xs font-black text-[var(--brand)]">숙소</p>
            <h3 className="mt-3 text-2xl font-black text-[var(--ink)]">애견동반 펜션</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">객실 정책과 추가 요금, 침구 규정이 중요한 숙소형 후보를 따로 봅니다.</p>
          </Link>
          <Link href="/hotel" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <p className="text-xs font-black text-[var(--brand)]">숙소</p>
            <h3 className="mt-3 text-2xl font-black text-[var(--ink)]">호텔·리조트</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">객실 타입과 부대시설 규정이 중요한 호텔형 숙소를 따로 봅니다.</p>
          </Link>
          <Link href="/camping" className="rounded-[1.6rem] border border-[var(--line)] bg-[#fffaf5] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <p className="text-xs font-black text-[var(--brand)]">숙소</p>
            <h3 className="mt-3 text-2xl font-black text-[var(--ink)]">캠핑장·글램핑</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">동반 구역, 공용공간 규칙, 야간 이용 규정이 중요한 장소를 따로 봅니다.</p>
          </Link>
          <Link href="/supplies" className="rounded-[1.6rem] border border-dashed border-[var(--line)] bg-[#fcfaf7] p-5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
            <p className="text-xs font-black text-[var(--brand)]">쇼핑</p>
            <h3 className="mt-3 text-2xl font-black text-[var(--ink)]">반려동물 용품점</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">전용 공개 원천을 붙이기 전까지는 허브 페이지와 체크포인트부터 먼저 엽니다.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}