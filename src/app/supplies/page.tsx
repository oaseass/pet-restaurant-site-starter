import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot } from "@/lib/public-data";
import { getPlaceExperienceChecklist } from "@/lib/place-experience";

export const metadata = {
  title: "반려동물 용품점 | 댕냥지도",
  description: "반려동물 용품점을 위한 전용 카테고리 허브입니다. 공개 장소 스냅샷 연동 전까지는 체크포인트와 가이드 중심으로 제공합니다.",
};

const SHOP_CHECKLIST = getPlaceExperienceChecklist("SHOP");

export default async function SuppliesPage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="section-shell px-6 py-6 sm:px-8 sm:py-8">
          <p className="eyebrow">Pet Supplies</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">반려동물 용품점</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#655a53] sm:text-base">용품점은 별도 공개 원천을 아직 정리 중이라, 지금은 전용 허브와 체크포인트부터 먼저 엽니다. 재고와 교환 정책은 매장마다 달라 방문 전 확인이 중요합니다.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
            <span className="badge">재고 확인 우선</span>
            <span className="badge">교환·환불 조건 체크</span>
            <span className="badge">동반 가능 여부 확인</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-6">
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-8 text-center text-sm font-bold leading-7 text-[var(--muted)]">
          공개 place 스냅샷에는 아직 용품점 카테고리 원천이 충분히 연결되지 않았습니다. 우선은 용품 가이드와 지도 전체 검색을 함께 쓰는 쪽이 더 정확합니다.
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-10 md:grid-cols-2">
        <Link href="/guide/pet-supply" className="rounded-2xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Guide</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">용품 가이드 보기</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">이동장, 급여, 생활용품을 고를 때 체크할 기준을 먼저 정리해 둔 가이드입니다.</p>
        </Link>
        <Link href="/map?q=용품점" className="rounded-2xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Search</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">지도 전체 검색</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">공개 데이터에 별도 카테고리 원천이 붙기 전까지는 키워드 검색이 가장 안전합니다.</p>
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">방문 전 확인</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">용품점 방문 전 확인사항</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)] sm:grid-cols-2">
            {SHOP_CHECKLIST.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      </section>
    </PublicPageShell>
  );
}