import { CheckCircle2 } from "lucide-react";

const CHECKLIST = [
  "방문 전 전화 또는 지도 리뷰로 영업 여부 확인",
  "반려동물 동반 좌석 위치 확인",
  "대형견 또는 다견 동반 가능 여부 확인",
  "목줄, 이동장, 배변봉투 준비",
  "피크타임에는 입장이 제한될 수 있음",
  "짖음, 배변, 테이블 접촉 관리 필요",
] as const;

export function VisitChecklist() {
  return (
    <section className="card rounded-[1rem] p-5">
      <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">방문 전 확인 체크리스트</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
        반려동물 동반 식당은 같은 브랜드나 같은 지역이라도 운영 방식이 다를 수 있습니다. 아래 항목을 확인하면 도착 후 입장 제한이나 주변 손님과의 마찰을 줄일 수 있습니다.
      </p>
      <ul className="mt-4 grid gap-2">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex gap-2 rounded-lg bg-[#fafdf9] px-3 py-2 text-sm font-bold leading-6 text-[#4f5a55]">
            <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--brand)]" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}