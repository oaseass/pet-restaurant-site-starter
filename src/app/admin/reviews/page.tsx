import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPerformAdminAction, formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "리뷰 검수 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminReviewsSearchParams = {
  secret?: string;
  status?: string;
};

type ReviewStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const REQUIRED_ROLES = ["SUPER_ADMIN", "REVIEWER", "OPERATIONS_ADMIN", "CONTENT_ADMIN"] as const;

function normalizeStatus(value?: string): ReviewStatusFilter {
  if (value === "APPROVED" || value === "REJECTED" || value === "ALL") return value;
  return "PENDING";
}

async function setReviewStatusAction(formData: FormData) {
  "use server";

  const reviewId = String(formData.get("reviewId") ?? "");
  const status = String(formData.get("status") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if ((status !== "APPROVED" && status !== "REJECTED") || !(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
    select: { targetType: true, targetId: true },
  });

  revalidateReviewTarget(review.targetType, review.targetId);
  revalidatePath("/admin/reviews");
  redirect(safeReturnTo);
}

async function deleteReviewAction(formData: FormData) {
  "use server";

  const reviewId = String(formData.get("reviewId") ?? "");
  const submittedSecret = String(formData.get("secret") ?? "");
  const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

  if (!(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: [...REQUIRED_ROLES] }))) {
    redirect(safeReturnTo);
  }

  const review = await prisma.review.delete({
    where: { id: reviewId },
    select: { targetType: true, targetId: true },
  });

  revalidateReviewTarget(review.targetType, review.targetId);
  revalidatePath("/admin/reviews");
  redirect(safeReturnTo);
}

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<AdminReviewsSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  const status = normalizeStatus(resolvedSearchParams.status);
  const returnTo = buildAdminReviewsPath({ secret, status });
  const access = await requireAdminPageAccess({ secret, requiredRoles: [...REQUIRED_ROLES], returnTo });

  const where = status === "ALL" ? {} : { status };
  const [reviews, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.count({ where: { status: "REJECTED" } }),
  ]);

  const restaurantIds = reviews.filter((item) => item.targetType === "RESTAURANT").map((item) => item.targetId);
  const placeIds = reviews.filter((item) => item.targetType === "PLACE").map((item) => item.targetId);
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

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">Review Moderation</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">댕냥지도 방문 리뷰 검수</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">외부 리뷰를 가져오지 않고, 사용자가 직접 남긴 반려동물 동반 경험만 승인 후 공개합니다.</p>
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">접근 계정 {access.email} · {formatAdminRoles(access.roles)}</p>
          </div>
          <a href={buildAdminReviewsPath({ secret })} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--muted)]">대기 목록 새로고침</a>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatusLink title="대기" value={pendingCount} active={status === "PENDING"} href={buildAdminReviewsPath({ secret, status: "PENDING" })} />
        <StatusLink title="승인" value={approvedCount} active={status === "APPROVED"} href={buildAdminReviewsPath({ secret, status: "APPROVED" })} />
        <StatusLink title="거절" value={rejectedCount} active={status === "REJECTED"} href={buildAdminReviewsPath({ secret, status: "REJECTED" })} />
        <StatusLink title="전체" value={pendingCount + approvedCount + rejectedCount} active={status === "ALL"} href={buildAdminReviewsPath({ secret, status: "ALL" })} />
      </section>

      <section className="mt-6 grid gap-4">
        {reviews.length > 0 ? reviews.map((review) => {
          const target = review.targetType === "RESTAURANT" ? restaurantMap.get(review.targetId) : placeMap.get(review.targetId);
          const targetName = target?.name ?? "대상 정보 없음";
          const targetAddress = review.targetType === "RESTAURANT"
            ? restaurantMap.get(review.targetId)?.address
            : (placeMap.get(review.targetId)?.roadAddress ?? placeMap.get(review.targetId)?.address);
          const targetHref = review.targetType === "RESTAURANT" ? `/restaurants/${review.targetId}` : `/places/${review.targetId}`;

          return (
            <article key={review.id} className="rounded-[1rem] border border-[var(--line)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[var(--muted)]">
                    <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">{review.status}</span>
                    <span>{review.targetType === "RESTAURANT" ? "식당" : "장소"}</span>
                    <span>{review.createdAt.toLocaleString("ko-KR")}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{review.title}</h2>
                  <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                    <a href={targetHref} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line-strong)] underline-offset-4">{targetName}</a>
                    {targetAddress ? ` · ${targetAddress}` : ""}
                  </p>
                </div>
                <div className="rounded-lg bg-[#fafdf9] px-4 py-3 text-sm font-black text-[var(--ink)]">
                  종합 {review.ratingOverall} · 동반 {review.ratingPetFriendly}
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4f5a55]">{review.body}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">방문일 {review.visitDate.toLocaleDateString("ko-KR")}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">반려동물 {review.petType}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">크기 {review.petSize}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">실내 {review.indoorAllowed}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">야외 {review.outdoorAllowed}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">대형견 {review.largeDogAllowed}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">목줄 {review.leashRequired}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">이동장 {review.carrierRequired}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {review.status !== "APPROVED" ? <ReviewActionButton action={setReviewStatusAction} reviewId={review.id} secret={secret} returnTo={returnTo} status="APPROVED" label="승인" style="primary" /> : null}
                {review.status !== "REJECTED" ? <ReviewActionButton action={setReviewStatusAction} reviewId={review.id} secret={secret} returnTo={returnTo} status="REJECTED" label="거절" /> : null}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <input type="hidden" name="secret" value={secret ?? ""} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="rounded-full border border-[#fecaca] bg-white px-4 py-2 text-xs font-black text-[#b91c1c]">삭제</button>
                </form>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-[1rem] border border-dashed border-[var(--line-strong)] bg-white p-8 text-center text-sm font-black text-[var(--muted)]">선택한 상태의 리뷰가 없습니다.</div>
        )}
      </section>
    </main>
  );
}

function ReviewActionButton({ action, reviewId, secret, returnTo, status, label, style }: {
  action: (formData: FormData) => Promise<void>;
  reviewId: string;
  secret?: string;
  returnTo: string;
  status: "APPROVED" | "REJECTED";
  label: string;
  style?: "primary";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="reviewId" value={reviewId} />
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

function revalidateReviewTarget(targetType: string, targetId: string) {
  if (targetType === "RESTAURANT") {
    revalidatePath(`/restaurants/${targetId}`);
  }
  if (targetType === "PLACE") {
    revalidatePath(`/places/${targetId}`);
  }
}

function buildAdminReviewsPath({ secret, status }: { secret?: string; status?: ReviewStatusFilter }) {
  const params = new URLSearchParams();
  if (secret) params.set("secret", secret);
  if (status && status !== "PENDING") params.set("status", status);
  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

function getSafeReturnTo(value: string, secret?: string) {
  if (value.startsWith("/admin/reviews")) return value;
  return buildAdminReviewsPath({ secret });
}