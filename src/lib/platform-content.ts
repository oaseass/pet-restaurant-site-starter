import type { PlaceCategory } from "@prisma/client";

export type CharacterAsset =
  | "puppy-front-white"
  | "puppy-side-white"
  | "dog-hoodie"
  | "dog-brown"
  | "cat-waving"
  | "cat-peeking"
  | "theme-hospital"
  | "theme-restaurant"
  | "theme-grooming"
  | "theme-hotel"
  | "theme-pharmacy"
  | "theme-memorial"
  | "gen-shiba"
  | "gen-corgi"
  | "gen-maltese";

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
  { href: "/categories", label: "카테고리" },
  { href: "/guide", label: "가이드" },
  { href: "/business", label: "등록" },
] as const;

export const QUICK_CATEGORIES: CategorySummary[] = [
  {
    slug: "restaurants",
    category: "PET_RESTAURANT",
    title: "반려동물 동반 식당",
    shortLabel: "식당",
    description: "강아지와 갈 식당을 찾고 좌석 조건은 방문 전에 확인하세요.",
    href: "/map",
    character: "theme-restaurant",
  },
  {
    slug: "hospitals",
    category: "ANIMAL_HOSPITAL",
    title: "동물병원",
    shortLabel: "병원",
    description: "가까운 동물병원을 찾고 오늘 진료 가능한지 전화로 확인하세요.",
    href: "/hospitals",
    character: "theme-hospital",
    tone: "medical",
  },
  {
    slug: "emergency",
    category: "EMERGENCY_HOSPITAL",
    title: "24시 응급 병원",
    shortLabel: "24시응급",
    description: "야간·응급 진료 여부를 먼저 확인하고 이동하세요.",
    href: "/hospitals/emergency",
    character: "theme-hospital",
    tone: "medical",
  },
  {
    slug: "vaccination",
    category: "VACCINATION",
    title: "예방접종",
    shortLabel: "예방접종",
    description: "강아지와 고양이 접종 시기와 전후 주의사항을 챙겨보세요.",
    href: "/guide/vaccination",
    character: "theme-hospital",
    tone: "medical",
  },
  {
    slug: "surgery",
    category: "SURGERY",
    title: "수술·진료비",
    shortLabel: "수술",
    description: "상담 전에 물어볼 비용과 수술 전후 체크포인트를 정리했어요.",
    href: "/guide/surgery",
    character: "theme-hospital",
    tone: "medical",
  },
  {
    slug: "travel",
    category: "TRAVEL",
    title: "반려여행",
    shortLabel: "여행",
    description: "이동장, 숙소, 항공·선박 준비를 여행 흐름대로 챙겨보세요.",
    href: "/guide/travel",
    character: "gen-corgi",
    tone: "travel",
  },
  {
    slug: "grooming",
    category: "GROOMING",
    title: "미용",
    shortLabel: "미용",
    description: "미용업소를 찾고 견종·크기별 예약 조건을 확인하세요.",
    href: "/grooming",
    character: "theme-grooming",
  },
  {
    slug: "daycare",
    category: "DAYCARE",
    title: "유치원·호텔",
    shortLabel: "유치원",
    description: "유치원, 호텔, 위탁관리 업체를 찾고 입소 기준을 확인하세요.",
    href: "/daycare",
    character: "theme-hotel",
  },
  {
    slug: "training",
    category: "TRAINING",
    title: "훈련소",
    shortLabel: "훈련",
    description: "방문훈련, 합숙훈련, 사회화 상담을 준비할 때 참고하세요.",
    href: "/training",
    character: "gen-shiba",
  },
  {
    slug: "supplies",
    category: "PET_SUPPLY",
    title: "용품",
    shortLabel: "용품",
    description: "이동장, 급여, 생활용품을 고를 때 확인할 점을 모았습니다.",
    href: "/guide/pet-supply",
    character: "gen-corgi",
  },
  {
    slug: "funeral",
    category: "FUNERAL",
    title: "장례",
    shortLabel: "장례",
    description: "장례업체를 찾고 절차, 비용, 픽업 가능 여부를 확인하세요.",
    href: "/funeral",
    character: "theme-memorial",
    tone: "calm",
  },
  {
    slug: "pharmacy",
    category: "PHARMACY",
    title: "동물약국",
    shortLabel: "약국",
    description: "동물의약품 취급 약국을 찾고 원하는 약 재고를 물어보세요.",
    href: "/pharmacy",
    character: "theme-pharmacy",
  },
  {
    slug: "lost-pets",
    category: "LOST_PET",
    title: "댕냥이 찾아요",
    shortLabel: "찾아요",
    description: "보호동물 공고와 실종 제보를 지역별로 확인하세요.",
    href: "/lost-pets",
    character: "gen-maltese",
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
    description: "좌석 구역, 이동장 여부, 대형견 가능 여부를 먼저 물어보세요.",
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
    description: "목격 제보와 보호 공고를 빠르게 확인하세요.",
    href: "/lost-pets/new",
    character: "cat-peeking" as CharacterAsset,
  },
];

export const AROUND_ME_ITEMS = [
  { title: "내 주변 식당", href: "/map", description: "강아지랑 갈 곳 찾기" },
  { title: "내 주변 병원", href: "/map?category=hospitals", description: "가까운 병원 찾기" },
  { title: "내 주변 미용", href: "/map?category=grooming", description: "예약할 미용업소 찾기" },
  { title: "내 주변 유치원", href: "/map?category=daycare", description: "맡길 곳 찾기" },
];

export const POLICY_LINKS = [
  { href: "/policies/privacy", label: "개인정보처리방침" },
  { href: "/policies/terms", label: "이용약관" },
  { href: "/policies/reports", label: "제보 운영정책" },
  { href: "/policies/ads", label: "광고·제휴 고지" },
  { href: "/policies/medical", label: "의료정보 면책" },
  { href: "/policies/legal", label: "법률정보 기준일" },
];

export { GUIDE_DOCS, GUIDE_DOC_MAP, type GuideDoc } from "@/lib/guide-content";

export const CALCULATOR_CARDS = [
  { href: "/calculators/vaccination-schedule", title: "예방접종 일정 계산기", description: "월령과 마지막 접종일을 기준으로 다음 일정을 계산합니다." },
  { href: "/calculators/monthly-cost", title: "월 양육비 계산기", description: "사료비, 병원비, 호텔비까지 월/연 비용을 추정합니다." },
  { href: "/calculators/feeding", title: "사료 급여량 계산기", description: "체중과 활동량, 사료 kcal 기준으로 하루 급여량을 계산합니다." },
];