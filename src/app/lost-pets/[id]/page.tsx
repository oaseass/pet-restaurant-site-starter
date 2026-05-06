import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { maskContact } from "@/lib/lost-pets";
import { SourceBadge } from "@/components/SourceBadge";

export const dynamic = "force-dynamic";

export default async function LostPetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; reported?: string }>;
}) {
  const { id } = await params;
  const ui = await searchParams;
  const item = await prisma.lostPet.findUnique({ where: { id }, include: { reports: { orderBy: { createdAt: "desc" } } } });
  if (!item) notFound();

  async function submitReport(formData: FormData) {
    "use server";

    const reporterName = String(formData.get("reporterName") ?? "").trim();
    const reporterContact = String(formData.get("reporterContact") ?? "").trim();
    const seenAt = String(formData.get("seenAt") ?? "").trim();
    const seenAddress = String(formData.get("seenAddress") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!reporterName || !reporterContact || !seenAt || !seenAddress || description.length < 5) {
      redirect(`/lost-pets/${id}`);
    }

    await prisma.lostPetReport.create({
      data: {
        lostPetId: id,
        reporterName,
        reporterContactMasked: maskContact(reporterContact),
        seenAt: new Date(seenAt),
        seenAddress,
        description,
      },
    });

    revalidatePath(`/lost-pets/${id}`);
    redirect(`/lost-pets/${id}?reported=1`);
  }

  const photoUrls = Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <SourceBadge label={item.status === "FOUND" ? "찾음 처리" : item.status === "APPROVED" ? "공개 중" : "검수 대기"} tone={item.status === "FOUND" ? "owner" : item.status === "APPROVED" ? "user" : "manual"} />
            <SourceBadge label={`연락처 ${item.contactMasked}`} tone="manual" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{item.petName}</h1>
          <p className="mt-4 text-sm leading-7 text-[#665950]">{item.lostAddress} · {new Date(item.lostAt).toLocaleDateString("ko-KR")}</p>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">{item.description}</p>
          {ui.submitted ? <p className="mt-4 rounded-[1.2rem] bg-[rgba(31,74,64,0.1)] px-4 py-3 text-sm font-bold text-[var(--brand)]">등록이 완료되었습니다. 내부 검수 후 공개 상태가 반영됩니다.</p> : null}
          {ui.reported ? <p className="mt-4 rounded-[1.2rem] bg-[rgba(31,74,64,0.1)] px-4 py-3 text-sm font-bold text-[var(--brand)]">목격 제보가 접수되었습니다.</p> : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          {photoUrls.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {photoUrls.map((url) => <img key={url} src={url} alt={item.petName} className="h-64 w-full rounded-[1.8rem] object-cover" />)}
            </div>
          ) : null}
          <article className="card rounded-[2rem] p-6">
            <h2 className="text-xl font-black">기본 정보</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="종류" value={item.animalType} />
              <Info label="품종" value={item.breed ?? "미입력"} />
              <Info label="성별" value={item.sex ?? "미입력"} />
              <Info label="나이" value={item.age ?? "미입력"} />
            </div>
          </article>
        </div>

        <form id="report" action={submitReport} className="card rounded-[2rem] p-6 scroll-mt-24">
          <h2 className="text-xl font-black">목격 제보 남기기</h2>
          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm font-bold text-[#4b423c]">이름<input name="reporterName" required className="input" /></label>
            <label className="space-y-2 text-sm font-bold text-[#4b423c]">연락 수단<input name="reporterContact" required className="input" /></label>
            <label className="space-y-2 text-sm font-bold text-[#4b423c]">목격 날짜<input type="datetime-local" name="seenAt" required className="input" /></label>
            <label className="space-y-2 text-sm font-bold text-[#4b423c]">목격 위치<input name="seenAddress" required className="input" /></label>
            <label className="space-y-2 text-sm font-bold text-[#4b423c]">설명<textarea name="description" required className="input min-h-28 py-4" /></label>
            <button type="submit" className="btn-primary w-fit">제보 보내기</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-xs font-black text-[#9b8d81]">{label}</p>
      <p className="mt-1 font-bold text-[#3f352f]">{value}</p>
    </div>
  );
}