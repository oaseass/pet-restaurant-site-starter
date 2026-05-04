import { ExternalLink, MessageSquarePlus, Star } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import { buildNavigationLinks } from "@/lib/navigation-links";
import type { ReviewSummary, ReviewTargetTypeValue } from "@/lib/reviews";

type ReviewSectionProps = {
  targetType: ReviewTargetTypeValue;
  targetId: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  summary: ReviewSummary;
  reportHref: string;
};

const PET_TYPE_LABELS: Record<string, string> = {
  DOG: "강아지",
  CAT: "고양이",
  BOTH: "강아지·고양이",
  OTHER: "기타 반려동물",
};

const PET_SIZE_LABELS: Record<string, string> = {
  SMALL: "소형",
  MEDIUM: "중형",
  LARGE: "대형",
  UNKNOWN: "크기 미기재",
};

const ANSWER_LABELS: Record<string, string> = {
  YES: "가능 제보",
  NO: "불가 제보",
  UNKNOWN: "확인 필요",
};

function formatRating(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

function formatPercent(value: number | null) {
  return value === null ? "-" : `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ value }: { value: number | null }) {
  const rounded = value === null ? 0 : Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-[#f59e0b]" aria-label={value === null ? "별점 없음" : `별점 ${value.toFixed(1)}점`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={15} fill={index < rounded ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export function ReviewSection({ targetType, targetId, name, address, lat, lng, summary, reportHref }: ReviewSectionProps) {
  const reviewHref = `/reviews/new?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`;
  const links = buildNavigationLinks({ name, address, lat, lng });
  const showDetailedStats = summary.count >= 3;

  return (
    <section className="mt-8 rounded-[1rem] border border-[var(--line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">댕냥지도 리뷰</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">반려동물 동반 경험 리뷰</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            맛 평가보다 반려동물과 함께 방문했을 때의 좌석, 동반 편의성, 직원 응대, 청결도, 제한 조건을 중심으로 모읍니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmartLink href={reviewHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-black text-white">
            <MessageSquarePlus size={15} />
            리뷰 남기기
          </SmartLink>
          <SmartLink href={reportHref} className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-black text-[var(--muted)]">
            정보 수정 제보
          </SmartLink>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--line)] bg-[#fafdf9] p-4">
          <p className="text-xs font-black text-[var(--muted)]">평균 종합 별점</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-black text-[var(--ink)]">{formatRating(summary.averageOverall)}</span>
            <Stars value={summary.averageOverall} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-black text-[var(--muted)]">리뷰 수</p>
          <p className="mt-2 text-2xl font-black text-[var(--ink)]">{summary.count.toLocaleString("ko-KR")}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-black text-[var(--muted)]">반려동물 동반 만족도</p>
          <p className="mt-2 text-2xl font-black text-[var(--brand)]">{formatRating(summary.averagePetFriendly)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[#fcfbf8] p-4 text-sm leading-7 text-[var(--muted)]">
        {showDetailedStats ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <p><span className="font-black text-[var(--ink)]">실내 동반 가능</span> 제보 비율 {formatPercent(summary.indoorAllowedRate)}</p>
            <p><span className="font-black text-[var(--ink)]">대형견 가능</span> 제보 비율 {formatPercent(summary.largeDogAllowedRate)}</p>
          </div>
        ) : (
          <p className="font-bold">리뷰가 더 쌓이면 통계가 표시됩니다.</p>
        )}
      </div>

      {summary.recentReviews.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {summary.recentReviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-[var(--ink)]">{review.title}</h3>
                  <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                    {formatDate(review.visitDate)} · {PET_TYPE_LABELS[review.petType] ?? "반려동물"} · {PET_SIZE_LABELS[review.petSize] ?? "크기 미기재"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-[var(--ink)]">
                  <Stars value={review.ratingOverall} />
                  {review.ratingOverall.toFixed(1)}
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#4f5a55]">{review.body}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[var(--muted)]">
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">실내 {ANSWER_LABELS[review.indoorAllowed]}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">야외 {ANSWER_LABELS[review.outdoorAllowed]}</span>
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1">대형견 {ANSWER_LABELS[review.largeDogAllowed]}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--line-strong)] bg-[#fafdf9] p-5 text-sm leading-7 text-[var(--muted)]">
          <p className="font-black text-[var(--ink)]">아직 방문 리뷰가 없습니다. 반려동물과 함께 방문해 보셨다면 첫 리뷰를 남겨주세요.</p>
          <p className="mt-2">실내·야외 좌석, 대형견 제한, 케이지나 목줄 조건처럼 다음 방문자에게 필요한 정보를 중심으로 남겨주시면 좋습니다.</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
        <span className="text-xs font-black text-[var(--muted)]">외부 지도에서 리뷰 확인</span>
        {links.naverWebUrl ? (
          <a href={links.naverWebUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--ink)]">
            네이버지도에서 보기
            <ExternalLink size={13} />
          </a>
        ) : null}
        {links.webFallbackUrl ? (
          <a href={links.webFallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--ink)]">
            카카오맵에서 보기
            <ExternalLink size={13} />
          </a>
        ) : null}
      </div>
    </section>
  );
}