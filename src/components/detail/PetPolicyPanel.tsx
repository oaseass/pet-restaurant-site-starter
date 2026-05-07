import { ShieldCheck } from "lucide-react";

const POLICY_ITEMS = [
  { label: "동반 등록", value: "공식 등록 정보", tone: "confirmed" },
  { label: "실내 좌석", value: "전화로 물어보기", tone: "pending" },
  { label: "야외 좌석", value: "매장마다 달라요", tone: "pending" },
  { label: "대형견", value: "제한 여부 확인", tone: "pending" },
  { label: "이동장", value: "필요 여부 확인", tone: "pending" },
  { label: "목줄", value: "챙겨가면 좋아요", tone: "pending" },
  { label: "입장 제한", value: "피크타임 전 전화", tone: "pending" },
] as const;

export function PetPolicyPanel() {
  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">강아지랑 가기 전 체크할 점</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            동반 가능 식당으로 등록된 곳이어도 좌석 위치, 견종 제한, 케이지 조건은 매장마다 달라요. 가기 전에 한 번만 물어보면 헛걸음을 줄일 수 있습니다.
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