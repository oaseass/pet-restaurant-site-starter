import { ShieldCheck } from "lucide-react";

const POLICY_ITEMS = [
  { label: "동반 가능 여부", value: "공공데이터 기준 등록", tone: "confirmed" },
  { label: "실내 동반", value: "확인 필요", tone: "pending" },
  { label: "야외 동반", value: "확인 필요", tone: "pending" },
  { label: "대형견 가능", value: "확인 필요", tone: "pending" },
  { label: "케이지 필요", value: "확인 필요", tone: "pending" },
  { label: "목줄 필요", value: "확인 권장", tone: "pending" },
  { label: "입장 제한 조건", value: "업체 확인 필요", tone: "pending" },
] as const;

export function PetPolicyPanel() {
  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">반려동물 동반 확인 정보</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            이 식당은 공공데이터상 반려동물 동반 식당으로 정리되어 있습니다. 다만 좌석 위치, 견종 제한, 케이지 조건은 별도 확인된 정보가 아니므로 방문 전 업체에 직접 확인하는 것이 좋습니다.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {POLICY_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5">
            <span className="text-sm font-bold text-[var(--ink)]">{item.label}</span>
            <span className={item.tone === "confirmed" ? "rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-black text-[var(--brand)]" : "rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-black text-[var(--muted)]"}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}