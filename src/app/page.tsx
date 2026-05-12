import Image from "next/image";
import { BookOpen, Building2, Coffee, HeartPulse, House, MapPin, Megaphone, Pill, Scissors, Sparkles, Store, Stethoscope, Utensils } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { InstantSearchBox } from "@/components/search/InstantSearchBox";
import { LocationSearchButton } from "@/components/LocationSearchButton";
import { SmartLink } from "@/components/SmartLink";
import { HomeCategoryCards, type HomeCategoryCardItem } from "@/components/home/HomeCategoryCards";
import { HomeRestaurantHighlights, type HomeRecentUpdateItem } from "@/components/home/HomeRestaurantHighlights";
import { getAnimalNoticeCountsSnapshot, getCategoryCountsSnapshot, getPlacesByCategorySnapshot, getPlacesLightSnapshot, getRestaurantsLightSnapshot, type PublicPlaceLight, type PublicRestaurantLight } from "@/lib/public-data";
import { inferPlaceExperienceCategory } from "@/lib/place-experience";

import heroMascot from "../../public/images/characters/gen-maltese.png";

function isCafeRestaurant(restaurant: PublicRestaurantLight) {
  const businessType = (restaurant.businessType ?? "").toLowerCase();
  return businessType.includes("카페") || businessType.includes("커피") || businessType.includes("휴게음식점");
}

function formatCountLabel(value: number | null | undefined, pendingLabel = "확인 중") {
  if (typeof value !== "number") return pendingLabel;
  return `${value.toLocaleString("ko-KR")}곳`;
}

function getHomePlaceCategoryLabel(place: PublicPlaceLight) {
  if (place.category === "ANIMAL_HOSPITAL") return "병원";
  if (place.category === "PHARMACY") return "약국";
  if (place.category === "GROOMING") return "미용";
  if (place.category === "FUNERAL") return "장례";

  const experience = inferPlaceExperienceCategory({
    baseCategory: place.category,
    name: place.name,
    tags: place.tags,
  });

  if (experience === "ACCOMMODATION_PENSION") return "펜션";
  return "유치원·호텔";
}

function buildRecentUpdates(restaurants: PublicRestaurantLight[], places: PublicPlaceLight[]): HomeRecentUpdateItem[] {
  const restaurantItems = restaurants.map((restaurant) => ({
    id: `restaurant-${restaurant.id}`,
    href: `/restaurants/${restaurant.id}`,
    name: restaurant.name,
    categoryLabel: isCafeRestaurant(restaurant) ? "카페" : "식당",
    regionLabel: [restaurant.sido, restaurant.sigungu].filter(Boolean).join(" · ") || restaurant.sido,
    statusLabel: restaurant.officialRegistered ? "식품안전나라" : "확인 중",
    updatedAt: restaurant.updatedAt,
  }));

  const placeItems = places.map((place) => ({
    id: `place-${place.id}`,
    href: `/places/${place.id}`,
    name: place.name,
    categoryLabel: getHomePlaceCategoryLabel(place),
    regionLabel: [place.sido, place.sigungu].filter(Boolean).join(" · ") || "지역 확인 중",
    statusLabel: place.sourceName ? "공식 수집" : "확인 중",
    updatedAt: place.updatedAt,
  }));

  return [...restaurantItems, ...placeItems]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 8)
    .map(({ updatedAt, ...item }) => ({
      ...item,
      updatedLabel: new Date(updatedAt).toLocaleDateString("ko-KR"),
    }));
}

export default async function HomePage() {
  const [counts, restaurants, places, daycarePlaces, animalNoticeCounts] = await Promise.all([
    getCategoryCountsSnapshot(),
    getRestaurantsLightSnapshot(),
    getPlacesLightSnapshot(),
    getPlacesByCategorySnapshot("DAYCARE"),
    getAnimalNoticeCountsSnapshot(),
  ]);

  const cafeCount = restaurants.filter(isCafeRestaurant).length;
  const restaurantCount = Math.max(counts.restaurantCount - cafeCount, 0);
  const pensionCount = daycarePlaces.filter((place) => inferPlaceExperienceCategory({ baseCategory: place.category, name: place.name, tags: place.tags }) === "ACCOMMODATION_PENSION").length;
  const daycareHotelCount = daycarePlaces.filter((place) => {
    const category = inferPlaceExperienceCategory({ baseCategory: place.category, name: place.name, tags: place.tags });
    return category !== "ACCOMMODATION_PENSION" && category !== "ACCOMMODATION_CAMPING";
  }).length;
  const registeredPlaceCount = counts.restaurantCount + counts.placeCount;
  const categoryItems: HomeCategoryCardItem[] = [
    { label: "전체", href: "/categories", description: "식당, 병원, 약국, 미용, 숙소를 한 번에 둘러보기", countLabel: formatCountLabel(registeredPlaceCount), icon: Sparkles },
    { label: "식당", href: "/restaurants", description: "반려동물과 함께 식사 가능한 장소", countLabel: formatCountLabel(restaurantCount), icon: Utensils },
    { label: "카페", href: "/search?q=%EC%B9%B4%ED%8E%98", description: "쉬어가기 좋은 반려동물 동반 카페", countLabel: formatCountLabel(cafeCount), icon: Coffee },
    { label: "병원", href: "/hospitals", description: "가까운 동물병원과 진료 가능 여부 확인", countLabel: formatCountLabel(counts.placeCategoryCounts?.ANIMAL_HOSPITAL), icon: Stethoscope },
    { label: "약국", href: "/pharmacy", description: "동물의약품 취급 약국과 재고 확인", countLabel: formatCountLabel(counts.placeCategoryCounts?.PHARMACY), icon: Pill },
    { label: "미용", href: "/grooming", description: "견종과 크기에 맞는 미용 업체 탐색", countLabel: formatCountLabel(counts.placeCategoryCounts?.GROOMING), icon: Scissors },
    { label: "펜션", href: "/pension", description: "객실 정책과 추가 요금을 먼저 볼 숙소", countLabel: formatCountLabel(pensionCount), icon: House },
    { label: "유치원·호텔", href: "/daycare", description: "돌봄, 호텔링, 훈련형 시설 찾기", countLabel: formatCountLabel(daycareHotelCount), icon: Building2 },
    { label: "장례", href: "/funeral", description: "절차와 상담 가능 시간을 확인할 장소", countLabel: formatCountLabel(counts.placeCategoryCounts?.FUNERAL), icon: HeartPulse },
    { label: "보호동물 공고", href: "/lost-pets?tab=shelter", description: "보호소 공고와 실종 관련 정보를 확인", countLabel: formatCountLabel(animalNoticeCounts.total), icon: Megaphone },
    { label: "가이드", href: "/guide", description: "이동 전 체크리스트와 생활 가이드 모음", countLabel: "업데이트 예정", icon: BookOpen },
    { label: "업체 등록", href: "/business", description: "신규 장소 등록과 정보 수정 요청 접수", countLabel: "업데이트 예정", icon: Store },
  ];
  const recentUpdates = buildRecentUpdates(restaurants, places);

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      registeredPlaceCount={registeredPlaceCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      <div className="space-y-5">
        <section className="section-shell overflow-hidden px-5 py-6 sm:px-6 sm:py-7">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--brand)]">메인 검색</p>
              <h1 className="mt-2 text-[24px] font-black tracking-tight text-[var(--ink)] sm:text-[26px]">반려동물과 함께 갈 수 있는 곳 찾기</h1>
              <p className="mt-3 text-[14px] leading-7 text-[var(--muted)]">식당, 병원, 미용, 숙소, 약국, 보호동물 정보까지 한 번에 확인하세요.</p>

              <div className="mt-5 max-w-[680px]">
                <InstantSearchBox placeholder="지역, 업종, 업체명으로 검색" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <LocationSearchButton />
                <SmartLink href="/map" pendingLabel="지도 여는 중..." className="inline-flex min-h-9 items-center rounded-full border border-[var(--line)] bg-white px-4 text-[12px] font-extrabold text-[var(--brand)] transition hover:border-[var(--brand)]">
                  <MapPin size={14} className="mr-1.5" />
                  지도에서 보기
                </SmartLink>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-[12px] font-extrabold text-[var(--brand)]">등록 장소 {registeredPlaceCount.toLocaleString("ko-KR")}곳</span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--muted)] ring-1 ring-[var(--line)]">보호동물 공고 {animalNoticeCounts.total.toLocaleString("ko-KR")}건</span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--muted)] ring-1 ring-[var(--line)]">정보 기준 공개자료 + 사용자 제보</span>
              </div>
            </div>

            <div className="hidden justify-self-end md:block">
              <div className="relative flex h-[132px] w-[132px] items-center justify-center rounded-[28px] bg-[var(--primary-soft)]">
                <Image src={heroMascot} alt="댕냥지도 마스코트" width={112} height={112} className="h-auto w-[104px] object-contain" priority />
              </div>
            </div>
          </div>
        </section>

        <HomeCategoryCards items={categoryItems} />

        <HomeRestaurantHighlights items={recentUpdates} />
      </div>
    </PublicPageShell>
  );
}
