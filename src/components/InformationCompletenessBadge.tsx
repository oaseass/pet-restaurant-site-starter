import type { InformationCompletenessSummary } from "@/lib/discovery-cards";

const GRADE_CLASSES: Record<InformationCompletenessSummary["grade"], string> = {
  S: "bg-[#ecfdf5] text-[#047857] ring-[#a7f3d0]",
  A: "bg-[var(--brand-soft)] text-[var(--brand)] ring-[rgba(31,107,91,0.18)]",
  B: "bg-[#eff6ff] text-[#1d4ed8] ring-[#bfdbfe]",
  C: "bg-[#fff7ed] text-[#c2410c] ring-[#fed7aa]",
  NEEDS_CHECK: "bg-[#f3f4f6] text-[var(--muted)] ring-[var(--line)]",
};

export function InformationCompletenessBadge({ summary, className = "" }: { summary: InformationCompletenessSummary; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black ring-1 ${GRADE_CLASSES[summary.grade]} ${className}`.trim()} title={`${summary.score}/${summary.total} · ${summary.levelLabel}${summary.gapLabel ? ` · ${summary.gapLabel}` : ""}`}>
      {summary.badgeLabel}
    </span>
  );
}