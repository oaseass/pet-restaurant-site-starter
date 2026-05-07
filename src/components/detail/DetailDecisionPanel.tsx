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
    { label: "전화", value: phone ? "전화로 확인 가능" : "전화번호 제보 필요", tone: phone ? "good" : "warn" },
    { label: "위치", value: hasCoordinates ? "지도에서 바로 보기" : "주소로 찾아보기", tone: hasCoordinates ? "good" : "warn" },
    { label: "운영", value: businessStatus ?? "업체마다 달라요", tone: getStatusTone(businessStatus) },
    { label: "후기", value: reviewCount > 0 ? `${reviewCount.toLocaleString("ko-KR")}건` : "아직 후기가 없어요", tone: reviewCount > 0 ? "good" : "muted" },
    { label: "업데이트", value: dataUpdatedLabel, tone: "muted" },
    { label: "정보", value: sourceLabel, tone: "muted" },
  ] satisfies Array<{ label: string; value: string; tone: FactTone }>;

  return (
    <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">가기 전에 볼 것</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">오늘 바로 갈 수 있는지 먼저 살펴보세요</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {regionLabel} {categoryLabel} 정보입니다. 주소는 {addressLabel} 기준으로 보여드려요. 운영 방식이나 세부 조건은 업체마다 다를 수 있습니다.
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

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => <Fact key={fact.label} {...fact} />)}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1fr]">
        <div className="rounded-lg bg-[#f8faf9] p-4 text-sm leading-7 text-[var(--muted)]">
          <p className="flex items-center gap-2 font-black text-[var(--ink)]"><ShieldCheck size={16} /> 정보 기준</p>
          <p className="mt-2">정부 공개자료, 직접 제보, 지도 정보와 잘 맞는 내용만 골라 보여드립니다.</p>
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