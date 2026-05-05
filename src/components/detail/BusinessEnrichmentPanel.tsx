import { ExternalLink, Info, MessageSquarePlus, MessageSquareWarning } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";

type BusinessEnrichmentPanelProps = {
  enrichment: BusinessEnrichmentEntry | null;
  reportHref: string;
  reviewHref: string;
};

function getSourceLabel(source: BusinessEnrichmentEntry["source"]) {
  if (source === "KAKAO") return "카카오 로컬";
  if (source === "NAVER") return "네이버 로컬";
  if (source === "GOOGLE") return "Google Places";
  return "외부 장소 정보";
}

function formatCheckedAt(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR");
}

export function BusinessEnrichmentPanel({ enrichment, reportHref, reviewHref }: BusinessEnrichmentPanelProps) {
  const canDisplay = enrichment && enrichment.matchScore >= 0.85;
  const isCandidate = enrichment && enrichment.matchScore >= 0.65 && enrichment.matchScore < 0.85;
  const visibleEnrichment = canDisplay || isCandidate ? enrichment : null;
  const checkedAtLabel = formatCheckedAt(visibleEnrichment?.enrichedAt ?? visibleEnrichment?.checkedAt);

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Info size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">외부 장소 정보</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            카카오·네이버 로컬 검색 결과는 업체명과 주소 유사도가 충분할 때만 보강 정보로 표시합니다. 외부 리뷰 내용은 저장하지 않습니다.
          </p>
        </div>
      </div>

      {visibleEnrichment ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-black text-[var(--brand)]">{getSourceLabel(visibleEnrichment.source)}</span>
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-[var(--muted)]">
              {canDisplay ? "일치도 높음" : "외부 정보 후보"}
            </span>
            {isCandidate ? <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-black text-[#9a3412]">관리자 확인 필요</span> : null}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleEnrichment.externalCategory ? (
              <div>
                <dt className="text-xs font-black text-[var(--muted)]">외부 분류</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--ink)]">{visibleEnrichment.externalCategory}</dd>
              </div>
            ) : null}
            {visibleEnrichment.phone ? (
              <div>
                <dt className="text-xs font-black text-[var(--muted)]">외부 전화번호</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--ink)]">{visibleEnrichment.phone}</dd>
              </div>
            ) : null}
            {visibleEnrichment.roadAddress ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-black text-[var(--muted)]">외부 도로명 주소</dt>
                <dd className="mt-1 text-sm font-bold leading-6 text-[var(--ink)]">{visibleEnrichment.roadAddress}</dd>
              </div>
            ) : null}
            {checkedAtLabel ? (
              <div>
                <dt className="text-xs font-black text-[var(--muted)]">외부 정보 확인일</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--ink)]">{checkedAtLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleEnrichment.externalPlaceUrl ? (
              <a href={visibleEnrichment.externalPlaceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                <ExternalLink size={14} />
                외부 장소 보기
              </a>
            ) : null}
            {visibleEnrichment.kakaoPlaceUrl ? (
              <a href={visibleEnrichment.kakaoPlaceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                <ExternalLink size={14} />
                카카오
              </a>
            ) : null}
            {visibleEnrichment.naverPlaceUrl ? (
              <a href={visibleEnrichment.naverPlaceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                <ExternalLink size={14} />
                네이버
              </a>
            ) : null}
            {visibleEnrichment.googleMapsUri ? (
              <a href={visibleEnrichment.googleMapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                <ExternalLink size={14} />
                구글지도
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[#f9fbfa] p-4">
          <p className="text-sm font-black text-[var(--ink)]">외부 장소 정보 확인 전</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">현재는 공공데이터와 댕냥지도 리뷰를 기준으로 표시합니다. 전화번호, 대표 메뉴, 서비스 정보가 다르면 제보해 주세요.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <SmartLink href={reportHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--muted)]">
          <MessageSquareWarning size={14} />
          정보 수정 제보
        </SmartLink>
        <SmartLink href={reviewHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--brand)] px-4 text-xs font-black text-[var(--brand)]">
          <MessageSquarePlus size={14} />
          리뷰로 대표 메뉴·서비스 알려주기
        </SmartLink>
      </div>
    </section>
  );
}