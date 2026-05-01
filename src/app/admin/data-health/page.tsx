import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClaimStatus, LostPetStatus, ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

export const metadata: Metadata = {
  title: "데이터 헬스 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LOST_PET_FILTERS = ["PENDING", "APPROVED", "FOUND", "CLOSED", "ALL"] as const;
const CLAIM_FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
const REPORT_FILTERS = ["PENDING", "REVIEWED", "APPROVED", "REJECTED", "ALL"] as const;

const LOST_PET_STATUS_LABELS: Record<(typeof LOST_PET_FILTERS)[number], string> = {
  PENDING: "대기",
  APPROVED: "공개",
  FOUND: "찾음",
  CLOSED: "비공개",
  ALL: "전체",
};

const CLAIM_STATUS_LABELS: Record<(typeof CLAIM_FILTERS)[number], string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  ALL: "전체",
};

const REPORT_STATUS_LABELS: Record<(typeof REPORT_FILTERS)[number], string> = {
  PENDING: "대기",
  REVIEWED: "검토됨",
  APPROVED: "승인",
  REJECTED: "반려",
  ALL: "전체",
};

type DataHealthSearchParams = {
  secret?: string;
  q?: string;
  lostPetStatus?: string;
  claimStatus?: string;
  reportStatus?: string;
};

export default async function DataHealthPage({ searchParams }: { searchParams: Promise<DataHealthSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  if (!isAdminAuthorized(secret)) {
    return <main className="mx-auto max-w-3xl px-5 py-10"><div className="card rounded-[2rem] p-6 text-sm leading-7 text-[#665950]">관리자 인증이 필요합니다. query string으로 secret을 전달해 주세요.</div></main>;
  }

  const query = String(resolvedSearchParams.q ?? "").trim();
  const lostPetStatusFilter = getFilterValue(resolvedSearchParams.lostPetStatus, LOST_PET_FILTERS, "PENDING");
  const claimStatusFilter = getFilterValue(resolvedSearchParams.claimStatus, CLAIM_FILTERS, "PENDING");
  const reportStatusFilter = getFilterValue(resolvedSearchParams.reportStatus, REPORT_FILTERS, "PENDING");
  const returnTo = buildAdminDataHealthPath({
    secret,
    q: query,
    lostPetStatus: lostPetStatusFilter,
    claimStatus: claimStatusFilter,
    reportStatus: reportStatusFilter,
  });

  async function reviewLostPet(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const lostPetId = String(formData.get("lostPetId") ?? "");
    const action = String(formData.get("action") ?? "");
    const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);
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
    redirect(safeReturnTo);
  }

  async function reviewBusinessClaim(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const claimId = String(formData.get("claimId") ?? "");
    const action = String(formData.get("action") ?? "");
    const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);
    if (!isAdminAuthorized(submittedSecret) || !claimId) {
      redirect("/admin/data-health");
    }

    const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      redirect(safeReturnTo);
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
    redirect(safeReturnTo);
  }

  async function reviewPriceReport(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const reportId = String(formData.get("reportId") ?? "");
    const action = String(formData.get("action") ?? "");
    const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);
    if (!isAdminAuthorized(submittedSecret) || !reportId) {
      redirect("/admin/data-health");
    }

    const report = await prisma.priceReport.findUnique({ where: { id: reportId } });
    if (!report) {
      redirect(safeReturnTo);
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
    redirect(safeReturnTo);
  }

  const lostPetStatus = lostPetStatusFilter === "ALL" ? undefined : lostPetStatusFilter as LostPetStatus;
  const claimStatus = claimStatusFilter === "ALL" ? undefined : claimStatusFilter as ClaimStatus;
  const reportStatus = reportStatusFilter === "ALL" ? undefined : reportStatusFilter as ReportStatus;

  const lostPetSearchFilter = query
    ? {
        OR: [
          { petName: { contains: query, mode: "insensitive" as const } },
          { breed: { contains: query, mode: "insensitive" as const } },
          { lostSido: { contains: query, mode: "insensitive" as const } },
          { lostSigungu: { contains: query, mode: "insensitive" as const } },
          { lostAddress: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const claimSearchFilter = query
    ? {
        OR: [
          { businessName: { contains: query, mode: "insensitive" as const } },
          { ownerName: { contains: query, mode: "insensitive" as const } },
          { requestType: { contains: query, mode: "insensitive" as const } },
          { place: { is: { name: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const reportSearchFilter = query
    ? {
        OR: [
          { itemName: { contains: query, mode: "insensitive" as const } },
          { reportNote: { contains: query, mode: "insensitive" as const } },
          { place: { is: { name: { contains: query, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const [restaurantCount, placeCount, lostPetCount, pendingClaims, pendingReports, lastLogs, lostPetItems, claimItems, reportItems, recentLostPets, recentClaimsRaw, recentReports] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.lostPet.count({ where: { status: "PENDING" } }),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.priceReport.count({ where: { status: "PENDING" } }),
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
    prisma.lostPet.findMany({
      where: {
        ...(lostPetStatus ? { status: lostPetStatus } : {}),
        ...lostPetSearchFilter,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.businessClaim.findMany({
      where: {
        ...(claimStatus ? { status: claimStatus } : {}),
        ...claimSearchFilter,
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      take: 12,
      include: { place: true },
    }),
    prisma.priceReport.findMany({
      where: {
        ...(reportStatus ? { status: reportStatus } : {}),
        ...reportSearchFilter,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: { place: true },
    }),
    prisma.lostPet.findMany({
      where: {
        status: { not: "PENDING" },
        ...lostPetSearchFilter,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.businessClaim.findMany({
      where: {
        status: { not: "PENDING" },
        ...claimSearchFilter,
      },
      orderBy: { submittedAt: "desc" },
      take: 20,
      include: { place: true },
    }),
    prisma.priceReport.findMany({
      where: {
        status: { not: "PENDING" },
        ...reportSearchFilter,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { place: true },
    }),
  ]);

  const recentClaims = recentClaimsRaw
    .sort((left, right) => getClaimReviewedAt(right).getTime() - getClaimReviewedAt(left).getTime())
    .slice(0, 8);

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">검수 검색과 상태 필터</h2>
            <p className="mt-2 text-sm leading-7 text-[#665950]">이름, 업소명, 제보 메모 기준으로 검색하고 각 검수 큐를 상태별로 바로 좁힐 수 있습니다.</p>
          </div>
          <a href={buildAdminDataHealthPath({ secret })} className="rounded-full border border-[rgba(56,41,29,0.1)] px-4 py-2 text-xs font-black text-[#5f5550]">
            필터 초기화
          </a>
        </div>

        <form method="GET" className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_repeat(3,minmax(0,0.7fr))_auto]">
          <input type="hidden" name="secret" value={secret} />
          <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
            Search
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="반려동물 이름, 업체명, 장소명, 제보 메모"
              className="rounded-[1.2rem] border border-[rgba(56,41,29,0.1)] bg-white px-4 py-3 text-sm font-semibold tracking-normal text-[#2b211b] outline-none placeholder:text-[#9d8e82]"
            />
          </label>
          <FilterSelect name="lostPetStatus" label="실종 제보" value={lostPetStatusFilter} options={LOST_PET_FILTERS} labels={LOST_PET_STATUS_LABELS} />
          <FilterSelect name="claimStatus" label="업체 요청" value={claimStatusFilter} options={CLAIM_FILTERS} labels={CLAIM_STATUS_LABELS} />
          <FilterSelect name="reportStatus" label="가격 제보" value={reportStatusFilter} options={REPORT_FILTERS} labels={REPORT_STATUS_LABELS} />
          <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-white lg:self-end">
            적용
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#6f6257]">
          <span className="badge">실종 {LOST_PET_STATUS_LABELS[lostPetStatusFilter]}</span>
          <span className="badge">업체 {CLAIM_STATUS_LABELS[claimStatusFilter]}</span>
          <span className="badge">가격 {REPORT_STATUS_LABELS[reportStatusFilter]}</span>
          {query ? <span className="badge">검색어 {query}</span> : null}
        </div>
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
            <h2 className="text-xl font-black">실종 제보</h2>
            <span className="badge">{lostPetItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {lostPetItems.length > 0 ? lostPetItems.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">{item.petName}</p>
                  <ReviewStateBadge label={LOST_PET_STATUS_LABELS[item.status]} tone={item.status === "APPROVED" ? "approve" : item.status === "PENDING" ? "neutral" : "reject"} />
                </div>
                <p className="mt-1 text-[#665950]">{item.lostSido}{item.lostSigungu ? ` · ${item.lostSigungu}` : ""}</p>
                <p className="mt-1 line-clamp-2 text-[#665950]">{item.description}</p>
                {item.status !== "FOUND" && item.status !== "CLOSED" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status === "PENDING" ? <ReviewButtonForm action={reviewLostPet} secret={secret} returnTo={returnTo} hiddenName="lostPetId" hiddenValue={item.id} submitValue="approve" label="공개" tone="approve" /> : null}
                    <ReviewButtonForm action={reviewLostPet} secret={secret} returnTo={returnTo} hiddenName="lostPetId" hiddenValue={item.id} submitValue="found" label="찾음" tone="neutral" />
                    <ReviewButtonForm action={reviewLostPet} secret={secret} returnTo={returnTo} hiddenName="lostPetId" hiddenValue={item.id} submitValue="close" label="비공개" tone="reject" />
                  </div>
                ) : null}
              </div>
            )) : <p className="text-sm text-[#665950]">조건에 맞는 실종 제보가 없습니다.</p>}
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">업체 요청</h2>
            <span className="badge">{claimItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {claimItems.length > 0 ? claimItems.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">{item.businessName}</p>
                  <ReviewStateBadge label={CLAIM_STATUS_LABELS[item.status]} tone={item.status === "APPROVED" ? "approve" : item.status === "PENDING" ? "neutral" : "reject"} />
                </div>
                <p className="mt-1 text-[#665950]">{item.requestType} · {item.ownerName}</p>
                <p className="mt-1 text-[#665950]">{item.place?.name ? `연결 장소 ${item.place.name}` : "신규 등록형 요청"}</p>
                {item.status === "PENDING" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ReviewButtonForm action={reviewBusinessClaim} secret={secret} returnTo={returnTo} hiddenName="claimId" hiddenValue={item.id} submitValue="approve" label="승인" tone="approve" />
                    <ReviewButtonForm action={reviewBusinessClaim} secret={secret} returnTo={returnTo} hiddenName="claimId" hiddenValue={item.id} submitValue="reject" label="반려" tone="reject" />
                  </div>
                ) : null}
              </div>
            )) : <p className="text-sm text-[#665950]">조건에 맞는 업체 요청이 없습니다.</p>}
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">가격 제보</h2>
            <span className="badge">{reportItems.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {reportItems.length > 0 ? reportItems.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">{item.itemName}</p>
                  <ReviewStateBadge label={REPORT_STATUS_LABELS[item.status]} tone={item.status === "APPROVED" ? "approve" : item.status === "REJECTED" ? "reject" : "neutral"} />
                </div>
                <p className="mt-1 text-[#665950]">{item.place?.name ?? item.category}</p>
                <p className="mt-1 text-[#665950]">{item.price ? `${item.price.toLocaleString("ko-KR")}원` : "가격 미입력"}</p>
                {item.status === "PENDING" || item.status === "REVIEWED" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ReviewButtonForm action={reviewPriceReport} secret={secret} returnTo={returnTo} hiddenName="reportId" hiddenValue={item.id} submitValue="approve" label="승인" tone="approve" />
                    <ReviewButtonForm action={reviewPriceReport} secret={secret} returnTo={returnTo} hiddenName="reportId" hiddenValue={item.id} submitValue="reject" label="반려" tone="reject" />
                  </div>
                ) : null}
              </div>
            )) : <p className="text-sm text-[#665950]">조건에 맞는 가격 제보가 없습니다.</p>}
          </div>
        </article>
      </section>

      <section className="mt-6 card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">최근 처리 이력</h2>
            <p className="mt-2 text-sm leading-7 text-[#665950]">검수 완료된 항목을 최근 순으로 다시 확인할 수 있습니다.</p>
          </div>
          {query ? <span className="badge">검색어 {query}</span> : null}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <ReviewHistoryColumn
            title="실종 제보 이력"
            emptyMessage="최근 처리된 실종 제보가 없습니다."
            items={recentLostPets.map((item) => ({
              id: item.id,
              title: item.petName,
              subtitle: `${item.lostSido}${item.lostSigungu ? ` · ${item.lostSigungu}` : ""}`,
              statusLabel: LOST_PET_STATUS_LABELS[item.status],
              tone: item.status === "APPROVED" ? "approve" : "reject",
              reviewedAt: item.approvedAt ?? item.updatedAt,
              note: item.description,
            }))}
          />
          <ReviewHistoryColumn
            title="업체 요청 이력"
            emptyMessage="최근 처리된 업체 요청이 없습니다."
            items={recentClaims.map((item) => ({
              id: item.id,
              title: item.businessName,
              subtitle: item.place?.name ? `연결 장소 ${item.place.name}` : item.requestType,
              statusLabel: CLAIM_STATUS_LABELS[item.status],
              tone: item.status === "APPROVED" ? "approve" : "reject",
              reviewedAt: item.approvedAt ?? null,
              note: item.status === "REJECTED" && !item.approvedAt ? "반려 시각은 별도 기록하지 않아 접수 시각 기준으로 노출합니다." : `${item.ownerName} · ${item.requestType}`,
              fallbackDate: item.submittedAt,
            }))}
          />
          <ReviewHistoryColumn
            title="가격 제보 이력"
            emptyMessage="최근 처리된 가격 제보가 없습니다."
            items={recentReports.map((item) => ({
              id: item.id,
              title: item.itemName,
              subtitle: item.place?.name ?? item.category,
              statusLabel: REPORT_STATUS_LABELS[item.status],
              tone: item.status === "APPROVED" ? "approve" : item.status === "REJECTED" ? "reject" : "neutral",
              reviewedAt: item.updatedAt,
              note: item.price ? `${item.price.toLocaleString("ko-KR")}원` : item.reportNote ?? "가격 미입력",
            }))}
          />
        </div>
      </section>
    </main>
  );
}

function getFilterValue<T extends readonly string[]>(value: string | undefined, allowed: T, fallback: T[number]) {
  if (!value) return fallback;
  return allowed.includes(value as T[number]) ? value as T[number] : fallback;
}

function buildAdminDataHealthPath({
  secret,
  q,
  lostPetStatus,
  claimStatus,
  reportStatus,
}: {
  secret?: string;
  q?: string;
  lostPetStatus?: (typeof LOST_PET_FILTERS)[number];
  claimStatus?: (typeof CLAIM_FILTERS)[number];
  reportStatus?: (typeof REPORT_FILTERS)[number];
}) {
  const params = new URLSearchParams();
  if (secret) params.set("secret", secret);
  if (q) params.set("q", q);
  if (lostPetStatus && lostPetStatus !== "PENDING") params.set("lostPetStatus", lostPetStatus);
  if (claimStatus && claimStatus !== "PENDING") params.set("claimStatus", claimStatus);
  if (reportStatus && reportStatus !== "PENDING") params.set("reportStatus", reportStatus);
  const queryString = params.toString();
  return queryString ? `/admin/data-health?${queryString}` : "/admin/data-health";
}

function getSafeReturnTo(value: string, secret?: string) {
  if (value.startsWith("/admin/data-health")) {
    return value;
  }
  return buildAdminDataHealthPath({ secret });
}

function getClaimReviewedAt(item: { approvedAt: Date | null; submittedAt: Date }) {
  return item.approvedAt ?? item.submittedAt;
}

function formatAdminDate(value?: Date | null) {
  if (!value) return "시각 미기록";
  return value.toLocaleString("ko-KR");
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function FilterSelect({
  name,
  label,
  value,
  options,
  labels,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
      {label}
      <select name={name} defaultValue={value} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.1)] bg-white px-4 py-3 text-sm font-semibold tracking-normal text-[#2b211b] outline-none">
        {options.map((option) => (
          <option key={option} value={option}>{labels[option]}</option>
        ))}
      </select>
    </label>
  );
}

function ReviewStateBadge({ label, tone }: { label: string; tone: "approve" | "reject" | "neutral" }) {
  const className = tone === "approve"
    ? "bg-[rgba(31,74,64,0.09)] text-[var(--brand)]"
    : tone === "reject"
      ? "bg-[#fff0f0] text-[#b13f3f]"
      : "bg-[#f3f0ec] text-[#5f5550]";

  return <span className={`rounded-full px-3 py-1 text-[11px] font-black ${className}`.trim()}>{label}</span>;
}

function ReviewHistoryColumn({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    statusLabel: string;
    tone: "approve" | "reject" | "neutral";
    reviewedAt?: Date | null;
    fallbackDate?: Date | null;
    note: string;
  }>;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black">{title}</h3>
        <span className="badge">{items.length}건</span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.06)] bg-[#fffdfa] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black">{item.title}</p>
              <ReviewStateBadge label={item.statusLabel} tone={item.tone} />
            </div>
            <p className="mt-1 text-[#665950]">{item.subtitle}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#9d8e82]">{formatAdminDate(item.reviewedAt ?? item.fallbackDate)}</p>
            <p className="mt-2 text-sm leading-6 text-[#665950]">{item.note}</p>
          </div>
        )) : <p className="text-sm text-[#665950]">{emptyMessage}</p>}
      </div>
    </article>
  );
}

function ReviewButtonForm({
  action,
  secret,
  returnTo,
  hiddenName,
  hiddenValue,
  submitValue,
  label,
  tone,
}: {
  action: (formData: FormData) => Promise<void>;
  secret?: string;
  returnTo: string;
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
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button type="submit" name="action" value={submitValue} className={`rounded-full px-4 py-2 text-xs font-black ${className}`.trim()}>
        {label}
      </button>
    </form>
  );
}