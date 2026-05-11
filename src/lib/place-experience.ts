export type PlaceExperienceCategory =
  | "FOOD_RESTAURANT"
  | "CAFE"
  | "ACCOMMODATION_PENSION"
  | "ACCOMMODATION_HOTEL"
  | "ACCOMMODATION_CAMPING"
  | "TOURIST_SPOT"
  | "PARK"
  | "SHOP"
  | "HOSPITAL"
  | "PHARMACY"
  | "GROOMING"
  | "TRAINING"
  | "DAYCARE"
  | "FUNERAL"
  | "ETC";

type PlaceExperienceInput = {
  baseCategory?: string | null;
  name: string;
  categoryLabel?: string | null;
  tags?: string[] | null;
  externalCategory?: string | null;
};

type PlaceExperienceQueryInput = {
  category: PlaceExperienceCategory;
  placeName: string;
  regionLabel?: string | null;
  address?: string | null;
};

const CAFE_KEYWORDS = ["카페", "coffee", "브런치"];
const PENSION_KEYWORDS = ["펜션", "풀빌라", "독채"];
const HOTEL_KEYWORDS = ["호텔", "리조트", "리트리트"];
const CAMPING_KEYWORDS = ["캠핑", "글램핑", "카라반", "캠프"];
const TRAINING_KEYWORDS = ["훈련", "교정", "행동", "사회화", "아카데미", "스쿨"];
const PARK_KEYWORDS = ["공원", "산책로", "수목원", "둘레길"];
const TOURIST_KEYWORDS = ["관광", "여행지", "테마파크", "박물관", "해변", "계곡"];
const SHOP_KEYWORDS = ["용품", "샵", "스토어", "마켓", "pet supply"];

const CATEGORY_LABELS: Record<PlaceExperienceCategory, string> = {
  FOOD_RESTAURANT: "음식점",
  CAFE: "카페",
  ACCOMMODATION_PENSION: "애견동반 펜션",
  ACCOMMODATION_HOTEL: "호텔/리조트",
  ACCOMMODATION_CAMPING: "캠핑장/글램핑",
  TOURIST_SPOT: "관광지",
  PARK: "공원/산책로",
  SHOP: "반려동물 용품점",
  HOSPITAL: "동물병원",
  PHARMACY: "동물약국",
  GROOMING: "애견미용",
  TRAINING: "훈련/유치원",
  DAYCARE: "유치원·호텔",
  FUNERAL: "반려동물 장례",
  ETC: "기타 장소",
};

const CATEGORY_FOCUS: Record<PlaceExperienceCategory, string> = {
  FOOD_RESTAURANT: "동반 조건과 좌석 분위기",
  CAFE: "좌석 동선과 휴식 분위기",
  ACCOMMODATION_PENSION: "객실 정책과 추가 요금",
  ACCOMMODATION_HOTEL: "객실 정책과 부대시설 경험",
  ACCOMMODATION_CAMPING: "동반 구역과 현장 이용 경험",
  TOURIST_SPOT: "동반 동선과 입장 조건",
  PARK: "산책 동선과 현장 분위기",
  SHOP: "구매 경험과 매장 응대",
  HOSPITAL: "진료 경험과 운영 분위기",
  PHARMACY: "구매 경험과 운영 여부",
  GROOMING: "견종별 예약 경험과 미용 분위기",
  TRAINING: "적응 과정과 프로그램 운영 방식",
  DAYCARE: "입소 조건과 호텔링 경험",
  FUNERAL: "상담 절차와 이용 경험",
  ETC: "현장 이용 경험",
};

const PENSION_CHECKLIST = [
  "반려견 동반 객실 여부",
  "견종/무게 제한",
  "마리 수 제한",
  "추가 요금",
  "실내 동반 가능 여부",
  "침구/가구 이용 제한",
  "개별 운동장 여부",
  "바비큐장 동반 가능 여부",
];

const HOTEL_CHECKLIST = [
  "동반 가능 객실 타입",
  "체중·견종 제한",
  "1박당 추가 요금",
  "조식·라운지 동반 가능 여부",
  "객실 내 배변·침구 규정",
  "주차·산책 동선",
];

const CAMPING_CHECKLIST = [
  "반려견 동반 가능한 사이트 구역",
  "리드줄·이동장 규정",
  "대형견·다견 제한",
  "카라반·글램핑 객실 규정",
  "야간 소음·산책 규칙",
  "샤워실·공용공간 동반 가능 여부",
];

const SHOP_CHECKLIST = [
  "취급 품목과 재고",
  "주차 가능 여부",
  "대형견 동반 가능 여부",
  "매장 내 시착·상담 가능 여부",
  "교환·환불 조건",
  "영업시간과 휴무일",
];

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/\s+/g, "").trim();
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function hasAnyKeyword(haystacks: string[], keywords: string[]) {
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeToken(keyword);
    return haystacks.some((haystack) => haystack.includes(normalizedKeyword));
  });
}

export function inferPlaceExperienceCategory(input: PlaceExperienceInput): PlaceExperienceCategory {
  const baseCategory = input.baseCategory?.trim().toUpperCase() || "";
  const haystacks = [input.name, input.categoryLabel, input.externalCategory, ...(input.tags ?? [])]
    .map(normalizeToken)
    .filter(Boolean);

  if (baseCategory === "RESTAURANT" || baseCategory === "PET_RESTAURANT") {
    return hasAnyKeyword(haystacks, CAFE_KEYWORDS) ? "CAFE" : "FOOD_RESTAURANT";
  }
  if (baseCategory === "ANIMAL_HOSPITAL") return "HOSPITAL";
  if (baseCategory === "PHARMACY") return "PHARMACY";
  if (baseCategory === "GROOMING") return "GROOMING";
  if (baseCategory === "FUNERAL") return "FUNERAL";
  if (baseCategory === "TRAINING") return "TRAINING";
  if (baseCategory === "HOTEL") return "ACCOMMODATION_HOTEL";
  if (baseCategory === "PET_SUPPLY" || hasAnyKeyword(haystacks, SHOP_KEYWORDS)) return "SHOP";
  if (hasAnyKeyword(haystacks, PARK_KEYWORDS)) return "PARK";
  if (hasAnyKeyword(haystacks, TOURIST_KEYWORDS)) return "TOURIST_SPOT";
  if (baseCategory === "DAYCARE") {
    if (hasAnyKeyword(haystacks, TRAINING_KEYWORDS)) return "TRAINING";
    if (hasAnyKeyword(haystacks, CAMPING_KEYWORDS)) return "ACCOMMODATION_CAMPING";
    if (hasAnyKeyword(haystacks, PENSION_KEYWORDS)) return "ACCOMMODATION_PENSION";
    if (hasAnyKeyword(haystacks, HOTEL_KEYWORDS)) return "ACCOMMODATION_HOTEL";
    return "DAYCARE";
  }

  return "ETC";
}

export function getPlaceExperienceLabel(category: PlaceExperienceCategory) {
  return CATEGORY_LABELS[category];
}

export function getPlaceExperienceFocus(category: PlaceExperienceCategory) {
  return CATEGORY_FOCUS[category];
}

export function getPlaceExperienceChecklist(category: PlaceExperienceCategory) {
  if (category === "ACCOMMODATION_PENSION") return [...PENSION_CHECKLIST];
  if (category === "ACCOMMODATION_HOTEL") return [...HOTEL_CHECKLIST];
  if (category === "ACCOMMODATION_CAMPING") return [...CAMPING_CHECKLIST];
  if (category === "SHOP") return [...SHOP_CHECKLIST];
  return [];
}

export function matchesPlaceExperienceCategory(input: PlaceExperienceInput, category: PlaceExperienceCategory) {
  return inferPlaceExperienceCategory(input) === category;
}

function buildCategorySpecificQueries({ category, placeName, regionLabel }: PlaceExperienceQueryInput) {
  switch (category) {
    case "FOOD_RESTAURANT":
      return [
        `${placeName} 애견동반 식당`,
        `${placeName} 반려견 동반 맛집`,
        regionLabel ? `${regionLabel} 애견동반 식당` : null,
      ];
    case "CAFE":
      return [
        `${placeName} 애견동반 카페`,
        `${placeName} 반려견 동반 카페`,
        regionLabel ? `${regionLabel} 애견동반 카페` : null,
      ];
    case "ACCOMMODATION_PENSION":
      return [
        `${placeName} 애견동반 펜션`,
        `${placeName} 반려견 동반 펜션`,
        `${placeName} 반려동물 동반 숙소`,
        regionLabel ? `${regionLabel} 애견동반 펜션` : null,
        regionLabel ? `${regionLabel} 강아지 동반 숙소` : null,
      ];
    case "ACCOMMODATION_HOTEL":
      return [
        `${placeName} 반려동물 동반 호텔`,
        `${placeName} 반려견 동반 호텔`,
        regionLabel ? `${regionLabel} 반려동물 동반 호텔` : null,
      ];
    case "ACCOMMODATION_CAMPING":
      return [
        `${placeName} 애견동반 캠핑장`,
        `${placeName} 반려견 동반 글램핑`,
        regionLabel ? `${regionLabel} 애견동반 캠핑` : null,
      ];
    case "TOURIST_SPOT":
    case "PARK":
      return [
        `${placeName} 반려견 동반`,
        `${placeName} 강아지 산책`,
        regionLabel ? `${regionLabel} 반려견 동반 여행지` : null,
      ];
    case "SHOP":
      return [
        `${placeName} 반려동물 용품점`,
        `${placeName} 펫샵 후기`,
        regionLabel ? `${regionLabel} 반려동물 용품점` : null,
      ];
    case "HOSPITAL":
      return [`${placeName} 동물병원 후기`, `${placeName} 진료 후기`, regionLabel ? `${regionLabel} 동물병원 후기` : null];
    case "PHARMACY":
      return [`${placeName} 동물약국 후기`, `${placeName} 약 재고 후기`, regionLabel ? `${regionLabel} 동물약국 후기` : null];
    case "GROOMING":
      return [`${placeName} 애견미용 후기`, `${placeName} 반려견 미용 후기`, regionLabel ? `${regionLabel} 애견미용 후기` : null];
    case "TRAINING":
      return [`${placeName} 반려견 훈련 후기`, `${placeName} 유치원 후기`, regionLabel ? `${regionLabel} 반려견 훈련 후기` : null];
    case "DAYCARE":
      return [`${placeName} 반려견 유치원 후기`, `${placeName} 호텔링 후기`, regionLabel ? `${regionLabel} 반려견 유치원 호텔 후기` : null];
    case "FUNERAL":
      return [`${placeName} 반려동물 장례 후기`, `${placeName} 장례 절차 후기`, regionLabel ? `${regionLabel} 반려동물 장례 후기` : null];
    default:
      return [
        `${placeName} 반려견 동반 후기`,
        `${placeName} 반려동물 동반 후기`,
        regionLabel ? `${regionLabel} 반려동물 동반 장소` : null,
      ];
  }
}

export function buildPlaceExperienceQueries({ category, placeName, regionLabel, address }: PlaceExperienceQueryInput) {
  const normalizedPlaceName = normalizeLabel(placeName);
  if (!normalizedPlaceName) return [] as string[];

  const normalizedRegion = normalizeLabel(regionLabel?.replace(/·/g, " "));
  const addressRegion = normalizeLabel(address).split(" ").slice(0, 2).join(" ");
  const region = normalizedRegion || addressRegion;
  const commonQueries = [
    `${normalizedPlaceName} 반려견 동반`,
    `${normalizedPlaceName} 애견동반`,
    `${normalizedPlaceName} 반려동물 동반`,
    `${normalizedPlaceName} 강아지 동반`,
    `${normalizedPlaceName} 반려동물 가능`,
  ];

  const deduped = new Set<string>();
  for (const query of [...commonQueries, ...buildCategorySpecificQueries({ category, placeName: normalizedPlaceName, regionLabel: region, address })]) {
    const normalizedQuery = normalizeLabel(query);
    if (normalizedQuery) deduped.add(normalizedQuery);
  }

  return Array.from(deduped);
}