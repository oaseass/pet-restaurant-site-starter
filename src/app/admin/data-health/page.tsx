import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

export const metadata: Metadata = {
  title: "데이터 헬스 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DataHealthPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  if (!isAdminAuthorized(secret)) {
    return <main className="mx-auto max-w-3xl px-5 py-10"><div className="card rounded-[2rem] p-6 text-sm leading-7 text-[#665950]">관리자 인증이 필요합니다. query string으로 secret을 전달해 주세요.</div></main>;
  }

  async function reviewLostPet(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const lostPetId = String(formData.get("lostPetId") ?? "");
    const action = String(formData.get("action") ?? "");
    if (!isAdminAuthorized(submittedSecret) || !lostPetId) {
      redirect("/admin/data-health");
    }

    if (action === "approve") {
      await prisma.lostPet.update({
        where: { id: lostPetId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });
    } else if (action === "found") {
      await prisma.lostPet.update({
        where: { id: lostPetId },
        data: { status: "FOUND", approvedAt: new Date() },
      });
    } else if (action === "close") {
      await prisma.lostPet.update({
        where: { id: lostPetId },
        data: { status: "CLOSED" },
      });
    }

    revalidatePath("/lost-pets");
    revalidatePath(`/lost-pets/${lostPetId}`);
    revalidatePath("/admin/data-health");
    redirect(`/admin/data-health?secret=${encodeURIComponent(submittedSecret)}`);
  }

  async function reviewBusinessClaim(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const claimId = String(formData.get("claimId") ?? "");
    const action = String(formData.get("action") ?? "");
    if (!isAdminAuthorized(submittedSecret) || !claimId) {
      redirect("/admin/data-health");
    }

    const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      redirect(`/admin/data-health?secret=${encodeURIComponent(submittedSecret)}`);
    }

    if (action === "approve") {
      await prisma.businessClaim.update({
        where: { id: claimId },
        data: { status: "APPROVED", approvedAt: new Date() },
      });

      if (claim.placeId) {
        await prisma.place.update({
          where: { id: claim.placeId },
          data: { ownerVerified: true, updatedAt: new Date() },
        }).catch(() => undefined);
      }
    } else if (action === "reject") {
      await prisma.businessClaim.update({
        where: { id: claimId },
        data: { status: "REJECTED" },
      });
    }

    revalidatePath("/business");
    revalidatePath("/business/claim");
    revalidatePath("/admin/data-health");
    redirect(`/admin/data-health?secret=${encodeURIComponent(submittedSecret)}`);
  }

  async function reviewPriceReport(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const reportId = String(formData.get("reportId") ?? "");
    const action = String(formData.get("action") ?? "");
    if (!isAdminAuthorized(submittedSecret) || !reportId) {
      redirect("/admin/data-health");
    }

    const report = await prisma.priceReport.findUnique({ where: { id: reportId } });
    if (!report) {
      redirect(`/admin/data-health?secret=${encodeURIComponent(submittedSecret)}`);
    }

    if (action === "approve") {
      await prisma.priceReport.update({
        where: { id: reportId },
        data: { status: "APPROVED" },
      });

      if (report.placeId && report.price) {
        await prisma.placeProfile.upsert({
          where: { placeId: report.placeId },
          update: {
            priceText: `${report.itemName} ${report.price.toLocaleString("ko-KR")}원 참고`,
            ownerUpdatedAt: new Date(),
          },
          create: {
            placeId: report.placeId,
            priceText: `${report.itemName} ${report.price.toLocaleString("ko-KR")}원 참고`,
            ownerUpdatedAt: new Date(),
          },
        });
      }
    } else if (action === "reject") {
      await prisma.priceReport.update({
        where: { id: reportId },
        data: { status: "REJECTED" },
      });
    }

    revalidatePath("/report");
    revalidatePath("/admin/data-health");
    redirect(`/admin/data-health?secret=${encodeURIComponent(submittedSecret)}`);
  }

  const [restaurantCount, placeCount, lostPetCount, pendingClaims, pendingReports, lastLogs, pendingLostPets, claimItems, reportItems] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.lostPet.count({ where: { status: "PENDING" } }),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.priceReport.count({ where: { status: "PENDING" } }),
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
    prisma.lostPet.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 10 }),
    prisma.businessClaim.findMany({ where: { status: "PENDING" }, orderBy: { submittedAt: "asc" }, take: 10, include: { place: true } }),
    prisma.priceReport.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 10, include: { place: true } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">데이터 헬스</h1>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat title="식당" value={restaurantCount.toLocaleString("ko-KR")} />
        <Stat title="장소" value={placeCount.toLocaleString("ko-KR")} />
        <Stat title="실종 대기" value={lostPetCount.toLocaleString("ko-KR")} />
        <Stat title="업체 요청 대기" value={pendingClaims.toLocaleString("ko-KR")} />
        <Stat title="가격 제보 대기" value={pendingReports.toLocaleString("ko-KR")} />
      </section>

      <section className="mt-6 card rounded-[2rem] p-6">
        <h2 className="text-2xl font-black">최근 동기화</h2>
        <div className="mt-4 space-y-3">
          {lastLogs.map((log) => (
            <div key={log.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black">{log.source}</p>
                  <p className="mt-1 text-[#665950]">{log.startedAt.toLocaleString("ko-KR")} · {log.mode}</p>
                </div>
                <SyncStatusBadge status={log.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">실종 대기</h2>
            <span className="badge">{pendingLostPets.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {pendingLostPets.length > 0 ? pendingLostPets.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <p className="font-black">{item.petName}</p>
                <p className="mt-1 text-[#665950]">{item.lostSido}{item.lostSigungu ? ` · ${item.lostSigungu}` : ""}</p>
                <p className="mt-1 line-clamp-2 text-[#665950]">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ReviewButtonForm action={reviewLostPet} secret={secret} hiddenName="lostPetId" hiddenValue={item.id} submitValue="approve" label="공개" tone="approve" />
                  <ReviewButtonForm action={reviewLostPet} secret={secret} hiddenName="lostPetId" hiddenValue={item.id} submitValue="found" label="찾음" tone="neutral" />
                  <ReviewButtonForm action={reviewLostPet} secret={secret} hiddenName="lostPetId" hiddenValue={item.id} submitValue="close" label="비공개" tone="reject" />
                </div>
              </div>
            )) : <p className="text-sm text-[#665950]">현재 대기 중인 실종 제보가 없습니다.</p>}
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">업체 요청 대기</h2>
            <span className="badge">{claimItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {claimItems.length > 0 ? claimItems.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <p className="font-black">{item.businessName}</p>
                <p className="mt-1 text-[#665950]">{item.requestType} · {item.ownerName}</p>
                <p className="mt-1 text-[#665950]">{item.place?.name ? `연결 장소 ${item.place.name}` : "신규 등록형 요청"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ReviewButtonForm action={reviewBusinessClaim} secret={secret} hiddenName="claimId" hiddenValue={item.id} submitValue="approve" label="승인" tone="approve" />
                  <ReviewButtonForm action={reviewBusinessClaim} secret={secret} hiddenName="claimId" hiddenValue={item.id} submitValue="reject" label="반려" tone="reject" />
                </div>
              </div>
            )) : <p className="text-sm text-[#665950]">현재 대기 중인 업체 요청이 없습니다.</p>}
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">가격 제보 대기</h2>
            <span className="badge">{reportItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {reportItems.length > 0 ? reportItems.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <p className="font-black">{item.itemName}</p>
                <p className="mt-1 text-[#665950]">{item.place?.name ?? item.category}</p>
                <p className="mt-1 text-[#665950]">{item.price ? `${item.price.toLocaleString("ko-KR")}원` : "가격 미입력"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ReviewButtonForm action={reviewPriceReport} secret={secret} hiddenName="reportId" hiddenValue={item.id} submitValue="approve" label="승인" tone="approve" />
                  <ReviewButtonForm action={reviewPriceReport} secret={secret} hiddenName="reportId" hiddenValue={item.id} submitValue="reject" label="반려" tone="reject" />
                </div>
              </div>
            )) : <p className="text-sm text-[#665950]">현재 대기 중인 가격 제보가 없습니다.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function ReviewButtonForm({
  action,
  secret,
  hiddenName,
  hiddenValue,
  submitValue,
  label,
  tone,
}: {
  action: (formData: FormData) => Promise<void>;
  secret?: string;
  hiddenName: string;
  hiddenValue: string;
  submitValue: string;
  label: string;
  tone: "approve" | "reject" | "neutral";
}) {
  const className = tone === "approve"
    ? "bg-[var(--brand)] text-white"
    : tone === "reject"
      ? "bg-[#fff0f0] text-[#b13f3f]"
      : "bg-[#f3f0ec] text-[#5f5550]";

  return (
    <form action={action}>
      <input type="hidden" name="secret" value={secret} />
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button type="submit" name="action" value={submitValue} className={`rounded-full px-4 py-2 text-xs font-black ${className}`.trim()}>
        {label}
      </button>
    </form>
  );
}