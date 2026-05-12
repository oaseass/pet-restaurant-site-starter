"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, ClipboardCheck, PhoneCall, Send, ShieldCheck } from "lucide-react";
import {
  BUSINESS_CHECK_RESULT_LABELS,
  BUSINESS_CHECK_RESULTS,
  BUSINESS_CHECK_TYPE_LABELS,
  BUSINESS_CHECK_TYPES,
  formatBusinessCheckDate,
  getBusinessCheckSummaryLabel,
  type BusinessCheckResultValue,
  type BusinessCheckSummary,
  type BusinessCheckTargetType,
  type BusinessCheckTypeValue,
} from "@/lib/business-checks-shared";

type BusinessCheckPanelProps = {
  targetType: BusinessCheckTargetType;
  targetId: string;
  categoryLabel: string;
  summary: BusinessCheckSummary;
};

type SubmitState = "idle" | "submitting" | "submitted" | "error";

export function BusinessCheckPanel({ targetType, targetId, categoryLabel, summary }: BusinessCheckPanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [checkType, setCheckType] = useState<BusinessCheckTypeValue>("PHONE_CALL");
  const [result, setResult] = useState<BusinessCheckResultValue>("CONFIRMED_OPEN");
  const [checkedAt, setCheckedAt] = useState(today);
  const [note, setNote] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;

    setState("submitting");
    setMessage("");

    const response = await fetch("/api/business-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, checkType, result, checkedAt, note }),
    });
    const payload = await response.json().catch(() => ({ message: "잠시 후 다시 시도해 주세요." }));

    if (!response.ok) {
      setState("error");
      setMessage(String(payload.message ?? "잠시 후 다시 시도해 주세요."));
      return;
    }

    setState("submitted");
    setMessage("직접 확인한 내용이 접수되었습니다. 검수 후 최근 운영 확인에 반영됩니다.");
    setNote("");
    setIsFormOpen(false);
  };

  return (
    <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">
            <ShieldCheck size={15} /> 최근 운영 확인
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[var(--ink)]">최근에 직접 확인된 내용</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {categoryLabel}은 운영 여부, 예약, 재고, 동반 조건이 자주 바뀝니다. 최근에 직접 확인된 내용만 따로 보여주고, 새 확인 결과도 받을 수 있습니다.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[#fafdf9] px-4 py-3">
          <p className="text-xs font-black text-[var(--muted)]">최근 승인 기록</p>
          <p className="mt-1 text-lg font-black text-[var(--ink)]">{getBusinessCheckSummaryLabel(summary)}</p>
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">최근 {formatBusinessCheckDate(summary.latestCheckedAt)}</p>
        </div>
      </div>

      {summary.count > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          {BUSINESS_CHECK_RESULTS.map((item) => summary.resultCounts[item] ? (
            <span key={item} className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand)]">
              {BUSINESS_CHECK_RESULT_LABELS[item]} {summary.resultCounts[item]?.toLocaleString("ko-KR")}건
            </span>
          ) : null)}
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--line)] bg-[#fcfbf8] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[var(--ink)]">새 확인 결과 보내기</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">전화나 방문으로 확인한 최신 운영 내용을 짧게 남겨주세요.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--ink)]"
            aria-expanded={isFormOpen}
          >
            {isFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isFormOpen ? "폼 접기" : "직접 확인 보내기"}
          </button>
        </div>

        {isFormOpen ? (
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              확인 방식
              <select value={checkType} onChange={(event) => setCheckType(event.target.value as BusinessCheckTypeValue)} className="input rounded-xl text-sm">
                {BUSINESS_CHECK_TYPES.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_TYPE_LABELS[item]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              확인 결과
              <select value={result} onChange={(event) => setResult(event.target.value as BusinessCheckResultValue)} className="input rounded-xl text-sm">
                {BUSINESS_CHECK_RESULTS.map((item) => <option key={item} value={item}>{BUSINESS_CHECK_RESULT_LABELS[item]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)]">
              확인일
              <input type="date" value={checkedAt} max={today} onChange={(event) => setCheckedAt(event.target.value)} required className="input rounded-xl text-sm" />
            </label>
            <label className="space-y-2 text-xs font-black text-[var(--muted)] sm:col-span-2">
              짧은 메모
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} className="input min-h-24 rounded-xl py-3 text-sm" placeholder="예: 오늘 전화했더니 예약 후 방문 가능하다고 안내받았어요." />
            </label>
            <button type="submit" disabled={state === "submitting"} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
              {state === "submitting" ? <PhoneCall size={14} /> : state === "submitted" ? <ClipboardCheck size={14} /> : <Send size={14} />}
              {state === "submitting" ? "접수 중..." : state === "submitted" ? "접수 완료" : "직접 확인한 내용 보내기"}
            </button>
          </form>
        ) : null}
      </div>

      {message ? (
        <p className={`mt-3 rounded-lg px-4 py-3 text-sm font-black ${state === "error" ? "bg-[#fff1e8] text-[#b45309]" : "bg-[var(--brand-soft)] text-[var(--brand)]"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
