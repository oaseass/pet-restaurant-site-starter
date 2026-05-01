import { PriceNote } from "@/components/PriceNote";
import { calculateMonthlyCost, monthlyCostInputSchema } from "@/lib/calculators";

function parseInput(searchParams: Awaited<Promise<Record<string, string | undefined>>>) {
  const parsed = monthlyCostInputSchema.safeParse({
    animalType: searchParams.animalType ?? "dog",
    weightKg: searchParams.weightKg ?? 0,
    ageYears: searchParams.ageYears ?? 0,
    foodCost: searchParams.foodCost ?? 0,
    snackCost: searchParams.snackCost ?? 0,
    groomingCost: searchParams.groomingCost ?? 0,
    hospitalCost: searchParams.hospitalCost ?? 0,
    daycareCost: searchParams.daycareCost ?? 0,
    insuranceCost: searchParams.insuranceCost ?? 0,
    otherCost: searchParams.otherCost ?? 0,
  });

  return parsed.success
    ? parsed.data
    : { animalType: "dog" as const, weightKg: 0, ageYears: 0, foodCost: 0, snackCost: 0, groomingCost: 0, hospitalCost: 0, daycareCost: 0, insuranceCost: 0, otherCost: 0 };
}

export default async function MonthlyCostPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const input = parseInput(params);
  const result = calculateMonthlyCost(input);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">계산기</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">월 양육비 계산기</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">사료비, 병원비, 미용비, 유치원 비용까지 월별 예산을 대략적으로 잡을 수 있습니다.</p>
        </div>
      </section>

      <form className="mt-6 grid gap-4 rounded-[1rem] card p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">동물 종류<select name="animalType" defaultValue={input.animalType} className="input"><option value="dog">강아지</option><option value="cat">고양이</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">몸무게(kg)<input type="number" step="0.1" name="weightKg" defaultValue={input.weightKg} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">나이(년)<input type="number" step="1" name="ageYears" defaultValue={input.ageYears} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">사료비<input type="number" name="foodCost" defaultValue={input.foodCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">간식비<input type="number" name="snackCost" defaultValue={input.snackCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">미용비<input type="number" name="groomingCost" defaultValue={input.groomingCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">병원비<input type="number" name="hospitalCost" defaultValue={input.hospitalCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">유치원/호텔비<input type="number" name="daycareCost" defaultValue={input.daycareCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">보험료<input type="number" name="insuranceCost" defaultValue={input.insuranceCost} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[var(--ink)]">기타<input type="number" name="otherCost" defaultValue={input.otherCost} className="input" /></label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">비용 계산</button>
      </form>

      <section className="mt-6 card rounded-[1rem] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1rem] bg-[var(--brand-soft)] p-5">
            <p className="text-sm font-bold text-[var(--muted)]">월 예상 비용</p>
            <p className="mt-2 text-3xl font-black">{result.monthlyTotal.toLocaleString("ko-KR")}원</p>
          </div>
          <div className="rounded-[1rem] bg-[var(--accent-soft)] p-5">
            <p className="text-sm font-bold text-[var(--muted)]">연 예상 비용</p>
            <p className="mt-2 text-3xl font-black">{result.yearlyTotal.toLocaleString("ko-KR")}원</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {result.breakdown.map((entry) => (
            <div key={entry.label} className="rounded-[1rem] border border-[var(--line)] bg-white p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-black">{entry.label}</span>
                <span className="font-bold">{entry.value.toLocaleString("ko-KR")}원 · {entry.percent}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{result.tip}</p>
      </section>

      <div className="mt-6"><PriceNote /></div>
    </main>
  );
}