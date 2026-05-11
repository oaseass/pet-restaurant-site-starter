import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPerformAdminAction, formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { getExternalReviewLinks } from "@/lib/external-review-links";
import {
  EXTERNAL_LINK_KIND_LABELS,
  getExternalLinkSourceLabel,
  inferExternalLinkKindFromHref,
  isAllowedExternalLinkHref,
  normalizeExternalLinkKind,
  normalizeExternalLinkText,
} from "@/lib/external-link-submissions";
import { PLACE_CATEGORY_LABELS } from "@/lib/platform-content";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "외부 링크 저장소 검수 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminExternalLinksSearchParams = {
  secret?: string;
  status?: string;
  q?: string;
  selectedType?: string;
  selectedId?: string;
  notice?: string;
  noticeTone?: string;
};

type ExternalLinkStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

type AdminExternalLinkTargetSearchItem = {
  targetType: "RESTAURANT" | "PLACE";
  targetId: string;
  targetLabel: string;
  targetName: string;
  targetAddress: string;
  regionLabel: string;
  detailHref: string;
  phone?: string | null;
};

const REQUIRED_ROLES = ["SUPER_ADMIN", "REVIEWER", "OPERATIONS_ADMIN", "CONTENT_ADMIN"] as const;

function normalizeStatus(value?: string): ExternalLinkStatusFilter {
  if (value === "APPROVED" || value === "REJECTED" || value === "ALL") return value;
  return "PENDING";
}

function normalizeTargetType(value?: string): "RESTAURANT" | "PLACE" | undefined {
  if (value === "RESTAURANT" || value === "PLACE") return value;
  return undefined;
}

function getAdminPlaceCategoryLabel(category: string) {
  return PLACE_CATEGORY_LABELS[category as keyof typeof PLACE_CATEGORY_LABELS] ?? category;
}

async function createExternalLinkAction(formData: FormData) {
  "use server";

  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const inputKind = String(formData.get("kind") ?? "").trim();
  const status: "APPROVED" | "PENDING" = String(formData.get("status") ?? "") === "APPROVED" ? "APPROVED" : "PENDING";
  const title = normalizeExternalLinkText(String(formData.get("title") ?? ""), 140);
  const sourceLabel = normalizeExternalLinkText(String(formData.get("sourceLabel") ?? ""), 60);
  const summary = normalizeExternalLinkText(String(formData.get("summary") ?? ""), 280);
  const rawPublishedAt = String(formData.get("publishedAt") ?? "").trim();

  if ((targetType !== "RESTAURANT" && targetType !== "PLACE") || !targetId || !href || !isAllowedExternalLinkHref(href)) {
    redirect(safeReturnTo);
  }

  const targetExists = targetType === "RESTAURANT"
    ? await prisma.restaurant.findFirst({ where: { id: targetId, status: "ACTIVE" }, select: { id: true } })
    : await prisma.place.findFirst({ where: { id: targetId, isActive: true }, select: { id: true } });

  if (!targetExists) {
    redirect(safeReturnTo);
  }

  const kind = inputKind ? normalizeExternalLinkKind(inputKind) : inferExternalLinkKindFromHref(href);
  const parsedPublishedAt = rawPublishedAt ? new Date(`${rawPublishedAt}T00:00:00+09:00`) : null;
  const publishedAt = parsedPublishedAt && !Number.isNaN(parsedPublishedAt.getTime()) ? parsedPublishedAt : null;

  const existing = await prisma.externalLinkSubmission.findFirst({
    where: { targetType: targetType as "RESTAURANT" | "PLACE", targetId, href },
    select: { id: true },
  });

  const payload = {
    title: title || `${targetType === "RESTAURANT" ? "식당" : "장소"} 외부 링크`,
    sourceLabel: sourceLabel || getExternalLinkSourceLabel(href),
    summary: summary || null,
    kind,
    publishedAt,
    status,
  };

  const link = existing
    ? await prisma.externalLinkSubmission.update({
      where: { id: existing.id },
      data: payload,
      select: { targetType: true, targetId: true },
    })
    : await prisma.externalLinkSubmission.create({
      data: {
        targetType: targetType as "RESTAURANT" | "PLACE",
        targetId,
        href,
        ...payload,
      },
      select: { targetType: true, targetId: true },
    });

  revalidateExternalLinkTarget(link.targetType, link.targetId);
  revalidatePath("/admin/external-links");
  redirect(appendNoticeToPath(
    safeReturnTo,
    "success",
    status === "APPROVED" ? "외부 링크를 바로 승인 등록했습니다." : "외부 링크 후보를 대기 등록했습니다.",
  ));
}

async function generateExternalLinkCandidatesAction(formData: FormData) {
  "use server";

  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "").trim();

  if ((targetType !== "RESTAURANT" && targetType !== "PLACE") || !targetId) {
    redirect(appendNoticeToPath(safeReturnTo, "error", "후보를 수집할 대상을 먼저 확인해 주세요."));
  }

  let links;
  let targetName = "";

  if (targetType === "RESTAURANT") {
    const target = await prisma.restaurant.findFirst({
      where: { id: targetId, status: "ACTIVE" },
      select: { id: true, name: true, address: true, sido: true, sigungu: true },
    });

    if (!target) {
      redirect(appendNoticeToPath(safeReturnTo, "error", "대상 업체를 찾지 못했습니다."));
    }

    targetName = target.name;
    links = await getExternalReviewLinks({
      targetType: "RESTAURANT",
      targetId,
      name: target.name,
      category: "RESTAURANT",
      categoryLabel: "반려동물 동반 식당",
      regionLabel: [target.sido, target.sigungu].filter(Boolean).join(" "),
      address: target.address,
    });
  } else {
    const target = await prisma.place.findFirst({
      where: { id: targetId, isActive: true },
      select: { id: true, name: true, category: true, address: true, roadAddress: true, sido: true, sigungu: true },
    });

    if (!target) {
      redirect(appendNoticeToPath(safeReturnTo, "error", "대상 업체를 찾지 못했습니다."));
    }

    targetName = target.name;
    links = await getExternalReviewLinks({
      targetType: "PLACE",
      targetId,
      name: target.name,
      category: target.category,
      categoryLabel: getAdminPlaceCategoryLabel(target.category),
      regionLabel: [target.sido, target.sigungu].filter(Boolean).join(" "),
      address: target.roadAddress ?? target.address,
    });
  }

  const candidates = links
    .filter((link) => !link.isApproved && link.kind !== "map")
    .slice(0, 6);

  if (candidates.length === 0) {
    redirect(appendNoticeToPath(safeReturnTo, "error", "자동으로 저장할 외부 후기 후보를 찾지 못했습니다."));
  }

  const existing = await prisma.externalLinkSubmission.findMany({
    where: {
      targetType: targetType as "RESTAURANT" | "PLACE",
      targetId,
      href: { in: candidates.map((item) => item.href) },
    },
    select: { href: true },
  });
  const existingHrefSet = new Set(existing.map((item) => item.href));

  const nextItems = candidates
    .filter((item) => !existingHrefSet.has(item.href))
    .map((item) => ({
      targetType: targetType as "RESTAURANT" | "PLACE",
      targetId,
      href: item.href,
      title: normalizeExternalLinkText(item.title, 140),
      sourceLabel: normalizeExternalLinkText(item.sourceLabel, 60),
      summary: normalizeExternalLinkText(item.summary, 280) || null,
      kind: item.kind === "blog" ? "BLOG" as const : "WEB" as const,
      status: "PENDING" as const,
      publishedAt: null,
    }));

  if (nextItems.length === 0) {
    redirect(appendNoticeToPath(safeReturnTo, "error", "새로 저장할 후보가 없고 기존 후보만 이미 등록돼 있습니다."));
  }

  await prisma.externalLinkSubmission.createMany({
    data: nextItems,
    skipDuplicates: true,
  });

  revalidateExternalLinkTarget(targetType, targetId);
  revalidatePath("/admin/external-links");
  redirect(appendNoticeToPath(safeReturnTo, "success", `${targetName} 후보 링크 ${nextItems.length}건을 대기 등록했습니다.`));
}

async function setExternalLinkStatusAction(formData: FormData) {
  "use server";

  const linkId = String(formData.get("linkId") ?? "");
  const status = String(formData.get("status") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if ((status !== "APPROVED" && status !== "REJECTED") || !(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const link = await prisma.externalLinkSubmission.update({
    where: { id: linkId },
    data: { status },
    select: { targetType: true, targetId: true },
  });

  revalidateExternalLinkTarget(link.targetType, link.targetId);
  revalidatePath("/admin/external-links");
  redirect(appendNoticeToPath(
    safeReturnTo,
    "success",
    status === "APPROVED" ? "외부 링크를 승인 목록으로 옮겼습니다." : "외부 링크를 거절 목록으로 옮겼습니다.",
  ));
}

async function deleteExternalLinkAction(formData: FormData) {
  "use server";

  const linkId = String(formData.get("linkId") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const link = await prisma.externalLinkSubmission.delete({
    where: { id: linkId },
    select: { targetType: true, targetId: true },
  });

  revalidateExternalLinkTarget(link.targetType, link.targetId);
  revalidatePath("/admin/external-links");
  redirect(appendNoticeToPath(safeReturnTo, "success", "외부 링크를 삭제했습니다."));
}

export default async function AdminExternalLinksPage({ searchParams }: { searchParams: Promise<AdminExternalLinksSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  const status = normalizeStatus(resolvedSearchParams.status);
  const targetQuery = String(resolvedSearchParams.q ?? "").trim();
  const selectedType = normalizeTargetType(resolvedSearchParams.selectedType);
  const selectedId = String(resolvedSearchParams.selectedId ?? "").trim();
  const canSearchTargets = targetQuery.length >= 2;
  const returnTo = buildAdminExternalLinksPath({
    secret,
    status,
    q: targetQuery,
    selectedType,
    selectedId,
  });
  const access = await requireAdminPageAccess({ secret, requiredRoles: [...REQUIRED_ROLES], returnTo });

  const where = status === "ALL" ? {} : { status };
  const [links, pendingCount, approvedCount, rejectedCount, targetRestaurants, targetPlaces] = await Promise.all([
    prisma.externalLinkSubmission.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 80,
    }),
    prisma.externalLinkSubmission.count({ where: { status: "PENDING" } }),
    prisma.externalLinkSubmission.count({ where: { status: "APPROVED" } }),
    prisma.externalLinkSubmission.count({ where: { status: "REJECTED" } }),
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

  const restaurantIds = links.filter((item) => item.targetType === "RESTAURANT").map((item) => item.targetId);
  const placeIds = links.filter((item) => item.targetType === "PLACE").map((item) => item.targetId);
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
  const searchedRestaurantTargets: AdminExternalLinkTargetSearchItem[] = targetRestaurants.map((target) => ({
    targetType: "RESTAURANT",
    targetId: target.id,
    targetLabel: "식당",
    targetName: target.name,
    targetAddress: target.address,
    regionLabel: [target.sido, target.sigungu].filter(Boolean).join(" "),
    detailHref: `/restaurants/${target.id}`,
  }));
  const searchedPlaceTargets: AdminExternalLinkTargetSearchItem[] = targetPlaces.map((target) => ({
    targetType: "PLACE",
    targetId: target.id,
    targetLabel: getAdminPlaceCategoryLabel(target.category),
    targetName: target.name,
    targetAddress: target.roadAddress ?? target.address ?? "주소 없음",
    regionLabel: [target.sido, target.sigungu].filter(Boolean).join(" "),
    detailHref: `/places/${target.id}`,
    phone: target.phone,
  }));
  const selectedTarget = selectedType && selectedId
    ? [...searchedPlaceTargets, ...searchedRestaurantTargets].find((target) => target.targetType === selectedType && target.targetId === selectedId) ?? null
    : null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      {resolvedSearchParams.notice ? (
        <section className={`mb-6 rounded-[1rem] border px-5 py-4 text-sm ${resolvedSearchParams.noticeTone === "success" ? "border-[rgba(31,74,64,0.16)] bg-[rgba(220,236,229,0.72)] text-[#1f4a40]" : "border-[rgba(177,63,63,0.16)] bg-[#fff4f1] text-[#9d4639]"}`.trim()}>
          {resolvedSearchParams.notice}
        </section>
      ) : null}

      <section className="section-shell p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">External Link Repository</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">외부 링크 저장소 검수</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">상세 페이지에 노출할 외부 후기 링크를 저장하고, 승인된 링크만 공개합니다.</p>
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">접근 계정 {access.email} · {formatAdminRoles(access.roles)}</p>
          </div>
          <a href={buildAdminExternalLinksPath({ secret, status, q: targetQuery, selectedType, selectedId })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">현재 목록 새로고침</a>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatusLink title="대기" value={pendingCount} active={status === "PENDING"} href={buildAdminExternalLinksPath({ secret, status: "PENDING", q: targetQuery, selectedType, selectedId })} />
        <StatusLink title="승인" value={approvedCount} active={status === "APPROVED"} href={buildAdminExternalLinksPath({ secret, status: "APPROVED", q: targetQuery, selectedType, selectedId })} />
        <StatusLink title="거절" value={rejectedCount} active={status === "REJECTED"} href={buildAdminExternalLinksPath({ secret, status: "REJECTED", q: targetQuery, selectedType, selectedId })} />
        <StatusLink title="전체" value={pendingCount + approvedCount + rejectedCount} active={status === "ALL"} href={buildAdminExternalLinksPath({ secret, status: "ALL", q: targetQuery, selectedType, selectedId })} />
      </section>

      <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Find Target</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">업체 검색 후 대상 자동 선택</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">이름, 주소, 전화번호로 먼저 업체를 찾고 선택하면 아래 등록 폼에 targetId를 자동으로 채웁니다.</p>
          </div>
          {targetQuery ? <a href={buildAdminExternalLinksPath({ secret, status })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">검색 초기화</a> : null}
        </div>

        <form method="GET" className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input type="hidden" name="secret" value={secret ?? ""} />
          {status !== "PENDING" ? <input type="hidden" name="status" value={status} /> : null}
          <label className="space-y-2 text-xs font-black text-[var(--muted)]">
            업체명, 주소, 전화번호
            <input type="search" name="q" defaultValue={targetQuery} className="input rounded-xl text-sm" placeholder="예: 멍스테이, 광명, 소하동" />
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
            {searchedRestaurantTargets.length === 0 && searchedPlaceTargets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[#f8faf9] p-5 text-center text-sm font-black text-[var(--muted)]">검색된 업체가 없습니다.</div>
            ) : null}
            {[...searchedPlaceTargets, ...searchedRestaurantTargets].map((target) => (
              <TargetSearchResultCard
                key={`${target.targetType}:${target.targetId}`}
                action={createExternalLinkAction}
                candidateAction={generateExternalLinkCandidatesAction}
                target={target}
                selected={selectedTarget?.targetType === target.targetType && selectedTarget.targetId === target.targetId}
                secret={secret}
                returnTo={buildAdminExternalLinksPath({
                  secret,
                  status,
                  q: targetQuery,
                  selectedType: target.targetType,
                  selectedId: target.targetId,
                })}
                href={buildAdminExternalLinksPath({
                  secret,
                  status,
                  q: targetQuery,
                  selectedType: target.targetType,
                  selectedId: target.targetId,
                })}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Manual Add</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">외부 링크 직접 등록</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">위 검색 결과에서 업체를 선택하면 대상 정보가 자동 입력됩니다. 필요하면 기존처럼 직접 입력도 가능합니다.</p>
          </div>
          <a href={buildAdminExternalLinksPath({ secret, status: "APPROVED", q: targetQuery, selectedType, selectedId })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">승인 목록 보기</a>
        </div>

        <form action={createExternalLinkAction} className="mt-5 grid gap-4">
          <input type="hidden" name="secret" value={secret ?? ""} />
          <input type="hidden" name="returnTo" value={buildAdminExternalLinksPath({ secret, status, q: targetQuery, selectedType, selectedId })} />

          {selectedTarget ? (
            <>
              <input type="hidden" name="targetType" value={selectedTarget.targetType} />
              <input type="hidden" name="targetId" value={selectedTarget.targetId} />
              <SelectedTargetSummaryCard
                target={selectedTarget}
                clearHref={buildAdminExternalLinksPath({ secret, status, q: targetQuery })}
              />
            </>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[130px_minmax(220px,1fr)]">
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
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-[minmax(280px,1.5fr)_150px_150px_150px]">
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              링크 URL
              <input type="url" name="href" required className="input rounded-xl text-sm" placeholder="https://..." />
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              종류
              <select name="kind" className="input rounded-xl text-sm" defaultValue="">
                <option value="">URL 기준 자동 판단</option>
                <option value="BLOG">BLOG</option>
                <option value="WEB">WEB</option>
                <option value="MAP">MAP</option>
              </select>
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              상태
              <select name="status" className="input rounded-xl text-sm" defaultValue="PENDING">
                <option value="PENDING">대기 등록</option>
                <option value="APPROVED">바로 승인</option>
              </select>
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              작성일
              <input type="date" name="publishedAt" className="input rounded-xl text-sm" />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              요약 메모
              <textarea name="summary" maxLength={280} rows={3} className="input min-h-[96px] rounded-xl px-4 py-3 text-sm" placeholder="원문에서 참고할 포인트를 짧게 적습니다" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 lg:block">
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                제목
                <input name="title" maxLength={140} className="input rounded-xl text-sm" placeholder="비우면 기본 제목을 씁니다" />
              </label>
              <label className="space-y-2 text-xs font-black text-[var(--muted)]">
                출처 라벨
                <input name="sourceLabel" maxLength={60} className="input rounded-xl text-sm" placeholder="예: 네이버 블로그" />
              </label>
              <div className="flex items-end">
                <button type="submit" className="min-h-10 w-full rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">저장</button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-4">
        {links.length > 0 ? links.map((link) => {
          const target = link.targetType === "RESTAURANT" ? restaurantMap.get(link.targetId) : placeMap.get(link.targetId);
          const targetName = target?.name ?? "대상 정보 없음";
          const targetAddress = link.targetType === "RESTAURANT"
            ? restaurantMap.get(link.targetId)?.address
            : (placeMap.get(link.targetId)?.roadAddress ?? placeMap.get(link.targetId)?.address);
          const targetHref = link.targetType === "RESTAURANT" ? `/restaurants/${link.targetId}` : `/places/${link.targetId}`;

          return (
            <article key={link.id} className="rounded-[1rem] border border-[var(--line)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
                    <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">{link.status}</span>
                    <span>{link.targetType === "RESTAURANT" ? "식당" : "장소"}</span>
                    <span>{EXTERNAL_LINK_KIND_LABELS[link.kind as keyof typeof EXTERNAL_LINK_KIND_LABELS]}</span>
                    <span>{link.sourceLabel}</span>
                    <span>{link.createdAt.toLocaleString("ko-KR")}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{link.title}</h2>
                  <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                    <a href={targetHref} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line-strong)] underline-offset-4">{targetName}</a>
                    {targetAddress ? ` · ${targetAddress}` : ""}
                  </p>
                  <a href={link.href} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 block break-all text-sm font-bold text-[var(--brand)] underline decoration-[var(--line-strong)] underline-offset-4">{link.href}</a>
                </div>
                <div className="rounded-lg bg-[#fafdf9] px-4 py-3 text-sm font-black text-[var(--ink)]">
                  {link.publishedAt ? link.publishedAt.toLocaleDateString("ko-KR") : "작성일 미입력"}
                </div>
              </div>

              {link.summary ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4f5a55]">{link.summary}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {link.status !== "APPROVED" ? <ExternalLinkActionButton action={setExternalLinkStatusAction} linkId={link.id} secret={secret} returnTo={returnTo} status="APPROVED" label="승인" style="primary" /> : null}
                {link.status !== "REJECTED" ? <ExternalLinkActionButton action={setExternalLinkStatusAction} linkId={link.id} secret={secret} returnTo={returnTo} status="REJECTED" label="거절" /> : null}
                <form action={deleteExternalLinkAction}>
                  <input type="hidden" name="linkId" value={link.id} />
                  <input type="hidden" name="secret" value={secret ?? ""} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="rounded-full border border-[#fecaca] bg-white px-4 py-2 text-xs font-black text-[#b91c1c]">삭제</button>
                </form>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-[1rem] border border-dashed border-[var(--line-strong)] bg-white p-8 text-center text-sm font-black text-[var(--muted)]">선택한 상태의 외부 링크가 없습니다.</div>
        )}
      </section>
    </main>
  );
}

function ExternalLinkActionButton({ action, linkId, secret, returnTo, status, label, style }: {
  action: (formData: FormData) => Promise<void>;
  linkId: string;
  secret?: string;
  returnTo: string;
  status: "APPROVED" | "REJECTED";
  label: string;
  style?: "primary";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="linkId" value={linkId} />
      <input type="hidden" name="secret" value={secret ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={style === "primary" ? "rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white" : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]"}>{label}</button>
    </form>
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

function revalidateExternalLinkTarget(targetType: string, targetId: string) {
  if (targetType === "RESTAURANT") {
    revalidatePath(`/restaurants/${targetId}`);
  }
  if (targetType === "PLACE") {
    revalidatePath(`/places/${targetId}`);
  }
}

function TargetSearchResultCard({
  action,
  candidateAction,
  target,
  selected,
  secret,
  returnTo,
  href,
}: {
  action: (formData: FormData) => Promise<void>;
  candidateAction: (formData: FormData) => Promise<void>;
  target: AdminExternalLinkTargetSearchItem;
  selected: boolean;
  secret?: string;
  returnTo: string;
  href: string;
}) {
  return (
    <article className={selected ? "rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-4" : "rounded-lg border border-[var(--line)] bg-[#fbfcf8] p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">{target.targetLabel}</span>
            {target.regionLabel ? <span>{target.regionLabel}</span> : null}
            {selected ? <span className="rounded-full bg-[var(--brand)] px-2.5 py-1 text-white">선택됨</span> : null}
          </div>
          <a href={target.detailHref} target="_blank" rel="noopener noreferrer" className="mt-2 block text-lg font-black text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            {target.targetName}
          </a>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--muted)]">{target.targetAddress}</p>
          {target.phone ? <p className="mt-2 text-xs font-black text-[var(--brand)]">{target.phone}</p> : null}
          <p className="mt-2 break-all text-[11px] font-bold text-[var(--muted)]">{target.targetId}</p>
        </div>
        <a href={href} className={selected ? "rounded-full border border-[var(--brand)] bg-white px-4 py-2 text-xs font-black text-[var(--brand)]" : "rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white"}>
          {selected ? "선택 유지" : "이 대상으로 선택"}
        </a>
      </div>
      <form action={action} className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <input type="hidden" name="secret" value={secret ?? ""} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="targetType" value={target.targetType} />
        <input type="hidden" name="targetId" value={target.targetId} />
        <input type="hidden" name="status" value="PENDING" />
        <label className="space-y-1 text-[11px] font-black text-[var(--muted)] md:col-span-1">
          빠른 후보 URL 등록
          <input type="url" name="href" required className="input rounded-xl text-sm" placeholder="https://... 원문 링크만 넣으면 대기 등록됩니다" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="min-h-10 w-full rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--ink)]">후보 저장</button>
        </div>
      </form>
      <form action={candidateAction} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--line)] bg-white px-4 py-3">
        <input type="hidden" name="secret" value={secret ?? ""} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="targetType" value={target.targetType} />
        <input type="hidden" name="targetId" value={target.targetId} />
        <p className="text-xs font-black text-[var(--muted)]">현재 검색 로직으로 이 업체의 외부 후기 후보를 자동 수집해 대기 큐에 넣습니다.</p>
        <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-black text-white">후보 자동 수집</button>
      </form>
    </article>
  );
}

function SelectedTargetSummaryCard({ target, clearHref }: { target: AdminExternalLinkTargetSearchItem; clearHref: string }) {
  return (
    <div className="rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">{target.targetLabel}</span>
            {target.regionLabel ? <span>{target.regionLabel}</span> : null}
            <span className="rounded-full bg-[var(--brand)] px-2.5 py-1 text-white">자동 선택됨</span>
          </div>
          <a href={target.detailHref} target="_blank" rel="noopener noreferrer" className="mt-2 block text-lg font-black text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4">
            {target.targetName}
          </a>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--muted)]">{target.targetAddress}</p>
          {target.phone ? <p className="mt-2 text-xs font-black text-[var(--brand)]">{target.phone}</p> : null}
          <p className="mt-2 break-all text-[11px] font-bold text-[var(--muted)]">대상 ID {target.targetId}</p>
        </div>
        <a href={clearHref} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">선택 해제</a>
      </div>
    </div>
  );
}

function buildAdminExternalLinksPath({
  secret,
  status,
  q,
  selectedType,
  selectedId,
}: {
  secret?: string;
  status?: ExternalLinkStatusFilter;
  q?: string;
  selectedType?: "RESTAURANT" | "PLACE";
  selectedId?: string;
}) {
  const params = new URLSearchParams();
  if (secret) params.set("secret", secret);
  if (status && status !== "PENDING") params.set("status", status);
  if (q?.trim()) params.set("q", q.trim());
  if (selectedType && selectedId?.trim()) {
    params.set("selectedType", selectedType);
    params.set("selectedId", selectedId.trim());
  }
  const query = params.toString();
  return query ? `/admin/external-links?${query}` : "/admin/external-links";
}

function appendNoticeToPath(path: string, tone: "success" | "error", message: string) {
  const url = new URL(path, "http://localhost:3000");
  url.searchParams.set("noticeTone", tone);
  url.searchParams.set("notice", message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function getSafeReturnTo(value: string, secret?: string) {
  if (value.startsWith("/admin/external-links")) return value;
  return buildAdminExternalLinksPath({ secret });
}