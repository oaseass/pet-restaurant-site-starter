import { CheckCircle2, ClipboardList, MapPinned, MessageSquarePlus, Phone, ShieldCheck } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

type DetailDecisionPanelProps = {
  categoryLabel: string;
  regionLabel: string;
  addressLabel: string;
  phone?: string | null;
  hasCoordinates: boolean;
  businessStatus?: string | null;
  dataUpdatedLabel: string;
  sourceLabel: string;
  reviewCount: number;
  questions: string[];
  reportHref: string;
  reviewHref?: string;
};

type FactTone = "good" | "warn" | "muted";

function getStatusTone(value?: string | null): FactTone {
  if (!value) return "warn";
  if (value.includes("영업") || value.includes("정상")) return "good";
  return "warn";
}

function toneClass(tone: FactTone) {
  if (tone === "good") return "bg-[var(--brand-soft)] text-[var(--brand)]";
  if (tone === "warn") return "bg-[#fff7ed] text-[#9a3412]";
  return "bg-[#f3f4f6] text-[var(--muted)]";
}

function Fact({ label, value, tone }: { label: string; value: string; tone: FactTone }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-3">
      <p className="text-[11px] font-black text-[var(--muted)]">{label}</p>
      <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${toneClass(tone)}`}>{value}</p>
    </div>
  );
}

function getPriorityCopy(categoryLabel: string) {
  if (categoryLabel.includes("식당")) return "동반 가능 등록만으로는 좌석 조건이 확정되지 않아요. 실내·야외·대형견 조건을 먼저 확인하세요.";
  if (categoryLabel.includes("병원")) return "가장 중요한 건 오늘 진료 가능한 증상과 예약 여부입니다. 야간·응급은 전화 확인이 우선이에요.";
  if (categoryLabel.includes("약국")) return "찾는 약품 재고와 처방전 필요 여부가 핵심입니다. 이동 전에 전화하면 헛걸음을 줄일 수 있어요.";
  if (categoryLabel.includes("미용")) return "예약 가능한 시간, 견종·체중 제한, 노령견·피부 상태 대응 여부를 먼저 물어보세요.";
  if (categoryLabel.includes("유치원") || categoryLabel.includes("호텔")) return "입소 기준, 예방접종 증명, 사회성 테스트 여부가 실제 이용 가능성을 가릅니다.";
  if (categoryLabel.includes("장례")) return "급할수록 상담 가능 시간, 운구 가능 지역, 총 비용 포함 항목을 먼저 확인하세요.";
  return "방문 전 오늘 운영 여부와 예약·비용·준비물을 먼저 확인하세요.";
}

export function DetailDecisionPanel({
  categoryLabel,
  regionLabel,
  addressLabel,
  phone,
  hasCoordinates,
  businessStatus,
  dataUpdatedLabel,
  sourceLabel,
  reviewCount,
  questions,
  reportHref,
  reviewHref,
}: DetailDecisionPanelProps) {
  const facts = [
    { label: "전화", value: phone ? "전화로 확인 가능" : "전화번호 미등록", tone: phone ? "good" : "warn" },
    { label: "위치", value: hasCoordinates ? "지도에서 바로 보기" : "주소로 찾아보기", tone: hasCoordinates ? "good" : "warn" },
    { label: "운영", value: businessStatus ?? "업체마다 달라요", tone: getStatusTone(businessStatus) },
    { label: "후기", value: reviewCount > 0 ? `${reviewCount.toLocaleString("ko-KR")}건` : "후기 없음", tone: reviewCount > 0 ? "good" : "muted" },
  ] satisfies Array<{ label: string; value: string; tone: FactTone }>;

  return (
    <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">방문 판단</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">오늘 할 수 있는 행동만 모았어요</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {regionLabel} {categoryLabel}입니다. 주소는 {addressLabel} 기준으로 보여드리고, 운영 방식이나 세부 조건은 업체마다 다를 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reviewHref ? (
            <SmartLink href={reviewHref} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">
              <MessageSquarePlus size={14} />
              후기 남기기
            </SmartLink>
          ) : null}
          <SmartLink href={reportHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
            <ClipboardList size={14} />
            정보 알려주기
          </SmartLink>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => <Fact key={fact.label} {...fact} />)}
      </div>

      <div className="mt-4 rounded-lg border border-[rgba(31,107,91,0.18)] bg-[#f8faf9] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
        <span className="font-black text-[var(--ink)]">우선 확인: </span>
        {getPriorityCopy(categoryLabel)}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1fr]">
        <div className="rounded-lg bg-[#f8faf9] p-4 text-sm leading-7 text-[var(--muted)]">
          <p className="flex items-center gap-2 font-black text-[var(--ink)]"><ShieldCheck size={16} /> 공개자료와 보완할 정보</p>
          <p className="mt-2">{sourceLabel}를 바탕으로 정리했고, 마지막 반영일은 {dataUpdatedLabel}입니다. 메뉴·서비스·사진처럼 방문자가 알려준 정보는 확인 후 반영합니다.</p>
        </div>
        <div className="rounded-lg bg-[#fcfbf8] p-4">
          <p className="flex items-center gap-2 text-sm font-black text-[var(--ink)]"><Phone size={16} /> 전화할 때 물어볼 것</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
            {questions.map((question) => (
              <li key={question} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--brand)]" size={15} />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!hasCoordinates ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-[#fff7ed] px-3 py-2 text-xs font-bold leading-5 text-[#9a3412]">
          <MapPinned size={14} />
          지도 핀이 없는 항목은 주소 검색 결과가 실제 위치와 다를 수 있어요.
        </p>
      ) : null}
    </section>
  );
}