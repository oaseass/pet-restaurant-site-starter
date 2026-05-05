import { Camera, ExternalLink, Info, MessageSquarePlus, MessageSquareWarning, PawPrint, Utensils } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";

type BusinessCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

type BusinessEnrichmentPanelProps = {
  enrichment: BusinessEnrichmentEntry | null;
  category: BusinessCategory;
  reportHref: string;
  reviewHref: string;
};

const CATEGORY_SUMMARIES: Record<BusinessCategory, string> = {
  RESTAURANT: "외부 장소 정보 기준으로 음식점 분류가 확인되었습니다. 대표 메뉴는 아직 확인되지 않았습니다.",
  ANIMAL_HOSPITAL: "외부 장소 정보 기준으로 동물병원 분류가 확인되었습니다. 진료시간과 야간진료 여부는 방문 전 확인해 주세요.",
  PHARMACY: "외부 장소 정보 기준으로 약국 정보가 확인되었습니다. 동물의약품 재고는 방문 전 전화 확인을 권장합니다.",
  GROOMING: "외부 장소 정보 기준으로 미용 관련 업체로 확인되었습니다. 견종·묘종·대형견 가능 여부는 예약 전 확인해 주세요.",
  DAYCARE: "외부 장소 정보 기준으로 위탁·호텔·훈련 관련 업체 후보가 확인되었습니다. 운영 서비스는 업체에 직접 확인해 주세요.",
  FUNERAL: "외부 장소 정보 기준으로 장례 관련 업체 후보가 확인되었습니다. 화장·봉안·픽업 가능 여부는 상담 전 확인해 주세요.",
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

function appendReportTopic(reportHref: string, topic: string) {
  return `${reportHref}${reportHref.includes("?") ? "&" : "?"}topic=${topic}`;
}

function getExternalName(enrichment: BusinessEnrichmentEntry) {
  return enrichment.matchedName ?? enrichment.kakaoPlaceName ?? enrichment.naverTitle ?? enrichment.googlePlaceName ?? "확인 필요";
}

function getExternalAddress(enrichment: BusinessEnrichmentEntry) {
  return enrichment.roadAddress ?? enrichment.jibunAddress ?? "확인 필요";
}

function DetailItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-black text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-bold leading-6 text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function BusinessEnrichmentPanel({ enrichment, category, reportHref, reviewHref }: BusinessEnrichmentPanelProps) {
  const canDisplay = enrichment && enrichment.matchScore >= 0.85;
  const isCandidate = enrichment && enrichment.matchScore >= 0.65 && enrichment.matchScore < 0.85;
  const visibleEnrichment = canDisplay ? enrichment : null;
  const checkedAtLabel = formatCheckedAt(visibleEnrichment?.enrichedAt ?? visibleEnrichment?.checkedAt);
  const sourceLinks = visibleEnrichment
    ? [
        { href: visibleEnrichment.kakaoPlaceUrl, label: "카카오맵에서 리뷰 확인" },
        { href: visibleEnrichment.naverPlaceUrl, label: "네이버지도에서 리뷰 확인" },
        { href: visibleEnrichment.googleMapsUri, label: "구글지도에서 리뷰 확인" },
        visibleEnrichment.externalPlaceUrl && !visibleEnrichment.kakaoPlaceUrl && !visibleEnrichment.naverPlaceUrl && !visibleEnrichment.googleMapsUri
          ? { href: visibleEnrichment.externalPlaceUrl, label: "외부 지도에서 리뷰 확인" }
          : null,
      ].filter((link): link is { href: string; label: string } => Boolean(link?.href))
    : [];

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Info size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">외부 장소 정보</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            카카오·네이버·Google 로컬 검색 결과는 업체명, 주소, 지역, 카테고리 유사도가 충분할 때만 보강 정보로 표시합니다. 외부 리뷰 내용은 저장하지 않습니다.
          </p>
        </div>
      </div>

      {visibleEnrichment ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-black text-[var(--brand)]">{getSourceLabel(visibleEnrichment.source)}</span>
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-[var(--muted)]">일치도 높음</span>
            <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-black text-[#047857]">자동 표시 가능</span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="외부 장소명" value={getExternalName(visibleEnrichment)} />
            <DetailItem label="외부 분류" value={visibleEnrichment.externalCategory ?? "확인 필요"} />
            <DetailItem label="외부 전화번호" value={visibleEnrichment.phone ?? "확인 필요"} />
            <DetailItem label="외부 주소" value={getExternalAddress(visibleEnrichment)} wide />
            <DetailItem label="어떤 업체인지" value={CATEGORY_SUMMARIES[category]} wide />
            <DetailItem label="영업정보" value="확인 필요" />
            <DetailItem label="대표 메뉴/서비스" value="확인 필요" />
            {checkedAtLabel ? <DetailItem label="외부 정보 확인일" value={checkedAtLabel} /> : null}
          </dl>

          {sourceLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sourceLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                  <ExternalLink size={14} />
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : isCandidate ? (
        <div className="mt-5 rounded-xl border border-dashed border-[#fed7aa] bg-[#fff7ed] p-4">
          <p className="text-sm font-black text-[#9a3412]">관리자 확인 필요 후보 검토 중</p>
          <p className="mt-2 text-sm leading-7 text-[#9a3412]">외부 검색 후보가 있지만 자동 표시 기준에는 아직 도달하지 않았습니다. 장소명, 전화번호, 주소는 검토 전까지 상세 페이지에 노출하지 않습니다.</p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[#f9fbfa] p-4">
          <p className="text-sm font-black text-[var(--ink)]">외부 장소 정보 확인 전</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">현재는 공공데이터와 댕냥지도 리뷰를 기준으로 표시합니다. 전화번호, 대표 메뉴, 서비스 정보가 다르면 제보해 주세요.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <SmartLink href={reviewHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--brand)] bg-[var(--brand)] px-4 text-xs font-black text-white">
          <MessageSquarePlus size={14} />
          방문 리뷰 남기기
        </SmartLink>
        <SmartLink href={appendReportTopic(reportHref, "service")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
          <Utensils size={14} />
          대표 메뉴/서비스 제보
        </SmartLink>
        <SmartLink href={appendReportTopic(reportHref, "photo")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
          <Camera size={14} />
          사진 제보
        </SmartLink>
        <SmartLink href={appendReportTopic(reportHref, "pet-policy")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
          <PawPrint size={14} />
          동반 조건 제보
        </SmartLink>
        <SmartLink href={reportHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--muted)]">
          <MessageSquareWarning size={14} />
          정보 수정 제보
        </SmartLink>
      </div>
    </section>
  );
}