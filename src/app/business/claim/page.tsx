import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function maskDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  return `${digits.slice(0, 3)}${"*".repeat(Math.max(2, digits.length - 5))}${digits.slice(-2)}`;
}

export default async function BusinessClaimPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const params = await searchParams;

  async function submitClaim(formData: FormData) {
    "use server";

    const businessName = String(formData.get("businessName") ?? "").trim();
    const ownerName = String(formData.get("ownerName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const registration = String(formData.get("registration") ?? "").trim();
    const requestType = String(formData.get("requestType") ?? "").trim();
    const placeId = String(formData.get("placeId") ?? "").trim();

    if (!businessName || !ownerName || !phone || !requestType) {
      redirect("/business/claim?error=필수 항목을 확인하세요.");
    }

    await prisma.businessClaim.create({
      data: {
        placeId: placeId || null,
        businessName,
        ownerName,
        phoneMasked: maskDigits(phone),
        businessRegistrationNumberMasked: registration ? maskDigits(registration) : "미입력",
        requestType,
      },
    });

    revalidatePath("/admin/data-health");
    redirect("/business/claim?submitted=1");
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Claim</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">업체 등록·정정 요청</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">공개 전 내부 검수를 거치며, 사업자 정보는 마스킹하여 저장합니다.</p>
          {params.submitted ? <p className="mt-4 rounded-[1.2rem] bg-[rgba(31,74,64,0.1)] px-4 py-3 text-sm font-bold text-[var(--brand)]">요청이 접수되었습니다.</p> : null}
          {params.error ? <p className="mt-4 rounded-[1.2rem] bg-[#ffe9e9] px-4 py-3 text-sm font-bold text-[#b13f3f]">{params.error}</p> : null}
        </div>
      </section>

      <form action={submitClaim} className="mt-6 grid gap-4 rounded-[2rem] card p-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">업체명<input name="businessName" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">대표자명<input name="ownerName" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">연락처<input name="phone" required className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">사업자등록번호<input name="registration" className="input" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">기존 placeId<input name="placeId" className="input" placeholder="있으면 입력" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">요청 유형<select name="requestType" className="input" defaultValue="신규 등록"><option value="신규 등록">신규 등록</option><option value="정보 수정">정보 수정</option><option value="인증 요청">인증 요청</option></select></label>
        <button type="submit" className="btn-primary md:col-span-2 md:w-fit">요청 보내기</button>
      </form>
    </main>
  );
}