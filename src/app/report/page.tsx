import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PriceNote } from "@/components/PriceNote";

const reportSchema = z.object({
  placeId: z.string().optional(),
  category: z.string().min(1),
  itemName: z.string().min(1),
  price: z.string().optional(),
  receiptImageUrl: z.string().optional(),
  reportNote: z.string().optional(),
  sourceType: z.enum(["USER_REPORT", "OWNER_SUBMISSION", "ADMIN_VERIFIED"]),
});

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;

  async function submitReport(formData: FormData) {
    "use server";

    const raw = Object.fromEntries(formData.entries());
    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
      redirect("/report?error=입력값을 확인하세요.");
    }

    const price = parsed.data.price ? Number(String(parsed.data.price).replace(/[^0-9]/g, "")) : null;

    await prisma.priceReport.create({
      data: {
        placeId: parsed.data.placeId || null,
        category: parsed.data.category as never,
        itemName: parsed.data.itemName,
        price: Number.isFinite(price) ? price : null,
        receiptImageUrl: parsed.data.receiptImageUrl || null,
        reportNote: parsed.data.reportNote || null,
        sourceType: parsed.data.sourceType,
      },
    });

    revalidatePath("/admin/data-health");
    redirect("/report?submitted=1");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Report</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">가격·정보 제보</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">진료비, 미용비, 장례비 등 참고용 가격과 운영 정보를 제보할 수 있습니다.</p>
          {params.submitted ? <p className="mt-4 rounded-[1.2rem] bg-[rgba(31,74,64,0.1)] px-4 py-3 text-sm font-bold text-[var(--brand)]">제보가 접수되었습니다.</p> : null}
          {params.error ? <p className="mt-4 rounded-[1.2rem] bg-[#ffe9e9] px-4 py-3 text-sm font-bold text-[#b13f3f]">{params.error}</p> : null}
        </div>
      </section>

      <form action={submitReport} className="mt-6 grid gap-4 rounded-[2rem] card p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">placeId<input name="placeId" className="input" placeholder="선택 입력" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">카테고리<select name="category" className="input" defaultValue="SURGERY"><option value="SURGERY">수술·진료비</option><option value="GROOMING">미용</option><option value="DAYCARE">유치원</option><option value="FUNERAL">장례</option><option value="PHARMACY">약국</option><option value="TRAINING">훈련</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">항목명<input name="itemName" required className="input" placeholder="예: 중성화 수술" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">가격<input name="price" className="input" placeholder="예: 250000" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">출처 유형<select name="sourceType" className="input" defaultValue="USER_REPORT"><option value="USER_REPORT">사용자 제보</option><option value="OWNER_SUBMISSION">업체 등록</option><option value="ADMIN_VERIFIED">관리자 확인</option></select></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">영수증 URL<input name="receiptImageUrl" className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c] md:col-span-2">메모<textarea name="reportNote" className="input min-h-28 py-4" placeholder="지역, 옵션, 포함 항목을 적어 주세요." /></label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">제보 보내기</button>
      </form>

      <div className="mt-6"><PriceNote /></div>
    </main>
  );
}