import { ClipboardCheck } from "lucide-react";

export type VisitInfoCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

type VisitInfoPanelProps = {
  category: VisitInfoCategory;
};

const VISIT_INFO: Record<VisitInfoCategory, { title: string; description: string; items: { label: string; value: string; tone?: "confirmed" | "pending" }[] }> = {
  RESTAURANT: {
    title: "강아지랑 가기 전 체크할 점",
    description: "동반 가능 식당으로 등록된 곳이라도 좌석 위치, 견종 제한, 케이지 조건, 피크타임 운영은 매장마다 달라요.",
    items: [
      { label: "동반 등록", value: "공식 등록 정보", tone: "confirmed" },
      { label: "실내 좌석", value: "전화로 물어보기" },
      { label: "야외 좌석", value: "매장마다 달라요" },
      { label: "대형견", value: "제한 여부 확인" },
      { label: "이동장", value: "필요 여부 확인" },
      { label: "목줄", value: "챙겨가면 좋아요" },
      { label: "메뉴", value: "현장 메뉴 확인" },
      { label: "피크타임", value: "운영이 달라질 수 있어요" },
    ],
  },
  ANIMAL_HOSPITAL: {
    title: "병원 가기 전에 물어볼 것",
    description: "동물병원은 진료 동물, 야간·응급 운영, 예약 방식이 병원마다 다릅니다. 방문 전 전화로 진료 가능 조건을 확인해 주세요.",
    items: [
      { label: "오늘 진료", value: "먼저 전화하기" },
      { label: "예약", value: "필요할 수 있어요" },
      { label: "야간·응급", value: "운영 방식 확인" },
      { label: "강아지·고양이", value: "진료 범위 확인" },
      { label: "예방접종", value: "예약 여부 확인" },
      { label: "수술 상담", value: "가능 여부 확인" },
      { label: "주차", value: "방문 전 확인" },
    ],
  },
  PHARMACY: {
    title: "약국 가기 전에 물어볼 것",
    description: "동물약국은 취급 품목과 재고가 수시로 달라질 수 있습니다. 필요한 약품이 있다면 방문 전 전화 확인이 가장 안전합니다.",
    items: [
      { label: "동물의약품", value: "공식 등록 정보", tone: "confirmed" },
      { label: "찾는 약 재고", value: "전화로 물어보기" },
      { label: "처방전", value: "필요 여부 확인" },
      { label: "강아지·고양이", value: "용량 구분 확인" },
      { label: "영업시간", value: "오늘 시간 확인" },
    ],
  },
  GROOMING: {
    title: "미용 예약 전에 물어볼 것",
    description: "미용실은 견종, 크기, 모질, 공격성 여부에 따라 예약 가능 조건과 비용이 달라질 수 있습니다.",
    items: [
      { label: "예약", value: "먼저 잡는 편이 좋아요" },
      { label: "강아지 미용", value: "견종별 확인" },
      { label: "고양이 미용", value: "가능 여부 확인" },
      { label: "대형견", value: "크기 제한 확인" },
      { label: "발톱·귀 관리", value: "포함 여부 확인" },
      { label: "피부·노령", value: "상담 후 예약" },
      { label: "보호자 대기", value: "첫 미용이면 물어보기" },
    ],
  },
  DAYCARE: {
    title: "맡기기 전에 물어볼 것",
    description: "위탁·호텔·훈련 시설은 예방접종, 사회성, 중성화 여부 등 입소 기준이 다를 수 있습니다. 첫 방문 전 상담을 권장합니다.",
    items: [
      { label: "유치원", value: "운영 프로그램 확인" },
      { label: "호텔링", value: "장기 위탁 가능 여부" },
      { label: "훈련", value: "상담 방식 확인" },
      { label: "사회성 테스트", value: "필요할 수 있어요" },
      { label: "예방접종", value: "증명 요구 가능" },
      { label: "대형견", value: "입소 기준 확인" },
      { label: "CCTV·픽업", value: "제공 여부 확인" },
    ],
  },
  FUNERAL: {
    title: "상담 전에 물어볼 것",
    description: "반려동물 장례는 상담 방식, 운구 가능 지역, 장례 절차, 비용 안내가 업체마다 다릅니다. 급한 상황일수록 전화 확인이 필요합니다.",
    items: [
      { label: "화장", value: "가능 시간 확인" },
      { label: "추모 절차", value: "방식이 달라요" },
      { label: "봉안·유골함", value: "선택지 확인" },
      { label: "픽업", value: "가능 지역 확인" },
      { label: "비용", value: "항목별로 물어보기" },
      { label: "허가 여부", value: "꼭 확인하세요" },
      { label: "서류", value: "제공 여부 확인" },
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