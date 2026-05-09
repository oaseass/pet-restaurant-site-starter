export const BUSINESS_CHECK_TYPES = ["PHONE_CALL", "VISIT"] as const;
export const BUSINESS_CHECK_RESULTS = ["CONFIRMED_OPEN", "NO_ANSWER", "NEEDS_UPDATE", "CLOSED_OR_UNAVAILABLE"] as const;
export const RECENT_BUSINESS_CHECK_DAYS = 30;

export type BusinessCheckTargetType = "RESTAURANT" | "PLACE";
export type BusinessCheckTypeValue = (typeof BUSINESS_CHECK_TYPES)[number];
export type BusinessCheckResultValue = (typeof BUSINESS_CHECK_RESULTS)[number];

export type PublicBusinessCheckItem = {
  id: string;
  checkType: BusinessCheckTypeValue;
  result: BusinessCheckResultValue;
  checkedAt: string;
  createdAt: string;
};

export type BusinessCheckSummary = {
  targetType: BusinessCheckTargetType;
  targetId: string;
  count: number;
  latestCheckedAt: string | null;
  latestResult: BusinessCheckResultValue | null;
  resultCounts: Partial<Record<BusinessCheckResultValue, number>>;
  recentChecks: PublicBusinessCheckItem[];
};

export const BUSINESS_CHECK_TYPE_LABELS: Record<BusinessCheckTypeValue, string> = {
  PHONE_CALL: "전화 확인",
  VISIT: "방문 확인",
};

export const BUSINESS_CHECK_RESULT_LABELS: Record<BusinessCheckResultValue, string> = {
  CONFIRMED_OPEN: "정상 확인",
  NO_ANSWER: "전화 안 받음",
  NEEDS_UPDATE: "정보 수정 필요",
  CLOSED_OR_UNAVAILABLE: "운영 확인 필요",
};

export function createEmptyBusinessCheckSummary(targetType: BusinessCheckTargetType, targetId: string): BusinessCheckSummary {
  return {
    targetType,
    targetId,
    count: 0,
    latestCheckedAt: null,
    latestResult: null,
    resultCounts: {},
    recentChecks: [],
  };
}

export function formatBusinessCheckDate(value?: string | null) {
  if (!value) return "확인 기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "확인 기록 없음";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function getBusinessCheckSummaryLabel(summary?: BusinessCheckSummary | null) {
  if (!summary || summary.count <= 0) return "확인 제보 기다리는 중";
  const latestLabel = summary.latestResult ? BUSINESS_CHECK_RESULT_LABELS[summary.latestResult] : "확인됨";
  return `${summary.count.toLocaleString("ko-KR")}건 · ${latestLabel}`;
}

export function isRecentBusinessCheck(summary?: BusinessCheckSummary | null, days = RECENT_BUSINESS_CHECK_DAYS) {
  if (!summary?.latestCheckedAt) return false;
  const checkedAt = new Date(summary.latestCheckedAt).getTime();
  if (Number.isNaN(checkedAt)) return false;
  return Date.now() - checkedAt <= days * 24 * 60 * 60 * 1000;
}

export function getBusinessCheckBadgeLabel(summary?: BusinessCheckSummary | null) {
  if (!summary || summary.count <= 0) return null;
  const latestCheck = summary.recentChecks[0];
  const typeLabel = latestCheck ? BUSINESS_CHECK_TYPE_LABELS[latestCheck.checkType] : "확인";
  const resultLabel = summary.latestResult ? BUSINESS_CHECK_RESULT_LABELS[summary.latestResult] : "확인됨";
  return `${isRecentBusinessCheck(summary) ? "최근 " : ""}${typeLabel} · ${resultLabel}`;
}
