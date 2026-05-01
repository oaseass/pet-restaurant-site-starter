import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLostPetSubmission, lostPetFormSchema } from "@/lib/lost-pets";
import { REGION_OPTIONS } from "@/lib/platform-content";

export default async function LostPetNewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  async function submitLostPet(formData: FormData) {
    "use server";

    const raw = Object.fromEntries(formData.entries());
    const parsed = lostPetFormSchema.safeParse(raw);
    if (!parsed.success) {
      redirect(`/lost-pets/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "입력값을 확인하세요.")}`);
    }

    const created = await createLostPetSubmission(parsed.data);
    revalidatePath("/lost-pets");
    redirect(`/lost-pets/${created.id}?submitted=1`);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Lost Pet Form</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">실종 제보 등록</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">연락처는 마스킹해 저장하고, 내부 검수 후 공개됩니다.</p>
          {params.error ? <p className="mt-4 rounded-[1.2rem] bg-[#ffe9e9] px-4 py-3 text-sm font-bold text-[#b13f3f]">{params.error}</p> : null}
        </div>
      </section>

      <form action={submitLostPet} className="mt-6 grid gap-4 rounded-[2rem] card p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">이름<input name="petName" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">종류<select name="animalType" defaultValue="강아지" className="input"><option value="강아지">강아지</option><option value="고양이">고양이</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">품종<input name="breed" className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">성별<input name="sex" className="input" placeholder="수컷 / 암컷 / 중성화" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">나이<input name="age" className="input" placeholder="3살 추정" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">사례금<input name="rewardAmount" className="input" placeholder="선택 입력" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">실종 시도<select name="lostSido" className="input" defaultValue="서울">{REGION_OPTIONS.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">실종 시군구<input name="lostSigungu" className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c] md:col-span-2">실종 위치<input name="lostAddress" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">실종 날짜<input type="date" name="lostAt" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">연락 수단<input name="contactValue" required className="input" placeholder="휴대전화 또는 이메일" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c] md:col-span-2">특징<textarea name="description" required className="input min-h-32 py-4" placeholder="마지막 목격 위치, 성격, 특징을 자세히 적어 주세요." /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c] md:col-span-2">사진 URL들<textarea name="photoUrlsText" className="input min-h-28 py-4" placeholder="줄바꿈 또는 쉼표로 여러 URL 입력" /></label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">실종 글 등록</button>
      </form>
    </main>
  );
}