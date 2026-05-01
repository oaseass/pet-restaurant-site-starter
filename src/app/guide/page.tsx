import { GuideCard } from "@/components/GuideCard";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { PriceNote } from "@/components/PriceNote";
import { AdSlot } from "@/components/AdSlot";
import { CALCULATOR_CARDS, GUIDE_DOCS, QUICK_CATEGORIES } from "@/lib/platform-content";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">생활 가이드</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">생활 가이드 허브</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">여행, 접종, 등록, 수술, 훈련, 미용, 급여, 장례까지 반려생활에서 자주 확인하는 정보를 한곳에 모았습니다.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GUIDE_DOCS.map((guide) => (
          <GuideCard
            key={guide.slug}
            title={guide.title}
            description={guide.summary}
            href={`/guide/${guide.slug}`}
            character={QUICK_CATEGORIES.find((item) => item.category === guide.category)?.character ?? "cat-waving"}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {CALCULATOR_CARDS.map((card) => (
          <article key={card.href} className="card rounded-[1rem] p-5">
            <p className="text-[11px] font-black text-[var(--brand)]">계산기</p>
            <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{card.title}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{card.description}</p>
            <a href={card.href} className="mt-4 inline-flex text-sm font-black text-[var(--brand)]">바로 계산하기</a>
          </article>
        ))}
      </section>

      <AdSlot label="가이드 페이지 광고 영역" />

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <OfficialDataNotice />
        <MedicalDisclaimer />
        <LegalDisclaimer />
      </section>

      <div className="mt-4"><PriceNote /></div>
    </main>
  );
}
