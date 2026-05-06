import { Fragment } from "react";
import type { PlaceCategory } from "@prisma/client";
import { AdSlot } from "@/components/AdSlot";
import { CharacterImage } from "@/components/CharacterImage";
import { DiscoveryCardActions } from "@/components/discovery/DiscoveryCardActions";
import { SmartLink } from "@/components/SmartLink";
import { SourceBadge } from "@/components/SourceBadge";
import { buildDiscoveryMapHref, buildReviewHref, getPlaceMapCategoryKey, hasUsableCoordinates } from "@/lib/discovery-cards";
import { GUIDE_DOCS, type GuideDoc } from "@/lib/guide-content";
import { PLACE_CATEGORY_LABELS, QUICK_CATEGORIES } from "@/lib/platform-content";
import { getPlacesByCategorySnapshot, getRestaurantsLightSnapshot, type PlaceDbCategory, type PublicPlaceLight, type PublicRestaurantLight } from "@/lib/public-data";

const COMMON_NOTICE = "법령, 항공사·선사 규정, 병원 비용, 업체 운영정책은 시점과 업체에 따라 달라질 수 있습니다. 실제 이용 전 공식 기관 또는 업체에 다시 확인하세요.";

type GuideRelatedPlaceTarget =
  | {
      kind: "restaurants";
      title: string;
      description: string;
      href: string;
    }
  | {
      kind: "places";
      category: PlaceDbCategory;
      title: string;
      description: string;
      href: string;
    };

type GuideRelatedPlaceCard = {
  id: string;
  name: string;
  meta: string;
  address: string;
  detailHref: string;
  mapHref: string;
  phone?: string | null;
  reviewHref: string;
};

type GuideRelatedPlaceSection = {
  title: string;
  description: string;
  href: string;
  items: GuideRelatedPlaceCard[];
};

const GUIDE_RELATED_PLACE_TARGETS: Partial<Record<PlaceCategory, GuideRelatedPlaceTarget[]>> = {
  TRAVEL: [
    { kind: "restaurants", title: "여행 중 들를 식당", description: "지도와 상세 화면으로 바로 이어지는 최근 등록 식당입니다.", href: "/map?category=restaurants" },
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "여행지 주변 병원", description: "이동 전 저장해두기 좋은 동물병원입니다.", href: "/map?category=hospitals" },
  ],
  FLIGHT: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "탑승 전 상담 병원", description: "이동장, 접종, 건강 상태를 확인할 때 연결됩니다.", href: "/map?category=hospitals" },
  ],
  SHIP: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "출항 전 확인할 병원", description: "멀미와 장거리 이동 상담이 필요할 때 먼저 봅니다.", href: "/map?category=hospitals" },
  ],
  VACCINATION: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "접종 상담 병원", description: "예방접종 일정과 이상반응 기준을 확인할 수 있는 병원입니다.", href: "/map?category=hospitals" },
    { kind: "places", category: "PHARMACY", title: "동물약국", description: "처방·구입 전 전화 확인이 필요한 약국입니다.", href: "/map?category=pharmacy" },
  ],
  SURGERY: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "수술 상담 병원", description: "검사, 마취, 회복 설명을 비교할 때 참고합니다.", href: "/map?category=hospitals" },
  ],
  REGISTRATION: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "동물등록 상담 병원", description: "등록 방식과 변경신고를 확인할 때 연결됩니다.", href: "/map?category=hospitals" },
  ],
  PET_FOOD: [
    { kind: "places", category: "ANIMAL_HOSPITAL", title: "급여 상담 병원", description: "질환, 알레르기, 체중 관리가 필요할 때 먼저 확인합니다.", href: "/map?category=hospitals" },
    { kind: "places", category: "PHARMACY", title: "동물약국", description: "구입 가능 품목은 방문 전 전화 확인이 필요합니다.", href: "/map?category=pharmacy" },
  ],
  FUNERAL: [
    { kind: "places", category: "FUNERAL", title: "장례 상담 시설", description: "운구, 화장, 봉안 절차를 확인할 수 있는 시설입니다.", href: "/map?category=funeral" },
  ],
};

const DEFAULT_RELATED_PLACE_TARGETS: GuideRelatedPlaceTarget[] = [
  { kind: "places", category: "ANIMAL_HOSPITAL", title: "가까운 동물병원", description: "방문 전 전화와 위치를 함께 확인하세요.", href: "/map?category=hospitals" },
];

const GUIDE_QUESTION_PROMPTS: Partial<Record<GuideDoc["category"], string[]>> = {
  TRAVEL: ["숙소의 체중·견종 제한과 추가 비용은 어떻게 되나요?", "동반 가능한 공용 공간과 객실 대기 규칙은 무엇인가요?", "가까운 동물병원과 야간 진료 가능 병원이 어디인가요?"],
  FLIGHT: ["이 항공편에 반려동물 동반 좌석이 남아 있나요?", "이동장 규격과 합산 무게 기준은 어떻게 되나요?", "필요 서류와 카운터 도착 권장 시간은 언제인가요?"],
  SHIP: ["이 노선에서 객실 동반, 펫룸, 케이지 대기 중 무엇이 가능한가요?", "승선 중 배변 처리와 이동 가능 구역은 어떻게 되나요?", "대형견이나 다견 탑승 제한이 있나요?"],
  VACCINATION: ["오늘 건강 상태에서 접종을 진행해도 괜찮나요?", "다음 접종 예정일과 이상반응 대응 기준은 무엇인가요?", "광견병 증명서나 접종 기록 발급이 가능한가요?"],
  REGISTRATION: ["현재 동물등록 정보의 연락처와 주소가 최신인가요?", "내장형·외장형 중 우리 상황에 맞는 방식은 무엇인가요?", "변경신고가 필요한 상황과 처리 기한은 어떻게 되나요?"],
  SURGERY: ["수술 전 필요한 검사와 마취 리스크 설명은 무엇인가요?", "견적에 포함되지 않은 재진·약·입원 비용이 있나요?", "회복 기간 동안 금지되는 활동과 응급 신호는 무엇인가요?"],
  TRAINING: ["문제 행동의 원인을 먼저 평가하는 상담이 있나요?", "보호자가 함께 배워야 하는 숙제는 무엇인가요?", "강압적 도구나 처벌 방식 사용 여부를 설명해 주나요?"],
  GROOMING: ["견종·묘종·체중·피부 상태에 따른 제한이 있나요?", "미용 중 보호자 대기나 중단 기준은 어떻게 되나요?", "추가 비용이 붙는 엉킴·노령·공격성 기준은 무엇인가요?"],
  PET_FOOD: ["주식과 간식의 급여량을 체중과 활동량 기준으로 계산했나요?", "알레르기나 질환 때문에 피해야 할 성분이 있나요?", "새 사료로 바꿀 때 며칠 동안 섞어 급여해야 하나요?"],
  PET_SUPPLY: ["이동장과 하네스 크기가 아이 몸에 맞나요?", "매일 쓰는 소모품과 비상용품을 분리해 챙겼나요?", "교체 주기와 세척 방법을 확인했나요?"],
  FUNERAL: ["상담 가능 시간과 운구 가능 지역은 어떻게 되나요?", "화장·봉안·추모 절차와 총 비용 구성은 무엇인가요?", "허가 업체 여부와 장례 후 서류 제공이 가능한가요?"],
};

function getSectionId(index: number) {
  return `guide-section-${index + 1}`;
}

function getGuideQuestions(guide: GuideDoc) {
  return GUIDE_QUESTION_PROMPTS[guide.category] ?? [
    "오늘 바로 확인해야 할 조건은 무엇인가요?",
    "비용, 준비물, 제한 조건을 공식 안내로 확인했나요?",
    "문제가 생겼을 때 연락할 병원이나 업체를 저장했나요?",
  ];
}

function getRelatedGuides(guide: GuideDoc) {
  const linkedGuideSlugs = new Set(
    guide.relatedLinks
      .map((link) => link.href.match(/^\/guide\/([^/?#]+)/)?.[1])
      .filter((slug): slug is string => Boolean(slug)),
  );

  const preferred = GUIDE_DOCS.filter((doc) => doc.slug !== guide.slug && (linkedGuideSlugs.has(doc.slug) || doc.category === guide.category));
  const fallback = GUIDE_DOCS.filter((doc) => doc.slug !== guide.slug && !preferred.some((item) => item.slug === doc.slug));

  return [...preferred, ...fallback].slice(0, 3);
}

function pickRestaurantsForGuide(restaurants: PublicRestaurantLight[], limit = 3) {
  return pickDiverseItems(
    [...restaurants].sort((leftRestaurant, rightRestaurant) => {
      const coordinateDiff = Number(hasUsableCoordinates(rightRestaurant.lat, rightRestaurant.lng)) - Number(hasUsableCoordinates(leftRestaurant.lat, leftRestaurant.lng));
      if (coordinateDiff !== 0) return coordinateDiff;

      const rightUpdatedAt = new Date(rightRestaurant.updatedAt).getTime();
      const leftUpdatedAt = new Date(leftRestaurant.updatedAt).getTime();
      return rightUpdatedAt - leftUpdatedAt;
    }),
    (restaurant) => `${restaurant.sido} ${restaurant.sigungu ?? ""}`.trim(),
    limit,
  );
}

function pickPlacesForGuide(places: PublicPlaceLight[], limit = 3) {
  return pickDiverseItems(
    [...places].sort((leftPlace, rightPlace) => {
      const phoneDiff = Number(Boolean(rightPlace.phone)) - Number(Boolean(leftPlace.phone));
      if (phoneDiff !== 0) return phoneDiff;

      const coordinateDiff = Number(hasUsableCoordinates(rightPlace.lat, rightPlace.lng)) - Number(hasUsableCoordinates(leftPlace.lat, leftPlace.lng));
      if (coordinateDiff !== 0) return coordinateDiff;

      const rightUpdatedAt = new Date(rightPlace.updatedAt).getTime();
      const leftUpdatedAt = new Date(leftPlace.updatedAt).getTime();
      return rightUpdatedAt - leftUpdatedAt;
    }),
    (place) => `${place.sido ?? ""} ${place.sigungu ?? ""}`.trim(),
    limit,
  );
}

function pickDiverseItems<T>(items: T[], getRegion: (item: T) => string, limit: number) {
  const selectedItems: T[] = [];
  const selectedRegions = new Set<string>();

  for (const item of items) {
    const region = getRegion(item);
    if (region && selectedRegions.has(region)) continue;
    selectedItems.push(item);
    if (region) selectedRegions.add(region);
    if (selectedItems.length >= limit) return selectedItems;
  }

  for (const item of items) {
    if (selectedItems.includes(item)) continue;
    selectedItems.push(item);
    if (selectedItems.length >= limit) break;
  }

  return selectedItems;
}

async function getGuideRelatedPlaceSections(guide: GuideDoc): Promise<GuideRelatedPlaceSection[]> {
  const targets = GUIDE_RELATED_PLACE_TARGETS[guide.category] ?? DEFAULT_RELATED_PLACE_TARGETS;

  const sections = await Promise.all(
    targets.map(async (target) => {
      if (target.kind === "restaurants") {
        const restaurants = pickRestaurantsForGuide(await getRestaurantsLightSnapshot()).map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
          meta: `${restaurant.sido} ${restaurant.sigungu ?? ""}`.trim() || restaurant.businessType,
          address: restaurant.address,
          detailHref: `/restaurants/${restaurant.id}`,
          mapHref: buildDiscoveryMapHref({ categoryKey: "restaurants", name: restaurant.name, lat: restaurant.lat, lng: restaurant.lng }),
          phone: null,
          reviewHref: buildReviewHref("RESTAURANT", restaurant.id),
        }));

        return { title: target.title, description: target.description, href: target.href, items: restaurants };
      }

      const places = pickPlacesForGuide(await getPlacesByCategorySnapshot(target.category)).map((place) => {
        const address = place.roadAddress ?? place.address ?? "주소 확인 필요";

        return {
          id: place.id,
          name: place.name,
          meta: `${PLACE_CATEGORY_LABELS[place.category as PlaceCategory] ?? "장소"} · ${place.sido ?? "지역 확인"}`,
          address,
          detailHref: `/places/${place.id}`,
          mapHref: buildDiscoveryMapHref({ categoryKey: getPlaceMapCategoryKey(place.category), name: place.name, lat: place.lat, lng: place.lng }),
          phone: place.phone,
          reviewHref: buildReviewHref("PLACE", place.id),
        };
      });

      return { title: target.title, description: target.description, href: target.href, items: places };
    }),
  );

  return sections.filter((section) => section.items.length > 0).slice(0, 2);
}

function GuideRelatedPlaces({ sections }: { sections: GuideRelatedPlaceSection[] }) {
  if (sections.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">같이 확인할 장소</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">읽은 뒤 바로 움직일 수 있게</h2>
        </div>
        <SmartLink href="/map" pendingLabel="지도 여는 중..." className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--ink)]">
          지도 전체 보기
        </SmartLink>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-[var(--line)] bg-[#fbfcfb] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black tracking-tight text-[var(--ink)]">{section.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{section.description}</p>
              </div>
              <SmartLink href={section.href} pendingLabel="지도 여는 중..." className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-2 text-[11px] font-black text-white">
                더 보기
              </SmartLink>
            </div>

            <div className="mt-4 grid gap-3">
              {section.items.map((item) => (
                <article key={item.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <SmartLink href={item.detailHref} className="block text-[var(--ink)] no-underline">
                    <p className="text-[11px] font-black text-[var(--brand)]">{item.meta}</p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-black leading-snug">{item.name}</h4>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.address}</p>
                  </SmartLink>
                  <DiscoveryCardActions
                    className="mt-3 border-t border-[var(--line)] pt-3"
                    detailHref={item.detailHref}
                    mapHref={item.mapHref}
                    phone={item.phone}
                    reviewHref={item.reviewHref}
                  />
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function GuideArticle({ guide }: { guide: GuideDoc }) {
  const character = QUICK_CATEGORIES.find((item) => item.category === guide.category)?.character ?? "cat-peeking";
  const categoryLabel = PLACE_CATEGORY_LABELS[guide.category] ?? "가이드";
  const relatedGuides = getRelatedGuides(guide);
  const guideQuestions = getGuideQuestions(guide);
  const relatedPlaceSections = await getGuideRelatedPlaceSections(guide);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-3 top-3 h-24 w-24 opacity-95 sm:h-28 sm:w-28">
          <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <SourceBadge label="관리자 검수형 가이드" tone="manual" />
            <SourceBadge label={categoryLabel} tone="official" />
            <SourceBadge label={`${guide.readMinutes}분 읽기`} tone="official" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">{guide.summary}</p>
          <p className="mt-4 text-sm font-black text-[var(--brand)]">최신 확인일 {guide.updatedAt}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-6">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">바로 실행</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">읽기 전에 먼저 할 일</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-7 text-[#5f5550]">
            {guide.checklist.slice(0, 3).map((item, index) => (
              <li key={item} className="flex gap-3 rounded-lg bg-[#fafdf9] px-3 py-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-black text-white">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            {guide.relatedLinks.slice(0, 2).map((link) => (
              <SmartLink key={link.href} href={link.href} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--brand)] px-4 text-xs font-black text-[var(--brand)]">
                {link.label}
              </SmartLink>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--line)] bg-[#fcfbf8] p-6">
          <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">목차</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">필요한 부분만 빠르게 보기</h2>
          <nav className="mt-4 grid gap-2 text-sm font-bold text-[var(--muted)]" aria-label={`${guide.title} 목차`}>
            {guide.sections.map((section, index) => (
              <a key={section.heading} href={`#${getSectionId(index)}`} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 hover:text-[var(--brand)]">
                {index + 1}. {section.heading}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mt-4 rounded-[1.25rem] border border-[#dbeafe] bg-[#eff6ff] p-6">
        <h2 className="text-xl font-black tracking-tight text-[#1e3a8a]">현장에서 바로 물어볼 질문</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#1e3a8a] sm:grid-cols-3">
          {guideQuestions.map((question) => (
            <li key={question} className="rounded-lg bg-white/70 px-3 py-2 font-bold">{question}</li>
          ))}
        </ul>
      </section>

      <GuideRelatedPlaces sections={relatedPlaceSections} />

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">핵심 체크리스트</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#5f5550] sm:grid-cols-2">
          {guide.checklist.map((item) => (
            <li key={item} className="rounded-lg border border-[var(--line)] bg-[#fcfbf9] px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-4">
        {guide.sections.map((section, index) => (
          <Fragment key={section.heading}>
            <article id={getSectionId(index)} className="scroll-mt-24 card rounded-[1.25rem] p-6">
              <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-8 text-[#5f5550] sm:text-[15px]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
            {index === 1 ? <AdSlot label={`${guide.title} 본문 광고 영역`} className="mx-0" /> : null}
          </Fragment>
        ))}
      </section>

      <section className="mt-6 card rounded-[1.25rem] border-[#fed7aa] bg-[#fff7ed] p-6">
        <h2 className="text-xl font-black tracking-tight text-[#9a3412]">주의사항</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-[#7c2d12]">
          {guide.warnings.map((warning) => (
            <li key={warning}>· {warning}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">관련 장소 바로가기</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.relatedLinks.map((link) => (
            <SmartLink key={link.href} href={link.href} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
              {link.label}
            </SmartLink>
          ))}
        </div>
      </section>

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">관련 가이드 추천</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {relatedGuides.map((item) => (
            <SmartLink key={item.slug} href={`/guide/${item.slug}`} className="rounded-lg border border-[var(--line)] bg-white p-4 transition hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]">
              <p className="text-sm font-black text-[var(--ink)]">{item.title}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">{item.summary}</p>
            </SmartLink>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 text-sm leading-7 text-[var(--muted)]">
        <h2 className="text-base font-black text-[var(--ink)]">하단 공통 고지</h2>
        <p className="mt-3">{COMMON_NOTICE}</p>
      </section>
    </main>
  );
}