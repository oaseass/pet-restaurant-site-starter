import type { PlaceCategory } from "@prisma/client";

export type CharacterAsset =
  | "puppy-front-white"
  | "puppy-side-white"
  | "dog-hoodie"
  | "dog-brown"
  | "cat-waving"
  | "cat-peeking";

export type CategorySummary = {
  slug: string;
  category: PlaceCategory;
  title: string;
  shortLabel: string;
  description: string;
  href: string;
  character: CharacterAsset;
  tone?: "medical" | "travel" | "calm" | "playful";
};

export const REGION_OPTIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export const PLACE_CATEGORY_SLUGS: Record<PlaceCategory, string> = {
  PET_RESTAURANT: "pet-restaurant",
  ANIMAL_HOSPITAL: "animal-hospital",
  EMERGENCY_HOSPITAL: "emergency-hospital",
  VACCINATION: "vaccination",
  REGISTRATION: "registration",
  SURGERY: "surgery",
  TRAVEL: "travel",
  FLIGHT: "flight",
  SHIP: "ship",
  GROOMING: "grooming",
  DAYCARE: "daycare",
  HOTEL: "hotel",
  TRAINING: "training",
  PET_SUPPLY: "pet-supply",
  PET_FOOD: "pet-food",
  FUNERAL: "funeral",
  PHARMACY: "pharmacy",
  LOST_PET: "lost-pet",
  INSURANCE: "insurance",
  CHECKLIST: "checklist",
};

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  PET_RESTAURANT: "반려동물 동반 식당",
  ANIMAL_HOSPITAL: "동물병원",
  EMERGENCY_HOSPITAL: "24시 응급 병원",
  VACCINATION: "예방접종",
  REGISTRATION: "동물등록",
  SURGERY: "수술·진료비",
  TRAVEL: "반려여행",
  FLIGHT: "비행기",
  SHIP: "배",
  GROOMING: "미용",
  DAYCARE: "유치원",
  HOTEL: "호텔·위탁관리",
  TRAINING: "훈련",
  PET_SUPPLY: "용품",
  PET_FOOD: "밥·간식",
  FUNERAL: "장례",
  PHARMACY: "동물약국",
  LOST_PET: "실종 제보",
  INSURANCE: "보험",
  CHECKLIST: "체크리스트",
};

export const PRIMARY_NAV = [
  { href: "/map", label: "지도" },
  { href: "/restaurants", label: "식당" },
  { href: "/hospitals", label: "병원" },
  { href: "/pharmacy", label: "약국" },
  { href: "/grooming", label: "미용" },
  { href: "/daycare", label: "유치원" },
  { href: "/lost-pets", label: "찾아요" },
  { href: "/guide", label: "가이드" },
] as const;

export const MOBILE_NAV = [
  { href: "/", label: "홈" },
  { href: "/map", label: "지도" },
  { href: "/lost-pets", label: "찾아요" },
  { href: "/guide", label: "가이드" },
  { href: "/business", label: "마이" },
] as const;

export const QUICK_CATEGORIES: CategorySummary[] = [
  {
    slug: "restaurants",
    category: "PET_RESTAURANT",
    title: "반려동물 동반 식당",
    shortLabel: "식당",
    description: "기존 식당 데이터를 지도 중심으로 탐색하고 상세 정보까지 바로 이어집니다.",
    href: "/map",
    character: "dog-hoodie",
  },
  {
    slug: "hospitals",
    category: "ANIMAL_HOSPITAL",
    title: "동물병원",
    shortLabel: "병원",
    description: "지역별 동물병원과 공식 데이터 기준 안내를 한 번에 정리합니다.",
    href: "/hospitals",
    character: "puppy-front-white",
    tone: "medical",
  },
  {
    slug: "emergency",
    category: "EMERGENCY_HOSPITAL",
    title: "24시 응급 병원",
    shortLabel: "24시응급",
    description: "야간 진료와 응급 대응은 공식 데이터와 제보를 분리해서 보여줍니다.",
    href: "/hospitals/emergency",
    character: "cat-peeking",
    tone: "medical",
  },
  {
    slug: "vaccination",
    category: "VACCINATION",
    title: "예방접종",
    shortLabel: "예방접종",
    description: "강아지와 고양이 접종 일정을 계산하고 주의사항을 안내합니다.",
    href: "/guide/vaccination",
    character: "cat-waving",
    tone: "medical",
  },
  {
    slug: "surgery",
    category: "SURGERY",
    title: "수술·진료비",
    shortLabel: "수술",
    description: "진료비 공개 기준과 수술 전후 체크포인트를 함께 제공합니다.",
    href: "/guide/surgery",
    character: "dog-brown",
    tone: "medical",
  },
  {
    slug: "travel",
    category: "TRAVEL",
    title: "반려여행",
    shortLabel: "여행",
    description: "비행기, 배, 숙소, 이동장 체크리스트를 여행 흐름대로 정리합니다.",
    href: "/guide/travel",
    character: "puppy-side-white",
    tone: "travel",
  },
  {
    slug: "grooming",
    category: "GROOMING",
    title: "미용",
    shortLabel: "미용",
    description: "공식 데이터, 가격 참고, 업체 등록 정보를 구분해서 보여줍니다.",
    href: "/grooming",
    character: "dog-hoodie",
  },
  {
    slug: "daycare",
    category: "DAYCARE",
    title: "유치원·호텔",
    shortLabel: "유치원",
    description: "유치원, 호텔, 위탁관리 정보를 카테고리별로 묶어 보여줍니다.",
    href: "/daycare",
    character: "dog-brown",
  },
  {
    slug: "training",
    category: "TRAINING",
    title: "훈련소",
    shortLabel: "훈련",
    description: "방문훈련, 합숙훈련, 사회화 가이드를 한 화면에서 비교합니다.",
    href: "/training",
    character: "cat-waving",
  },
  {
    slug: "supplies",
    category: "PET_SUPPLY",
    title: "용품",
    shortLabel: "용품",
    description: "생활용품과 급여, 이동장, 보험 체크포인트를 묶어서 안내합니다.",
    href: "/guide/supplies",
    character: "cat-peeking",
  },
  {
    slug: "funeral",
    category: "FUNERAL",
    title: "장례",
    shortLabel: "장례",
    description: "합법 장묘업체, 사망 직후 절차, 비용 참고를 차분하게 정리합니다.",
    href: "/funeral",
    character: "puppy-front-white",
    tone: "calm",
  },
  {    slug: "pharmacy",
    category: "PHARMACY",
    title: "동물약국",
    shortLabel: "약국",
    description: "처방전 필요 의약품과 구입 가능한 약의 종류를 안내합니다.",
    href: "/pharmacy",
    character: "cat-waving",
  },
  {    slug: "lost-pets",
    category: "LOST_PET",
    title: "댕냥이 찾아요",
    shortLabel: "찾아요",
    description: "실종 글을 올리고 제보를 남기는 내부 게시판을 제공합니다.",
    href: "/lost-pets",
    character: "puppy-side-white",
  },
];

export const PLACE_CATEGORY_META: Record<string, CategorySummary> = Object.fromEntries(
  QUICK_CATEGORIES.map((item) => [item.slug, item])
) as Record<string, CategorySummary>;

export const PLACE_DIRECTORY_CATEGORIES: PlaceCategory[] = [
  "PET_RESTAURANT",
  "ANIMAL_HOSPITAL",
  "EMERGENCY_HOSPITAL",
  "GROOMING",
  "DAYCARE",
  "HOTEL",
  "TRAINING",
  "FUNERAL",
  "PHARMACY",
];

export function getPlaceCategorySlug(category: PlaceCategory) {
  return PLACE_CATEGORY_SLUGS[category];
}

export function getPlaceCategoryLabel(category: PlaceCategory) {
  return PLACE_CATEGORY_LABELS[category];
}

export function getPlaceCategoryBySlug(slug: string) {
  return (Object.entries(PLACE_CATEGORY_SLUGS).find(([, value]) => value === slug)?.[0] ?? null) as PlaceCategory | null;
}

export const TODAY_GUIDES = [
  {
    title: "반려동물 동반 식당 방문 전 확인할 것",
    description: "좌석 구역, 케이지 여부, 대형견 가능 여부를 체크하세요.",
    href: "/guide",
    character: "cat-waving" as CharacterAsset,
  },
  {
    title: "강아지 비행기 타는 법",
    description: "사전 승인, 이동장 규격, 요금, 제한 품종을 먼저 확인하세요.",
    href: "/guide/flight",
    character: "puppy-side-white" as CharacterAsset,
  },
  {
    title: "예방접종 일정 확인하기",
    description: "월령에 맞는 접종 시점과 전후 주의사항을 계산해보세요.",
    href: "/calculators/vaccination-schedule",
    character: "dog-hoodie" as CharacterAsset,
  },
  {
    title: "실종 시 바로 해야 할 일",
    description: "목격 제보를 받을 수 있게 게시글을 먼저 등록하세요.",
    href: "/lost-pets/new",
    character: "cat-peeking" as CharacterAsset,
  },
];

export const AROUND_ME_ITEMS = [
  { title: "내 주변 식당", href: "/map", description: "식당 데이터 지도 탐색" },
  { title: "내 주변 병원", href: "/map?category=hospitals", description: "준비중 카테고리 구조 미리 보기" },
  { title: "내 주변 미용", href: "/map?category=grooming", description: "준비중 상태로 지도 UX 확인" },
  { title: "내 주변 유치원", href: "/map?category=daycare", description: "유치원 카테고리 준비중" },
];

export const POLICY_LINKS = [
  { href: "/policies/privacy", label: "개인정보처리방침" },
  { href: "/policies/terms", label: "이용약관" },
  { href: "/policies/reports", label: "제보 운영정책" },
  { href: "/policies/ads", label: "광고·제휴 고지" },
  { href: "/policies/medical", label: "의료정보 면책" },
  { href: "/policies/legal", label: "법률정보 기준일" },
];

export type GuideDoc = {
  slug: string;
  category: PlaceCategory;
  title: string;
  summary: string;
  sourceNote: string;
  sourceUrls: string[];
  reviewedAt: string;
  medicalDisclaimer?: boolean;
  legalDisclaimer?: boolean;
  sections: Array<{ title: string; bullets: string[] }>;
};

export const GUIDE_DOCS: GuideDoc[] = [
  {
    slug: "travel",
    category: "TRAVEL",
    title: "댕냥이와 여행가기",
    summary: "이동장, 예방접종, 숙소, 멀미 대처, 현지 산책 동선까지 여행 전 체크리스트를 한 번에 봅니다.",
    sourceNote: "항공·선박·숙소 정책은 사업자별로 다르며, 공식 페이지 최종 확인이 필요합니다.",
    sourceUrls: ["https://www.airport.kr", "https://www.visitkorea.or.kr"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "출발 전 체크", bullets: ["이동장, 식수, 배변패드, 진정 루틴을 미리 준비하세요.", "숙소의 반려동물 정책과 청소비 여부를 확인하세요.", "멀미가 잦다면 수의사 상담 후 보조제를 검토하세요."] },
      { title: "이동 중 체크", bullets: ["휴게소·산책 포인트를 미리 정해 과도한 이동을 줄이세요.", "여행 중 낯선 음식은 최소화하고 평소 먹던 사료를 유지하세요."] },
    ],
  },
  {
    slug: "flight",
    category: "FLIGHT",
    title: "비행기 타는 법",
    summary: "강아지와 고양이의 국내선·국제선 탑승 전 준비, 사전 승인, 이동장, 검역, 요금 개념을 정리합니다.",
    sourceNote: "항공사 규정은 자주 바뀌므로 반드시 항공사 공식 페이지에서 최종 확인하세요.",
    sourceUrls: ["https://www.koreanair.com", "https://flyasiana.com", "https://www.jejuair.net"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "탑승 준비", bullets: ["예약 전 반려동물 동반 가능 노선인지 확인하세요.", "국내선·국제선은 서류와 검역 기준이 다를 수 있습니다.", "이동장 무게와 규격은 항공사 기준을 따라야 합니다."] },
      { title: "주의사항", bullets: ["제한 품종, 환절기 온도 제한, 기압 변화는 반드시 확인이 필요합니다.", "최종 탑승 여부는 현장 판단이 반영될 수 있습니다."] },
    ],
  },
  {
    slug: "ship",
    category: "SHIP",
    title: "배 타는 법",
    summary: "선사별 정책 차이가 큰 반려동물 선박 탑승 정보를 케이지, 목줄, 객실 여부 중심으로 봅니다.",
    sourceNote: "선사별 안내가 제각각이므로 공식 고객센터 또는 안내문을 최종 확인하세요.",
    sourceUrls: ["https://www.seaferry.co.kr"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "예약 전 확인", bullets: ["객실 동반 가능 여부와 갑판 이동 규칙을 확인하세요.", "출항 전 탑승 제한 품종과 이동장 규정을 체크하세요."] },
      { title: "승선 당일", bullets: ["목줄 또는 이동장 사용 여부를 체크하고, 배변 대비 물품을 챙기세요.", "멀미가 심하면 사전에 수의사 상담이 필요합니다."] },
    ],
  },
  {
    slug: "vaccination",
    category: "VACCINATION",
    title: "예방접종",
    summary: "강아지와 고양이 예방접종 기본 흐름, 광견병과 종합백신, 외부기생충 관리 포인트를 정리합니다.",
    sourceNote: "개별 접종 계획은 반드시 수의사 상담 후 결정해야 합니다.",
    sourceUrls: ["https://www.kahis.go.kr"],
    reviewedAt: "2026-05-01",
    medicalDisclaimer: true,
    sections: [
      { title: "기본 흐름", bullets: ["입양 초기에는 월령에 맞춰 종합백신과 광견병 계획을 확인하세요.", "강아지와 고양이의 접종 주기와 항목은 다릅니다."] },
      { title: "접종 전후", bullets: ["열, 구토, 식욕 저하가 지속되면 즉시 병원에 상담하세요.", "접종 후 과격한 운동과 목욕은 보통 하루 이상 피하는 편이 좋습니다."] },
    ],
  },
  {
    slug: "registration",
    category: "REGISTRATION",
    title: "동물등록·법률",
    summary: "동물등록 대상, 변경 신고, 분실 신고, 과태료와 기준일 안내를 제공합니다.",
    sourceNote: "지자체별 운영 방식이 다를 수 있으므로 관할 지자체 공지를 함께 확인하세요.",
    sourceUrls: ["https://www.animal.go.kr"],
    reviewedAt: "2026-05-01",
    legalDisclaimer: true,
    sections: [
      { title: "등록과 변경", bullets: ["내장칩과 외장칩 방식 중 지역 기준에 맞는 절차를 확인하세요.", "주소, 연락처, 소유자 정보 변경 시 신고 기한을 지켜야 합니다."] },
      { title: "분실·사망 신고", bullets: ["실종 즉시 분실 신고를 하고 연락처 최신 상태를 유지하세요.", "사망 시 관련 변경 신고도 함께 처리해야 합니다."] },
    ],
  },
  {
    slug: "surgery",
    category: "SURGERY",
    title: "수술·진료비",
    summary: "중성화, 슬개골, 스케일링, 종양 등 자주 묻는 수술과 공개 진료비를 참고용으로 정리합니다.",
    sourceNote: "가격은 병원마다 달라질 수 있으며, 확정 가격으로 안내하지 않습니다.",
    sourceUrls: ["https://www.animal.go.kr"],
    reviewedAt: "2026-05-01",
    medicalDisclaimer: true,
    sections: [
      { title: "수술 전", bullets: ["기본 검사, 마취 리스크, 회복 계획을 미리 상담하세요.", "수술비는 검사·입원·약 처방 여부에 따라 달라집니다."] },
      { title: "수술 후", bullets: ["상처 관리, 식사, 활동 제한 지침을 따르세요.", "이상 증상은 즉시 병원에 문의해야 합니다."] },
    ],
  },
  {
    slug: "training",
    category: "TRAINING",
    title: "훈련 가이드",
    summary: "배변, 짖음, 분리불안, 사회화, 방문훈련과 합숙훈련의 차이를 정리합니다.",
    sourceNote: "훈련은 보호자 환경에 따라 달라지므로 장기 계획을 세우는 것이 중요합니다.",
    sourceUrls: ["https://www.kcma.or.kr"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "기본 원칙", bullets: ["짧고 자주 반복하는 루틴이 가장 중요합니다.", "분리불안과 공격성은 원인 파악이 먼저 필요합니다."] },
      { title: "훈련 방식", bullets: ["방문훈련은 생활환경 맞춤형 조정에 강점이 있습니다.", "합숙훈련은 보호자 재교육이 함께 이뤄지지 않으면 유지가 어렵습니다."] },
    ],
  },
  {
    slug: "grooming",
    category: "GROOMING",
    title: "미용 가이드",
    summary: "위생미용, 전체미용, 발톱, 귀청소, 고양이 미용 주의사항까지 정리합니다.",
    sourceNote: "고양이 미용과 노령견 미용은 스트레스 관리가 중요합니다.",
    sourceUrls: ["https://www.animal.go.kr"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "방문 전", bullets: ["미용 목적이 위생인지 스타일인지 먼저 정리하세요.", "미용 스트레스가 큰 아이는 시간을 짧게 나누는 편이 좋습니다."] },
      { title: "방문 후", bullets: ["면도 후 체온 유지와 피부 자극 여부를 관찰하세요.", "귀청소, 발톱정리 후 예민 반응이 길게 가면 병원 상담이 필요할 수 있습니다."] },
    ],
  },
  {
    slug: "food",
    category: "PET_FOOD",
    title: "밥·간식",
    summary: "건식/습식, 알러지, 처방식, 노령견·노령묘 급여 포인트를 정리합니다.",
    sourceNote: "처방식, 만성질환 식이는 수의사 상담 후 결정해야 합니다.",
    sourceUrls: ["https://www.animal.go.kr"],
    reviewedAt: "2026-05-01",
    medicalDisclaimer: true,
    sections: [
      { title: "급여 기본", bullets: ["활동량과 체중, 중성화 여부에 따라 급여량이 달라집니다.", "사료 변경은 5~7일 이상 천천히 전환하는 것이 일반적입니다."] },
      { title: "주의 음식", bullets: ["양파, 포도, 초콜릿 등은 급여 금지 식품입니다.", "질환이 있으면 일반 정보가 아닌 전문 상담이 우선입니다."] },
    ],
  },
  {
    slug: "supplies",
    category: "PET_SUPPLY",
    title: "용품 가이드",
    summary: "이동장, 산책용품, 위생용품, 장난감, 보험 체크포인트를 묶어서 보여줍니다.",
    sourceNote: "안전 인증과 소재, 사용 환경을 함께 확인하세요.",
    sourceUrls: ["https://www.kats.go.kr"],
    reviewedAt: "2026-05-01",
    sections: [
      { title: "기본 용품", bullets: ["이동장, 하네스, 배변패드, 식기, 칫솔은 생활 필수품입니다.", "체형과 행동 특성에 맞는 규격을 선택해야 합니다."] },
      { title: "선택 팁", bullets: ["리뷰보다 실제 안전성과 관리 편의성을 우선하세요.", "고양이 용품은 수직공간과 숨숨집 구성도 함께 고려하세요."] },
    ],
  },
  {
    slug: "funeral",
    category: "FUNERAL",
    title: "장례 가이드",
    summary: "사망 직후 해야 할 일, 합법 장묘업체 찾기, 비용 참고, 동물등록 사망신고를 차분하게 안내합니다.",
    sourceNote: "장묘업체는 허가 여부와 실제 서비스 범위를 반드시 다시 확인하세요.",
    sourceUrls: ["https://www.animal.go.kr"],
    reviewedAt: "2026-05-01",
    legalDisclaimer: true,
    sections: [
      { title: "사망 직후", bullets: ["가족과 충분히 시간을 보낸 뒤 절차를 정리하세요.", "체온 유지와 위생 관리, 이동 계획을 먼저 체크하세요."] },
      { title: "업체 선택", bullets: ["허가 장묘업체 여부와 화장/봉안/수목장 범위를 확인하세요.", "비용은 지역·서비스 구성에 따라 크게 달라질 수 있습니다."] },
    ],
  },
];

export const GUIDE_DOC_MAP = Object.fromEntries(GUIDE_DOCS.map((doc) => [doc.slug, doc]));

export const CALCULATOR_CARDS = [
  { href: "/calculators/vaccination-schedule", title: "예방접종 일정 계산기", description: "월령과 마지막 접종일을 기준으로 다음 일정을 계산합니다." },
  { href: "/calculators/monthly-cost", title: "월 양육비 계산기", description: "사료비, 병원비, 호텔비까지 월/연 비용을 추정합니다." },
  { href: "/calculators/feeding", title: "사료 급여량 계산기", description: "체중과 활동량, 사료 kcal 기준으로 하루 급여량을 계산합니다." },
];