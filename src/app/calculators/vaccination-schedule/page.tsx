import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { calculateVaccinationSchedule, vaccinationInputSchema } from "@/lib/calculators";

function getDefaultInput(searchParams: Awaited<Promise<Record<string, string | undefined>>>) {
  const parsed = vaccinationInputSchema.safeParse({
    animalType: searchParams.animalType ?? "dog",
    birthDate: searchParams.birthDate,
    adoptionDate: searchParams.adoptionDate,
    lastVaccinationDate: searchParams.lastVaccinationDate,
  });

  return parsed.success ? parsed.data : { animalType: "dog" as const, birthDate: "", adoptionDate: "", lastVaccinationDate: "" };
}

export default async function VaccinationSchedulePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const input = getDefaultInput(params);
  const result = calculateVaccinationSchedule(input);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">계산기</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">예방접종 일정 계산기</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">월령과 최근 접종일을 기준으로 다음에 확인할 접종 흐름을 빠르게 정리합니다.</p>
        </div>
      </section>

      <form className="mt-6 card grid gap-4 rounded-[1rem] p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">
          동물 종류
          <select name="animalType" defaultValue={input.animalType} className="input">
            <option value="dog">강아지</option>
            <option value="cat">고양이</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">
          생년월일
          <input type="date" name="birthDate" defaultValue={input.birthDate ?? ""} className="input" />
        </label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">
          입양일
          <input type="date" name="adoptionDate" defaultValue={input.adoptionDate ?? ""} className="input" />
        </label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">
          최근 접종일
          <input type="date" name="lastVaccinationDate" defaultValue={input.lastVaccinationDate ?? ""} className="input" />
        </label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">일정 계산</button>
      </form>

      <section className="mt-6 card rounded-[1rem] p-6">
        <div className="flex flex-wrap gap-2">
          <span className="badge">현재 월령 {result.currentStage}</span>
          <span className="badge">최근 접종 {result.lastVaccinationLabel}</span>
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight">다음 확인 포인트</h2>
        <p className="mt-3 text-base font-bold text-[var(--brand)]">{result.nextVaccination}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article>
            <h3 className="text-lg font-black">접종 전</h3>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
              {result.precautionsBefore.map((item) => <li key={item}>· {item}</li>)}
            </ul>
          </article>
          <article>
            <h3 className="text-lg font-black">접종 후</h3>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
              {result.precautionsAfter.map((item) => <li key={item}>· {item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <div className="mt-6"><MedicalDisclaimer /></div>
    </main>
  );
}