import { Camera, ClipboardCheck, Clock3, MapPinned, Phone, ShieldCheck, Sparkles, Star } from "lucide-react";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";
import { formatBusinessCheckDate, getBusinessCheckSummaryLabel, type BusinessCheckSummary } from "@/lib/business-checks-shared";
import { getInformationCompletenessRank } from "@/lib/discovery-cards";
import type { VisitInfoCategory } from "@/components/detail/VisitInfoPanel";

type DetailOverviewPanelProps = {
  name: string;
  category: VisitInfoCategory;
  categoryLabel: string;
  identityLabel: string;
  regionLabel: string;
  addressLabel: string;
  phone?: string | null;
  hasCoordinates: boolean;
  sourceLabel: string;
  businessStatus?: string | null;
  dataUpdatedLabel: string;
  reviewCount: number;
  reviewAverage?: number | null;
  checkSummary?: BusinessCheckSummary | null;
  enrichment?: BusinessEnrichmentEntry | null;
};

const CATEGORY_CHECKS: Record<VisitInfoCategory, string[]> = {
  RESTAURANT: ["반려동물 동반 좌석 운영", "실내·야외 좌석 조건", "대형견·이동장 제한"],
  ANIMAL_HOSPITAL: ["오늘 진료 가능한 증상", "예약 필요 여부", "야간·응급 대응"],
  PHARMACY: ["필요한 동물의약품 재고", "처방전 필요 여부", "오늘 영업시간"],
  GROOMING: ["예약 가능한 시간", "견종·체중 제한", "미용 포함 항목"],
  DAYCARE: ["입소 기준", "예방접종 증명", "호텔·훈련 운영 방식"],
  FUNERAL: ["상담 가능 시간", "운구 가능 지역", "절차와 비용 항목"],
};

const CATEGORY_LEADS: Record<VisitInfoCategory, string> = {
  RESTAURANT: "반려동물과 함께 들를 수 있는 음식점으로 분류된 곳입니다.",
  ANIMAL_HOSPITAL: "진료 가능 조건을 방문 전에 확인해야 하는 동물병원입니다.",
  PHARMACY: "동물의약품 취급 여부와 재고를 먼저 확인하면 좋은 약국입니다.",
  GROOMING: "예약 조건과 견종별 가능 범위를 먼저 확인하면 좋은 미용 업체입니다.",
  DAYCARE: "입소 기준과 프로그램 운영 방식을 먼저 확인하면 좋은 위탁·돌봄 업체입니다.",
  FUNERAL: "상담 가능 시간과 절차를 먼저 확인해야 하는 장례 업체입니다.",
};

function formatGoogleRating(enrichment?: BusinessEnrichmentEntry | null) {
  if (typeof enrichment?.googleRating !== "number") return null;
  const reviewLabel = typeof enrichment.googleUserRatingCount === "number" && enrichment.googleUserRatingCount > 0
    ? ` · 리뷰 ${enrichment.googleUserRatingCount.toLocaleString("ko-KR")}개`
    : "";
  return `Google ${enrichment.googleRating.toFixed(1)}${reviewLabel}`;
}

function formatReviewSummary(reviewCount: number, reviewAverage?: number | null) {
  if (reviewCount <= 0) return "댕냥지도 후기 기다리는 중";
  if (typeof reviewAverage === "number") return `댕냥지도 후기 ${reviewCount.toLocaleString("ko-KR")}개 · ${reviewAverage.toFixed(1)}`;
  return `댕냥지도 후기 ${reviewCount.toLocaleString("ko-KR")}개`;
}

function getOpeningPreview(enrichment?: BusinessEnrichmentEntry | null) {
  return enrichment?.googleOpeningHours?.find((line) => line.trim().length > 0) ?? null;
}

function getExternalCategory(enrichment?: BusinessEnrichmentEntry | null) {
  return enrichment?.externalCategory ?? enrichment?.googlePrimaryType ?? null;
}

function buildLead({ name, category, identityLabel, regionLabel, enrichment }: DetailOverviewPanelProps) {
  const externalCategory = getExternalCategory(enrichment);
  const sourceHint = externalCategory ? `외부 지도에서는 ${externalCategory} 정보와 잘 맞습니다.` : `${identityLabel} 정보와 공식 등록 자료를 기준으로 안내합니다.`;
  return `${name}은 ${regionLabel}의 ${categoryLabelForSentence(category)}입니다. ${CATEGORY_LEADS[category]} ${sourceHint}`;
}

function categoryLabelForSentence(category: VisitInfoCategory) {
  if (category === "RESTAURANT") return "반려동물 동반 식당";
  if (category === "ANIMAL_HOSPITAL") return "동물병원";
  if (category === "PHARMACY") return "동물약국";
  if (category === "GROOMING") return "반려동물 미용 업체";
  if (category === "DAYCARE") return "유치원·호텔 업체";
  return "반려동물 장례 업체";
}

export function DetailOverviewPanel(props: DetailOverviewPanelProps) {
  const { category, regionLabel, addressLabel, phone, hasCoordinates, sourceLabel, businessStatus, dataUpdatedLabel, reviewCount, reviewAverage, checkSummary, enrichment } = props;
  const openingPreview = getOpeningPreview(enrichment);
  const googleRatingLabel = formatGoogleRating(enrichment);
  const reviewLabel = googleRatingLabel ?? formatReviewSummary(reviewCount, reviewAverage);
  const photoLabel = enrichment?.googlePhotoName ? "Google Places 사진 연결" : "사진 제보 기다리는 중";
  const externalReviewCount = typeof enrichment?.googleUserRatingCount === "number" ? enrichment.googleUserRatingCount : 0;
  const checkLabel = getBusinessCheckSummaryLabel(checkSummary);
  const trustSignals = [
    { label: "공개자료", active: Boolean(sourceLabel), value: sourceLabel },
    { label: "지도 좌표", active: hasCoordinates, value: hasCoordinates ? "핀 확인 가능" : "주소 검색 필요" },
    { label: "전화", active: Boolean(phone), value: phone ? "바로 전화 가능" : "전화번호 없음" },
    { label: "확인 제보", active: Boolean(checkSummary?.count), value: checkLabel },
    { label: "외부지도 대조", active: Boolean(enrichment), value: enrichment ? "이름·주소 매칭" : "대조 정보 없음" },
    { label: "사진", active: Boolean(enrichment?.googlePhotoName), value: enrichment?.googlePhotoName ? "사진 연결" : "사진 없음" },
    { label: "후기", active: reviewCount > 0 || externalReviewCount > 0, value: reviewLabel },
    { label: "업데이트", active: Boolean(dataUpdatedLabel), value: dataUpdatedLabel },
  ];
  const trustScore = trustSignals.filter((signal) => signal.active).length;
  const completeness = getInformationCompletenessRank(trustScore, trustSignals.length, trustSignals.filter((signal) => !signal.active).map((signal) => signal.label));
  const checks = CATEGORY_CHECKS[category];
  const facts = [
    { icon: MapPinned, label: "위치", value: `${regionLabel} · ${addressLabel}` },
    { icon: Phone, label: "전화", value: phone ? "전화로 바로 확인 가능" : "전화번호 정리 중" },
    { icon: Clock3, label: "영업", value: openingPreview ?? "오늘 운영은 업체에 직접 확인" },
    { icon: ClipboardCheck, label: "확인", value: checkSummary?.count ? `${checkLabel} · 최근 ${formatBusinessCheckDate(checkSummary.latestCheckedAt)}` : "전화 확인 제보 기다리는 중" },
    { icon: Star, label: "후기", value: reviewLabel },
    { icon: Camera, label: "사진", value: photoLabel },
    { icon: ClipboardCheck, label: "출처", value: businessStatus ? `${sourceLabel} · ${businessStatus}` : sourceLabel },
  ];

  return (
    <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-[#fbfcf8] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">방문 요약</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">검색 전에 볼 핵심만 모았어요</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{buildLead(props)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-[rgba(31,107,91,0.18)] bg-white px-4 py-4">
          <p className="flex items-center gap-2 text-xs font-black text-[var(--brand)]"><ShieldCheck size={15} /> 정보 완성도</p>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="text-4xl font-black tracking-tight text-[var(--ink)]">{completeness.grade === "NEEDS_CHECK" ? "확인" : completeness.grade}</p>
            <p className="pb-1 text-sm font-black text-[var(--brand)]">{completeness.score}/{completeness.total} · {completeness.levelLabel}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{completeness.description}</p>
          {completeness.missingLabels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {completeness.missingLabels.slice(0, 4).map((label) => (
                <span key={label} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-black text-[#c2410c]">{label} 보강</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5">
              <span className="text-xs font-black text-[var(--muted)]">{signal.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${signal.active ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[#f3f4f6] text-[var(--muted)]"}`}>
                {signal.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {facts.map((fact) => {
          const Icon = fact.icon;
          return (
            <div key={fact.label} className="flex min-h-16 items-start gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-3">
              <Icon className="mt-0.5 shrink-0 text-[var(--brand)]" size={15} />
              <div>
                <p className="text-xs font-black text-[var(--muted)]">{fact.label}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-[var(--ink)]">{fact.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-white px-4 py-3 text-sm leading-7 text-[var(--muted)] ring-1 ring-[var(--line)]">
        <span className="font-black text-[var(--ink)]">전화할 때는 </span>
        {checks.join(", ")}을 확인해보세요.
      </div>
    </section>
  );
}