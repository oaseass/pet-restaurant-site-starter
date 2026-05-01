import { CheckCircle2, Clock3, TriangleAlert } from "lucide-react";

export function SyncStatusBadge({ status }: { status: "SUCCESS" | "SKIPPED" | "FAILED" }) {
  if (status === "SUCCESS") return <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]"><CheckCircle2 size={14} /> 성공</span>;
  if (status === "SKIPPED") return <span className="badge bg-[#fff5d9] text-[#8b6a20]"><Clock3 size={14} /> 스킵</span>;
  return <span className="badge bg-[#ffe9e9] text-[#b13f3f]"><TriangleAlert size={14} /> 실패</span>;
}