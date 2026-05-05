import { ClipboardCheck } from "lucide-react";

export type VisitInfoCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

type VisitInfoPanelProps = {
  category: VisitInfoCategory;
};

const VISIT_INFO: Record<VisitInfoCategory, { title: string; description: string; items: { label: string; value: string; tone?: "confirmed" | "pending" }[] }> = {
  RESTAURANT: {
    title: "반려동물 동반 확인 정보",
    description: "이 식당은 공공데이터상 반려동물 동반 식당으로 정리되어 있습니다. 좌석 위치, 견종 제한, 케이지 조건, 피크타임 운영은 업체 정책에 따라 달라질 수 있습니다.",
    items: [
      { label: "동반 가능 여부", value: "공공데이터 기준 등록", tone: "confirmed" },
      { label: "실내 동반", value: "확인 필요" },
      { label: "야외 동반", value: "확인 필요" },
      { label: "대형견 가능", value: "확인 필요" },
      { label: "케이지 필요", value: "확인 필요" },
      { label: "목줄 필요", value: "확인 권장" },
      { label: "대표 메뉴", value: "확인 필요" },
      { label: "피크타임 입장 제한", value: "업체 확인 필요" },
    ],
  },
  ANIMAL_HOSPITAL: {
    title: "진료 전 확인 정보",
    description: "동물병원은 진료 동물, 야간·응급 운영, 예약 방식이 병원마다 다릅니다. 방문 전 전화로 진료 가능 조건을 확인해 주세요.",
    items: [
      { label: "진료 가능 여부", value: "업체 확인 필요" },
      { label: "전화 예약", value: "확인 권장" },
      { label: "응급/야간 진료", value: "확인 필요" },
      { label: "강아지/고양이 진료", value: "확인 필요" },
      { label: "예방접종 가능", value: "확인 필요" },
      { label: "수술 가능", value: "확인 필요" },
      { label: "주차 가능", value: "확인 필요" },
    ],
  },
  PHARMACY: {
    title: "방문 전 확인 정보",
    description: "동물약국은 취급 품목과 재고가 수시로 달라질 수 있습니다. 필요한 약품이 있다면 방문 전 전화 확인이 가장 안전합니다.",
    items: [
      { label: "동물의약품 취급", value: "공공데이터 기준 등록", tone: "confirmed" },
      { label: "원하는 약품 재고", value: "전화 확인 권장" },
      { label: "처방전 필요 여부", value: "확인 필요" },
      { label: "강아지/고양이 약 구분", value: "확인 필요" },
      { label: "영업시간", value: "확인 필요" },
    ],
  },
  GROOMING: {
    title: "미용 예약 전 확인 정보",
    description: "미용실은 견종, 크기, 모질, 공격성 여부에 따라 예약 가능 조건과 비용이 달라질 수 있습니다.",
    items: [
      { label: "예약 필요", value: "확인 권장" },
      { label: "강아지 미용", value: "확인 필요" },
      { label: "고양이 미용", value: "확인 필요" },
      { label: "대형견 가능", value: "확인 필요" },
      { label: "발톱/귀/항문낭 관리", value: "확인 필요" },
      { label: "피부 질환/노령견 가능", value: "확인 필요" },
      { label: "미용 후 이상반응", value: "확인 권장" },
    ],
  },
  DAYCARE: {
    title: "위탁·호텔·훈련 확인 정보",
    description: "위탁·호텔·훈련 시설은 예방접종, 사회성, 중성화 여부 등 입소 기준이 다를 수 있습니다. 첫 방문 전 상담을 권장합니다.",
    items: [
      { label: "유치원 운영", value: "확인 필요" },
      { label: "호텔/장기 위탁", value: "확인 필요" },
      { label: "훈련/행동교정", value: "업체 확인 필요" },
      { label: "사회성 테스트", value: "확인 필요" },
      { label: "예방접종 증명 요구", value: "확인 필요" },
      { label: "대형견 가능", value: "확인 필요" },
      { label: "CCTV/픽업 가능", value: "확인 필요" },
    ],
  },
  FUNERAL: {
    title: "장례 상담 전 확인 정보",
    description: "반려동물 장례는 상담 방식, 운구 가능 지역, 장례 절차, 비용 안내가 업체마다 다릅니다. 급한 상황일수록 전화 확인이 필요합니다.",
    items: [
      { label: "화장 가능", value: "확인 필요" },
      { label: "장례식/추모 절차", value: "확인 필요" },
      { label: "봉안/유골함", value: "확인 필요" },
      { label: "픽업 가능", value: "확인 필요" },
      { label: "비용", value: "업체 확인 필요" },
      { label: "허가 업체 여부", value: "확인 권장" },
      { label: "장례 후 서류 제공 여부", value: "확인 필요" },
    ],
  },
};

export function VisitInfoPanel({ category }: VisitInfoPanelProps) {
  const info = VISIT_INFO[category];

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <ClipboardCheck size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">{info.title}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{info.description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {info.items.map((item) => (
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