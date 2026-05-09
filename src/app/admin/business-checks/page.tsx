import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPerformAdminAction, formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { getRecentApprovedBusinessCheckTargetIds } from "@/lib/business-checks";
import {
  BUSINESS_CHECK_RESULTS,
  BUSINESS_CHECK_RESULT_LABELS,
  BUSINESS_CHECK_TYPES,
  BUSINESS_CHECK_TYPE_LABELS,
  RECENT_BUSINESS_CHECK_DAYS,
  formatBusinessCheckDate,
  type BusinessCheckResultValue,
  type BusinessCheckTypeValue,
} from "@/lib/business-checks-shared";
import { getBusinessEnrichmentSnapshot } from "@/lib/business-enrichment";
import {
  buildReviewHref,
  formatDiscoveryDate,
  getBusinessExternalCategory,
  getBusinessExternalHref,
  getBusinessPhone,
  getInformationCompletenessSummary,
  getPublicReviewSummary,
  getTrustedBusinessEnrichment,
  hasUsableCoordinates,
  needsInformationCompletenessWork,
  type InformationCompletenessGrade,
  type InformationCompletenessSummary,
} from "@/lib/discovery-cards";
import { getPlacesLightSnapshot, getRestaurantsLightSnapshot, getReviewSummariesSnapshot, toRestaurantCardItem } from "@/lib/public-data";
import { PLACE_CATEGORY_LABELS } from "@/lib/platform-content";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "확인 제보 검수 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminBusinessChecksSearchParams = {
  secret?: string;
  status?: string;
  q?: string;
  view?: string;
};

type BusinessCheckStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
type AdminBusinessChecksView = "CHECKS" | "GAPS";

type AdminGapQueueItem = {
  targetType: "RESTAURANT" | "PLACE";
  targetId: string;
  targetLabel: string;
  targetName: string;
  targetAddress: string;
  targetPhone: string | null;
  regionLabel: string;
  detailHref: string;
  reportHref: string;
  reviewHref: string;
  updatedAtLabel: string;
  updatedAtTime: number;
  categoryPriority: number;
  summary: InformationCompletenessSummary;
};

const REQUIRED_ROLES = ["SUPER_ADMIN", "REVIEWER", "OPERATIONS_ADMIN", "CONTENT_ADMIN"] as const;
const RECOMMENDED_PLACE_CATEGORIES = ["ANIMAL_HOSPITAL", "PHARMACY", "GROOMING", "DAYCARE", "FUNERAL"] as const;
const RECOMMENDED_CATEGORY_PRIORITY = new Map<string, number>(RECOMMENDED_PLACE_CATEGORIES.map((category, index) => [category, index]));
const GAP_GRADE_PRIORITY: Record<InformationCompletenessGrade, number> = {
  NEEDS_CHECK: 0,
  C: 1,
  B: 2,
  A: 3,
  S: 4,
};
const GAP_BADGE_CLASSES: Record<InformationCompletenessGrade, string> = {
  NEEDS_CHECK: "bg-[#fff5e8] text-[#8a4b00]",
  C: "bg-[#fff1f0] text-[#b42318]",
  B: "bg-[#fff7e6] text-[#ad6800]",
  A: "bg-[#edf7ed] text-[#166534]",
  S: "bg-[#ecfeff] text-[#155e75]",
};

function getAdminPlaceCategoryLabel(category: string) {
  return PLACE_CATEGORY_LABELS[category as keyof typeof PLACE_CATEGORY_LABELS] ?? category;
}

function normalizeStatus(value?: string): BusinessCheckStatusFilter {
  if (value === "APPROVED" || value === "REJECTED" || value === "ALL") return value;
  return "PENDING";
}

function normalizeView(value?: string): AdminBusinessChecksView {
  return value === "gaps" ? "GAPS" : "CHECKS";
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

async function createBusinessCheckAction(formData: FormData) {
  "use server";

  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "").trim();
  const checkType = String(formData.get("checkType") ?? "");
  const result = String(formData.get("result") ?? "");
  const status = String(formData.get("status") ?? "") === "PENDING" ? "PENDING" : "APPROVED";
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  if (
    (targetType !== "RESTAURANT" && targetType !== "PLACE") ||
    !targetId ||
    !BUSINESS_CHECK_TYPES.includes(checkType as BusinessCheckTypeValue) ||
    !BUSINESS_CHECK_RESULTS.includes(result as BusinessCheckResultValue)
  ) {
    redirect(safeReturnTo);
  }

  const targetExists = targetType === "RESTAURANT"
    ? await prisma.restaurant.findFirst({ where: { id: targetId, status: "ACTIVE" }, select: { id: true } })
    : await prisma.place.findFirst({ where: { id: targetId, isActive: true }, select: { id: true } });

  if (!targetExists) {
    redirect(safeReturnTo);
  }

  const rawCheckedAt = String(formData.get("checkedAt") ?? "").trim();
  const parsedCheckedAt = rawCheckedAt ? new Date(`${rawCheckedAt}T00:00:00+09:00`) : new Date();
  const now = new Date();
  const checkedAt = Number.isNaN(parsedCheckedAt.getTime()) || parsedCheckedAt > now ? now : parsedCheckedAt;

  const check = await prisma.businessCheck.create({
    data: {
      targetType,
      targetId,
      checkType: checkType as BusinessCheckTypeValue,
      result: result as BusinessCheckResultValue,
      checkedAt,
      note: note || null,
      status,
    },
    select: { targetType: true, targetId: true },
  });

  revalidateBusinessCheckTarget(check.targetType, check.targetId);
  revalidateBusinessCheckLists();
  revalidatePath("/admin/business-checks");
  redirect(safeReturnTo);
}

async function setBusinessCheckStatusAction(formData: FormData) {
  "use server";

  const checkId = String(formData.get("checkId") ?? "");
  const status = String(formData.get("status") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if ((status !== "APPROVED" && status !== "REJECTED") || !(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const check = await prisma.businessCheck.update({
    where: { id: checkId },
    data: { status },
    select: { targetType: true, targetId: true },
  });

  revalidateBusinessCheckTarget(check.targetType, check.targetId);
  revalidateBusinessCheckLists();
  revalidatePath("/admin/business-checks");
  redirect(safeReturnTo);
}

async function deleteBusinessCheckAction(formData: FormData) {
  "use server";

  const checkId = String(formData.get("checkId") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const check = await prisma.businessCheck.delete({
    where: { id: checkId },
    select: { targetType: true, targetId: true },
  });

  revalidateBusinessCheckTarget(check.targetType, check.targetId);
  revalidateBusinessCheckLists();
  revalidatePath("/admin/business-checks");
  redirect(safeReturnTo);
}

export default async function AdminBusinessChecksPage({ searchParams }: { searchParams: Promise<AdminBusinessChecksSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  const status = normalizeStatus(resolvedSearchParams.status);
  const view = normalizeView(resolvedSearchParams.view);
  const targetQuery = String(resolvedSearchParams.q ?? "").trim();
  const returnTo = buildAdminBusinessChecksPath({ secret, status, q: targetQuery, view });
  const access = await requireAdminPageAccess({ secret, requiredRoles: [...REQUIRED_ROLES], returnTo });
  const where = status === "ALL" ? {} : { status };
  const today = new Date().toISOString().slice(0, 10);
  const canSearchTargets = targetQuery.length >= 2;
  const checkedAfter = new Date(Date.now() - RECENT_BUSINESS_CHECK_DAYS * 24 * 60 * 60 * 1000);

  const recentPlaceChecks = await prisma.businessCheck.findMany({
    where: { targetType: "PLACE", status: "APPROVED", checkedAt: { gte: checkedAfter } },
    distinct: ["targetId"],
    select: { targetId: true },
  });
  const recentPlaceIds = recentPlaceChecks.map((item) => item.targetId);

  const [checks, pendingCount, approvedCount, rejectedCount, recommendedPlaceCandidates, targetRestaurants, targetPlaces] = await Promise.all([
    prisma.businessCheck.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.businessCheck.count({ where: { status: "PENDING" } }),
    prisma.businessCheck.count({ where: { status: "APPROVED" } }),
    prisma.businessCheck.count({ where: { status: "REJECTED" } }),
    prisma.place.findMany({
      where: {
        isActive: true,
        category: { in: [...RECOMMENDED_PLACE_CATEGORIES] },
        phone: { not: null },
        lat: { not: null },
        lng: { not: null },
        ...(recentPlaceIds.length > 0 ? { id: { notIn: recentPlaceIds } } : {}),
      },
      orderBy: [{ ownerVerified: "desc" }, { updatedAt: "desc" }],
      take: 80,
      select: { id: true, category: true, name: true, address: true, roadAddress: true, phone: true, sido: true, sigungu: true, ownerVerified: true, updatedAt: true },
    }),
    canSearchTargets
      ? prisma.restaurant.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { name: { contains: targetQuery, mode: "insensitive" } },
              { address: { contains: targetQuery, mode: "insensitive" } },
              { sido: { contains: targetQuery, mode: "insensitive" } },
              { sigungu: { contains: targetQuery, mode: "insensitive" } },
            ],
          },
          orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
          take: 8,
          select: { id: true, name: true, address: true, sido: true, sigungu: true },
        })
      : Promise.resolve([]),
    canSearchTargets
      ? prisma.place.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: targetQuery, mode: "insensitive" } },
              { address: { contains: targetQuery, mode: "insensitive" } },
              { roadAddress: { contains: targetQuery, mode: "insensitive" } },
              { phone: { contains: targetQuery, mode: "insensitive" } },
              { sido: { contains: targetQuery, mode: "insensitive" } },
              { sigungu: { contains: targetQuery, mode: "insensitive" } },
            ],
          },
          orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
          take: 12,
          select: { id: true, category: true, name: true, address: true, roadAddress: true, phone: true, sido: true, sigungu: true },
        })
      : Promise.resolve([]),
  ]);
  const recommendedPlaces = [...recommendedPlaceCandidates]
    .sort((left, right) => {
      const priorityCompare = (RECOMMENDED_CATEGORY_PRIORITY.get(left.category) ?? 99) - (RECOMMENDED_CATEGORY_PRIORITY.get(right.category) ?? 99);
      if (priorityCompare !== 0) return priorityCompare;
      const verifiedCompare = Number(right.ownerVerified) - Number(left.ownerVerified);
      if (verifiedCompare !== 0) return verifiedCompare;
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    })
    .slice(0, 12);

  const restaurantIds = checks.filter((item) => item.targetType === "RESTAURANT").map((item) => item.targetId);
  const placeIds = checks.filter((item) => item.targetType === "PLACE").map((item) => item.targetId);
  const [restaurants, places] = await Promise.all([
    restaurantIds.length > 0
      ? prisma.restaurant.findMany({ where: { id: { in: restaurantIds } }, select: { id: true, name: true, address: true, sido: true, sigungu: true } })
      : [],
    placeIds.length > 0
      ? prisma.place.findMany({ where: { id: { in: placeIds } }, select: { id: true, name: true, address: true, roadAddress: true, sido: true, sigungu: true } })
      : [],
  ]);
  const restaurantMap = new Map(restaurants.map((item) => [item.id, item]));
  const placeMap = new Map(places.map((item) => [item.id, item]));
  const gapQueue = view === "GAPS" ? await buildAdminGapQueue() : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Operations Queue</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">{view === "GAPS" ? "보강 필요 업체 큐" : "전화·운영 확인 제보 검수"}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{view === "GAPS" ? "정보 완성도 B/C/확인 필요 업체를 모아 운영자가 무엇부터 보강할지 바로 보게 합니다." : "사용자가 직접 전화하거나 방문해 확인한 결과만 승인 후 상세 페이지의 정보 완성도에 반영합니다."}</p>
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">접근 계정 {access.email} · {formatAdminRoles(access.roles)}</p>
          </div>
          <a href={buildAdminBusinessChecksPath({ secret, status, q: targetQuery, view })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">현재 탭 새로고침</a>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <ViewLink
          title="확인 제보 검수"
          description="사용자 제보 승인·거절과 직접 확인 등록을 관리합니다."
          active={view === "CHECKS"}
          href={buildAdminBusinessChecksPath({ secret, status, q: targetQuery, view: "CHECKS" })}
        />
        <ViewLink
          title="보강 필요 업체"
          description="정보 완성도 B/C/확인 필요 업체를 우선순위로 모아 보여줍니다."
          active={view === "GAPS"}
          href={buildAdminBusinessChecksPath({ secret, status, q: targetQuery, view: "GAPS" })}
        />
      </section>

      {view === "GAPS" && gapQueue ? (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-4">
            <SummaryStat title="보강 필요 전체" value={gapQueue.totalCount} tone="brand" />
            <SummaryStat title="확인 필요" value={gapQueue.gradeCounts.NEEDS_CHECK ?? 0} tone="danger" />
            <SummaryStat title="정보 완성도 C" value={gapQueue.gradeCounts.C ?? 0} tone="danger" />
            <SummaryStat title="정보 완성도 B" value={gapQueue.gradeCounts.B ?? 0} tone="warning" />
          </section>

          <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Information Queue</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">오늘 먼저 보강할 업체</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">정보 완성도 낮은 순서와 빠진 항목 수를 기준으로 우선순위를 정했습니다. 현재는 상위 {gapQueue.items.length.toLocaleString("ko-KR")}곳을 먼저 보여줍니다.</p>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-4 py-2 text-xs font-black text-[var(--brand)]">{gapQueue.totalCount.toLocaleString("ko-KR")}곳 대상</span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {gapQueue.items.length > 0 ? gapQueue.items.map((item) => <GapQueueCard key={`${item.targetType}:${item.targetId}`} item={item} />) : (
                <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[#f8faf9] p-5 text-center text-sm font-black text-[var(--muted)]">지금 바로 보강할 업체가 없습니다.</div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-4">
            <StatusLink title="대기" value={pendingCount} active={status === "PENDING"} href={buildAdminBusinessChecksPath({ secret, status: "PENDING", q: targetQuery, view })} />
            <StatusLink title="승인" value={approvedCount} active={status === "APPROVED"} href={buildAdminBusinessChecksPath({ secret, status: "APPROVED", q: targetQuery, view })} />
            <StatusLink title="거절" value={rejectedCount} active={status === "REJECTED"} href={buildAdminBusinessChecksPath({ secret, status: "REJECTED", q: targetQuery, view })} />
            <StatusLink title="전체" value={pendingCount + approvedCount + rejectedCount} active={status === "ALL"} href={buildAdminBusinessChecksPath({ secret, status: "ALL", q: targetQuery, view })} />
          </section>

          <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Today Queue</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">오늘 확인할 업체 추천</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">전화번호와 좌표가 있고 최근 {RECENT_BUSINESS_CHECK_DAYS}일 안에 승인 확인이 없는 업체를 먼저 보여줍니다.</p>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-4 py-2 text-xs font-black text-[var(--brand)]">{recommendedPlaces.length.toLocaleString("ko-KR")}곳 추천</span>
            </div>
            <div className="mt-5 grid gap-3">
              {recommendedPlaces.length > 0 ? recommendedPlaces.map((target) => (
                <QuickTargetCard
                  key={`recommended-${target.id}`}
                  action={createBusinessCheckAction}
                  targetType="PLACE"
                  targetId={target.id}
                  targetLabel={getAdminPlaceCategoryLabel(target.category)}
                  targetName={target.name}
                  targetAddress={target.roadAddress ?? target.address ?? "주소 없음"}
                  targetPhone={target.phone}
                  regionLabel={[target.sido, target.sigungu].filter(Boolean).join(" ")}
                  detailHref={`/places/${target.id}`}
                  secret={secret}
                  returnTo={returnTo}
                  today={today}
                />
              )) : (
                <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[#f8faf9] p-5 text-center text-sm font-black text-[var(--muted)]">추천할 미확인 업체가 없습니다.</div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Find Target</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">업체 검색 후 확인 등록</h2>
              </div>
              {targetQuery ? <a href={buildAdminBusinessChecksPath({ secret, status, view })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">검색 초기화</a> : null}
            </div>
            <form method="GET" className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input type="hidden" name="secret" value={secret ?? ""} />
              {status !== "PENDING" ? <input type="hidden" name="status" value={status} /> : null}
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                이름, 주소, 전화번호
                <input type="search" name="q" defaultValue={targetQuery} className="input rounded-xl text-sm" placeholder="예: 정선가축병원, 1004 약국, 강남" />
              </label>
              <div className="flex items-end">
                <button type="submit" className="min-h-10 rounded-full bg-[var(--brand)] px-5 text-xs font-black text-white">검색</button>
              </div>
            </form>

            {targetQuery && !canSearchTargets ? (
              <p className="mt-4 rounded-lg bg-[#f8faf9] px-4 py-3 text-sm font-bold text-[var(--muted)]">검색어는 2글자 이상 입력해 주세요.</p>
            ) : null}

            {canSearchTargets ? (
              <div className="mt-5 grid gap-3">
                {targetRestaurants.length === 0 && targetPlaces.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[#f8faf9] p-5 text-center text-sm font-black text-[var(--muted)]">검색된 업체가 없습니다.</div>
                ) : null}
                {targetRestaurants.map((target) => (
                  <QuickTargetCard
                    key={`restaurant-${target.id}`}
                    action={createBusinessCheckAction}
                    targetType="RESTAURANT"
                    targetId={target.id}
                    targetLabel="식당"
                    targetName={target.name}
                    targetAddress={target.address}
                    regionLabel={[target.sido, target.sigungu].filter(Boolean).join(" ")}
                    detailHref={`/restaurants/${target.id}`}
                    secret={secret}
                    returnTo={returnTo}
                    today={today}
                  />
                ))}
                {targetPlaces.map((target) => (
                  <QuickTargetCard
                    key={`place-${target.id}`}
                    action={createBusinessCheckAction}
                    targetType="PLACE"
                    targetId={target.id}
                    targetLabel={target.category}
                    targetName={target.name}
                    targetAddress={target.roadAddress ?? target.address ?? "주소 없음"}
                    targetPhone={target.phone}
                    regionLabel={[target.sido, target.sigungu].filter(Boolean).join(" ")}
                    detailHref={`/places/${target.id}`}
                    secret={secret}
                    returnTo={returnTo}
                    today={today}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Direct Check</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">운영 확인 직접 등록</h2>
              </div>
              <a href={buildAdminBusinessChecksPath({ secret, status: "APPROVED", view })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">승인 목록 보기</a>
            </div>
            <form action={createBusinessCheckAction} className="mt-5 grid gap-3 lg:grid-cols-[140px_minmax(220px,1fr)_150px_160px_150px_140px]">
              <input type="hidden" name="secret" value={secret ?? ""} />
              <input type="hidden" name="returnTo" value={buildAdminBusinessChecksPath({ secret, status: "APPROVED", view })} />
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                대상
                <select name="targetType" className="input rounded-xl text-sm" defaultValue="PLACE">
                  <option value="PLACE">장소</option>
                  <option value="RESTAURANT">식당</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                대상 ID
                <input name="targetId" required className="input rounded-xl text-sm" placeholder="상세 URL의 ID" />
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                방식
                <select name="checkType" className="input rounded-xl text-sm" defaultValue="PHONE_CALL">
                  {BUSINESS_CHECK_TYPES.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_TYPE_LABELS[item]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                결과
                <select name="result" className="input rounded-xl text-sm" defaultValue="CONFIRMED_OPEN">
                  {BUSINESS_CHECK_RESULTS.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_RESULT_LABELS[item]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                확인일
                <input type="date" name="checkedAt" max={today} defaultValue={today} required className="input rounded-xl text-sm" />
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                상태
                <select name="status" className="input rounded-xl text-sm" defaultValue="APPROVED">
                  <option value="APPROVED">바로 승인</option>
                  <option value="PENDING">대기 등록</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)] lg:col-span-5">
                메모
                <input name="note" maxLength={300} className="input rounded-xl text-sm" placeholder="예: 통화로 오늘 운영 확인" />
              </label>
              <div className="flex items-end">
                <button type="submit" className="min-h-10 w-full rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">등록</button>
              </div>
            </form>
          </section>

          <section className="mt-6 grid gap-4">
            {checks.length > 0 ? checks.map((check) => {
              const restaurant = check.targetType === "RESTAURANT" ? restaurantMap.get(check.targetId) : null;
              const place = check.targetType === "PLACE" ? placeMap.get(check.targetId) : null;
              const targetName = restaurant?.name ?? place?.name ?? "대상 정보 없음";
              const targetAddress = restaurant?.address ?? place?.roadAddress ?? place?.address ?? "주소 없음";
              const targetHref = check.targetType === "RESTAURANT" ? `/restaurants/${check.targetId}` : `/places/${check.targetId}`;
              const resultLabel = BUSINESS_CHECK_RESULT_LABELS[check.result as BusinessCheckResultValue];
              const typeLabel = BUSINESS_CHECK_TYPE_LABELS[check.checkType as BusinessCheckTypeValue];

              return (
                <article key={check.id} className="rounded-[1rem] border border-[var(--line)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
                        <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">{check.status}</span>
                        <span>{check.targetType === "RESTAURANT" ? "식당" : "장소"}</span>
                        <span>{check.createdAt.toLocaleString("ko-KR")}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{resultLabel}</h2>
                      <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                        <a href={targetHref} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line-strong)] underline-offset-4">{targetName}</a>
                        {targetAddress ? ` · ${targetAddress}` : ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#fafdf9] px-4 py-3 text-sm font-black text-[var(--ink)]">
                      {typeLabel} · {formatBusinessCheckDate(check.checkedAt.toISOString())}
                    </div>
                  </div>

                  {check.note ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4f5a55]">{check.note}</p> : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {check.status !== "APPROVED" ? <BusinessCheckActionButton action={setBusinessCheckStatusAction} checkId={check.id} secret={secret} returnTo={returnTo} status="APPROVED" label="승인" style="primary" /> : null}
                    {check.status !== "REJECTED" ? <BusinessCheckActionButton action={setBusinessCheckStatusAction} checkId={check.id} secret={secret} returnTo={returnTo} status="REJECTED" label="거절" /> : null}
                    <form action={deleteBusinessCheckAction}>
                      <input type="hidden" name="checkId" value={check.id} />
                      <input type="hidden" name="secret" value={secret ?? ""} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className="rounded-full border border-[#fecaca] bg-white px-4 py-2 text-xs font-black text-[#b91c1c]">삭제</button>
                    </form>
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-[1rem] border border-dashed border-[var(--line-strong)] bg-white p-8 text-center text-sm font-black text-[var(--muted)]">선택한 상태의 확인 제보가 없습니다.</div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

async function buildAdminGapQueue(): Promise<{
  totalCount: number;
  gradeCounts: Partial<Record<InformationCompletenessGrade, number>>;
  items: AdminGapQueueItem[];
}> {
  const [restaurantsLight, placesLight, enrichmentSnapshot, reviewSnapshot, recentRestaurantIds, recentPlaceIds] = await Promise.all([
    getRestaurantsLightSnapshot(),
    getPlacesLightSnapshot(),
    getBusinessEnrichmentSnapshot(),
    getReviewSummariesSnapshot(),
    getRecentApprovedBusinessCheckTargetIds("RESTAURANT"),
    getRecentApprovedBusinessCheckTargetIds("PLACE"),
  ]);

  const restaurantItems = restaurantsLight
    .map((restaurantLight) => {
      const restaurant = toRestaurantCardItem(restaurantLight);
      const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "RESTAURANT", restaurant.id);
      const review = getPublicReviewSummary(reviewSnapshot, "RESTAURANT", restaurant.id);
      const phone = getBusinessPhone(null, enrichment);
      const summary = getInformationCompletenessSummary({
        hasSource: restaurant.officialRegistered,
        phone,
        externalHref: getBusinessExternalHref(enrichment),
        externalCategory: getBusinessExternalCategory(enrichment),
        reviewCount: review?.count,
        hasCoordinates: hasUsableCoordinates(restaurant.lat, restaurant.lng),
        hasPhoto: Boolean(enrichment?.googlePhotoName),
        hasBusinessCheck: recentRestaurantIds.has(restaurant.id),
        hasUpdatedAt: Boolean(restaurant.dataUpdatedAt),
      });
      if (!needsInformationCompletenessWork(summary)) return null;
      return {
        targetType: "RESTAURANT" as const,
        targetId: restaurant.id,
        targetLabel: "식당",
        targetName: restaurant.name,
        targetAddress: restaurant.address,
        targetPhone: phone,
        regionLabel: [restaurant.sido, restaurant.sigungu].filter(Boolean).join(" "),
        detailHref: `/restaurants/${restaurant.id}`,
        reportHref: `/report?type=restaurant&id=${restaurant.id}&name=${encodeURIComponent(restaurant.name)}`,
        reviewHref: buildReviewHref("RESTAURANT", restaurant.id),
        updatedAtLabel: formatDiscoveryDate(restaurant.dataUpdatedAt),
        updatedAtTime: restaurant.dataUpdatedAt.getTime(),
        categoryPriority: 99,
        summary,
      } satisfies AdminGapQueueItem;
    })
    .filter(isPresent);

  const placeItems = placesLight
    .map((place) => {
      const enrichment = getTrustedBusinessEnrichment(enrichmentSnapshot, "PLACE", place.id, place.category);
      const review = getPublicReviewSummary(reviewSnapshot, "PLACE", place.id);
      const phone = getBusinessPhone(place.phone, enrichment);
      const summary = getInformationCompletenessSummary({
        hasSource: Boolean(place.sourceName),
        phone,
        externalHref: getBusinessExternalHref(enrichment),
        externalCategory: getBusinessExternalCategory(enrichment),
        reviewCount: review?.count,
        hasCoordinates: hasUsableCoordinates(place.lat, place.lng),
        hasPhoto: Boolean(enrichment?.googlePhotoName),
        hasBusinessCheck: recentPlaceIds.has(place.id),
        hasUpdatedAt: Boolean(place.updatedAt),
      });
      if (!needsInformationCompletenessWork(summary)) return null;
      return {
        targetType: "PLACE" as const,
        targetId: place.id,
        targetLabel: getAdminPlaceCategoryLabel(place.category),
        targetName: place.name,
        targetAddress: place.roadAddress ?? place.address ?? "주소 없음",
        targetPhone: phone,
        regionLabel: [place.sido, place.sigungu].filter(Boolean).join(" "),
        detailHref: `/places/${place.id}`,
        reportHref: `/report?type=place&id=${place.id}&name=${encodeURIComponent(place.name)}`,
        reviewHref: buildReviewHref("PLACE", place.id),
        updatedAtLabel: formatDiscoveryDate(place.updatedAt),
        updatedAtTime: new Date(place.updatedAt).getTime(),
        categoryPriority: RECOMMENDED_CATEGORY_PRIORITY.get(place.category) ?? 50,
        summary,
      } satisfies AdminGapQueueItem;
    })
    .filter(isPresent);

  const allItems: AdminGapQueueItem[] = [...placeItems, ...restaurantItems].sort(compareGapQueueItems);
  const gradeCounts = allItems.reduce<Partial<Record<InformationCompletenessGrade, number>>>((counts, item) => {
    counts[item.summary.grade] = (counts[item.summary.grade] ?? 0) + 1;
    return counts;
  }, {});

  return {
    totalCount: allItems.length,
    gradeCounts,
    items: allItems.slice(0, 24),
  };
}

function compareGapQueueItems(left: AdminGapQueueItem, right: AdminGapQueueItem) {
  const gradeCompare = GAP_GRADE_PRIORITY[left.summary.grade] - GAP_GRADE_PRIORITY[right.summary.grade];
  if (gradeCompare !== 0) return gradeCompare;
  const missingCompare = right.summary.missingLabels.length - left.summary.missingLabels.length;
  if (missingCompare !== 0) return missingCompare;
  const categoryCompare = left.categoryPriority - right.categoryPriority;
  if (categoryCompare !== 0) return categoryCompare;
  return left.updatedAtTime - right.updatedAtTime;
}

function BusinessCheckActionButton({ action, checkId, secret, returnTo, status, label, style }: {
  action: (formData: FormData) => Promise<void>;
  checkId: string;
  secret?: string;
  returnTo: string;
  status: "APPROVED" | "REJECTED";
  label: string;
  style?: "primary";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="checkId" value={checkId} />
      <input type="hidden" name="secret" value={secret ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={style === "primary" ? "rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white" : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]"}>{label}</button>
    </form>
  );
}

function QuickTargetCard({ action, targetType, targetId, targetLabel, targetName, targetAddress, targetPhone, regionLabel, detailHref, secret, returnTo, today }: {
  action: (formData: FormData) => Promise<void>;
  targetType: "RESTAURANT" | "PLACE";
  targetId: string;
  targetLabel: string;
  targetName: string;
  targetAddress: string;
  targetPhone?: string | null;
  regionLabel: string;
  detailHref: string;
  secret?: string;
  returnTo: string;
  today: string;
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[#fbfcf8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">{targetLabel}</span>
            {regionLabel ? <span>{regionLabel}</span> : null}
          </div>
          <a href={detailHref} target="_blank" rel="noopener noreferrer" className="mt-2 block text-lg font-black text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            {targetName}
          </a>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--muted)]">{targetAddress}</p>
          {targetPhone ? (
            <a href={`tel:${targetPhone.replace(/\s+/g, "")}`} className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--brand)] ring-1 ring-[var(--line)]">
              {targetPhone}
            </a>
          ) : null}
          <p className="mt-1 break-all text-[11px] font-bold text-[var(--muted)]">{targetId}</p>
        </div>
      </div>
      <form action={action} className="mt-4 grid gap-2 md:grid-cols-[140px_160px_150px_minmax(180px,1fr)_auto]">
        <input type="hidden" name="secret" value={secret ?? ""} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="status" value="APPROVED" />
        <label className="space-y-1 text-[11px] font-black text-[var(--muted)]">
          방식
          <select name="checkType" className="input rounded-xl text-sm" defaultValue="PHONE_CALL">
            {BUSINESS_CHECK_TYPES.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_TYPE_LABELS[item]}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[11px] font-black text-[var(--muted)]">
          결과
          <select name="result" className="input rounded-xl text-sm" defaultValue="CONFIRMED_OPEN">
            {BUSINESS_CHECK_RESULTS.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_RESULT_LABELS[item]}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[11px] font-black text-[var(--muted)]">
          확인일
          <input type="date" name="checkedAt" max={today} defaultValue={today} required className="input rounded-xl text-sm" />
        </label>
        <label className="space-y-1 text-[11px] font-black text-[var(--muted)]">
          메모
          <input name="note" maxLength={300} className="input rounded-xl text-sm" placeholder="예: 통화로 운영 확인" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="min-h-10 w-full rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">확인 등록</button>
        </div>
      </form>
    </article>
  );
}

function GapQueueCard({ item }: { item: AdminGapQueueItem }) {
  return (
    <article className="rounded-[1rem] border border-[var(--line)] bg-[#fbfcf8] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">{item.targetLabel}</span>
            {item.regionLabel ? <span>{item.regionLabel}</span> : null}
            <span>최근 반영 {item.updatedAtLabel}</span>
          </div>
          <a href={item.detailHref} target="_blank" rel="noopener noreferrer" className="mt-3 block text-lg font-black text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            {item.targetName}
          </a>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">{item.targetAddress}</p>
          {item.targetPhone ? <p className="mt-2 text-xs font-black text-[var(--brand)]">{item.targetPhone}</p> : null}
        </div>
        <div className="min-w-[148px] rounded-xl bg-white p-3 text-right ring-1 ring-[var(--line)]">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${GAP_BADGE_CLASSES[item.summary.grade]}`}>{item.summary.badgeLabel}</span>
          <p className="mt-2 text-sm font-black text-[var(--ink)]">{item.summary.score}/{item.summary.total} · {item.summary.levelLabel}</p>
        </div>
      </div>

      {item.summary.gapLabel ? <p className="mt-4 text-sm font-black leading-6 text-[#7c5a10]">{item.summary.gapLabel}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.summary.missingLabels.slice(0, 5).map((label) => (
          <span key={`${item.targetId}-${label}`} className="rounded-full bg-[#f3f4f6] px-3 py-1 text-[11px] font-black text-[var(--muted)]">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={item.detailHref} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white">상세 보기</a>
        <a href={item.reportHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">정보 보강</a>
        <a href={item.reviewHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">후기 남기기</a>
      </div>
    </article>
  );
}

function SummaryStat({ title, value, tone }: { title: string; value: number; tone?: "brand" | "warning" | "danger" }) {
  const toneClass = tone === "danger"
    ? "border-[#fecaca] bg-[#fff7f7]"
    : tone === "warning"
      ? "border-[#fcd34d] bg-[#fffaf0]"
      : "border-[var(--brand)] bg-[var(--brand-soft)]";
  return (
    <div className={`rounded-[1rem] border p-4 ${toneClass}`}>
      <p className="text-xs font-black text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-black text-[var(--ink)]">{value.toLocaleString("ko-KR")}</p>
    </div>
  );
}

function ViewLink({ title, description, active, href }: { title: string; description: string; active: boolean; href: string }) {
  return (
    <a href={href} className={active ? "rounded-[1rem] border border-[var(--brand)] bg-[var(--brand-soft)] p-4" : "rounded-[1rem] border border-[var(--line)] bg-white p-4"}>
      <p className="text-sm font-black text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </a>
  );
}

function StatusLink({ title, value, active, href }: { title: string; value: number; active: boolean; href: string }) {
  return (
    <a href={href} className={active ? "rounded-[1rem] border border-[var(--brand)] bg-[var(--brand-soft)] p-4" : "rounded-[1rem] border border-[var(--line)] bg-white p-4"}>
      <p className="text-xs font-black text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-black text-[var(--ink)]">{value.toLocaleString("ko-KR")}</p>
    </a>
  );
}

function revalidateBusinessCheckTarget(targetType: string, targetId: string) {
  if (targetType === "RESTAURANT") {
    revalidatePath(`/restaurants/${targetId}`);
  }
  if (targetType === "PLACE") {
    revalidatePath(`/places/${targetId}`);
  }
}

function revalidateBusinessCheckLists() {
  revalidatePath("/restaurants");
  revalidatePath("/places");
  revalidatePath("/hospitals");
  revalidatePath("/pharmacy");
  revalidatePath("/grooming");
  revalidatePath("/daycare");
  revalidatePath("/funeral");
}

function buildAdminBusinessChecksPath({ secret, status, q, view }: { secret?: string; status?: BusinessCheckStatusFilter; q?: string; view?: AdminBusinessChecksView }) {
  const params = new URLSearchParams();
  if (secret) params.set("secret", secret);
  if (view === "GAPS") params.set("view", "gaps");
  if (status && status !== "PENDING") params.set("status", status);
  if (q?.trim()) params.set("q", q.trim());
  const query = params.toString();
  return query ? `/admin/business-checks?${query}` : "/admin/business-checks";
}

function getSafeReturnTo(value: string, secret?: string) {
  if (value.startsWith("/admin/business-checks")) return value;
  return buildAdminBusinessChecksPath({ secret });
}
