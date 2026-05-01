import Link from "next/link";
import { CALCULATOR_CARDS } from "@/lib/platform-content";

export default function CalculatorsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Calculators</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">생활 계산기</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">예방접종 일정, 월 양육비, 사료 급여량처럼 자주 계산하는 항목을 빠르게 확인합니다.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {CALCULATOR_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="card rounded-[1.8rem] p-5 transition hover:-translate-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Calculator</p>
            <h2 className="mt-3 text-xl font-black">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#665950]">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}