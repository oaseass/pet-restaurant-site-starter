import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { calculateFeedingAmount, feedingInputSchema } from "@/lib/calculators";

function parseInput(searchParams: Awaited<Promise<Record<string, string | undefined>>>) {
  const parsed = feedingInputSchema.safeParse({
    animalType: searchParams.animalType ?? "dog",
    weightKg: searchParams.weightKg ?? 5,
    ageYears: searchParams.ageYears ?? 2,
    neutered: searchParams.neutered ?? "yes",
    activityLevel: searchParams.activityLevel ?? "normal",
    foodKcalPer100g: searchParams.foodKcalPer100g ?? 350,
  });

  return parsed.success ? parsed.data : { animalType: "dog" as const, weightKg: 5, ageYears: 2, neutered: "yes" as const, activityLevel: "normal" as const, foodKcalPer100g: 350 };
}

export default async function FeedingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const input = parseInput(params);
  const result = calculateFeedingAmount(input);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Calculator</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">사료 급여량 계산기</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">몸무게와 활동량, 사료 열량을 기준으로 하루 급여량과 1회 급여량을 계산합니다.</p>
        </div>
      </section>

      <form className="mt-6 grid gap-4 rounded-[2rem] card p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">동물 종류<select name="animalType" defaultValue={input.animalType} className="input"><option value="dog">강아지</option><option value="cat">고양이</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">몸무게(kg)<input type="number" step="0.1" name="weightKg" defaultValue={input.weightKg} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">나이(년)<input type="number" step="0.1" name="ageYears" defaultValue={input.ageYears} className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">중성화 여부<select name="neutered" defaultValue={input.neutered} className="input"><option value="yes">예</option><option value="no">아니오</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">활동량<select name="activityLevel" defaultValue={input.activityLevel} className="input"><option value="low">낮음</option><option value="normal">보통</option><option value="high">높음</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">사료 열량(kcal/100g)<input type="number" step="1" name="foodKcalPer100g" defaultValue={input.foodKcalPer100g} className="input" /></label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">급여량 계산</button>
      </form>

      <section className="mt-6 card rounded-[2rem] p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">하루 필요 kcal</p><p className="mt-2 text-2xl font-black">{result.dailyKcal}</p></div>
          <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">하루 급여량</p><p className="mt-2 text-2xl font-black">{result.dailyGrams}g</p></div>
          <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">2회 급여 기준</p><p className="mt-2 text-2xl font-black">{result.perMealGrams}g</p></div>
        </div>
        <ul className="mt-6 space-y-2 text-sm leading-7 text-[#665950]">
          {result.notes.map((note) => <li key={note}>· {note}</li>)}
        </ul>
      </section>

      <div className="mt-6"><MedicalDisclaimer /></div>
    </main>
  );
}