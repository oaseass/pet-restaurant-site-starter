import { CalendarDays, MapPin, Navigation, Search } from "lucide-react";
import type { SearchRestaurantResult, SearchPlaceResult } from "@/lib/public-search";
import { PLACE_CATEGORY_LABELS as GUIDE_CATEGORY_LABELS, type GuideDoc } from "@/lib/platform-content";
import { SmartLink } from "@/components/SmartLink";

const PLACE_CATEGORY_LABELS: Record<string, string> = {
  ANIMAL_HOSPITAL: "동물병원",
  PHARMACY: "동물약국",
  GROOMING: "미용",
  DAYCARE: "유치원·호텔",
  FUNERAL: "장례",
};

const PLACE_CATEGORY_MAP_KEY: Record<string, string> = {
  ANIMAL_HOSPITAL: "hospitals",
  PHARMACY: "pharmacy",
  GROOMING: "grooming",
  DAYCARE: "daycare",
  FUNERAL: "funeral",
};

interface SearchResultsListProps {
  restaurants: SearchRestaurantResult[];
  places?: SearchPlaceResult[];
  guides: GuideDoc[];
  keyword: string;
  mapHref?: string;
}

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function isLowConfidencePlaceName(name: string) {
  const trimmed = normalizeDisplayName(name);
  if (!trimmed) return true;
  if (/^#?[a-z_-]+$/i.test(trimmed) && !/[가-힣]/.test(trimmed)) return true;
  return false;
}

function getDisplayPlaceName(place: SearchPlaceResult) {
  const cleanedName = normalizeDisplayName(place.name);
  if (!isLowConfidencePlaceName(place.name)) return cleanedName;
  const label = place.categoryLabel ?? PLACE_CATEGORY_LABELS[place.category] ?? "시설";
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${label}` : `${label} 업체`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "기준일 확인 필요";
  return date.toLocaleDateString("ko-KR");
}

function restaurantMapHref(restaurant: SearchRestaurantResult) {
  if (restaurant.lat !== null && restaurant.lng !== null) {
    return `/map?category=restaurants&lat=${restaurant.lat.toFixed(6)}&lng=${restaurant.lng.toFixed(6)}`;
  }
  return `/map?category=restaurants&q=${encodeURIComponent(restaurant.name)}`;
}

function placeMapHref(place: SearchPlaceResult) {
  const category = PLACE_CATEGORY_MAP_KEY[place.category] ?? "all";
  if (place.lat !== null && place.lng !== null) {
    return `/map?category=${category}&lat=${place.lat.toFixed(6)}&lng=${place.lng.toFixed(6)}`;
  }
  return `/map?category=${category}&q=${encodeURIComponent(getDisplayPlaceName(place))}`;
}

function regionLabel(item: { sido?: string | null; sigungu?: string | null }) {
  return [item.sido, item.sigungu].filter(Boolean).join(" ") || "지역 미상";
}

function SectionHeader({ title, count, description }: { title: string; count: number; description: string }) {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--bg)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[var(--ink)]">{title}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[var(--muted)]">{count.toLocaleString("ko-KR")}건</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p>
    </div>
  );
}

export function SearchResultsList({ restaurants, places = [], guides, keyword, mapHref }: SearchResultsListProps) {
  const total = restaurants.length + places.length + guides.length;

  return (
    <div>
      <section className="border-b border-[var(--line)] bg-[#fafdf9] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">검색 결과</p>
            <p className="mt-1 text-sm font-black text-[var(--ink)]">
              {total === 0 ? "결과 없음" : `${total.toLocaleString("ko-KR")}개 결과`}
            </p>
          </div>
          {keyword ? (
            <SmartLink href={mapHref ?? `/map?q=${encodeURIComponent(keyword)}`} pendingLabel="지도 여는 중..." className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--brand)] bg-white px-4 text-xs font-black text-[var(--brand)]">
              <MapPin size={14} />
              지도에서 보기
            </SmartLink>
          ) : null}
        </div>
        {total > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-[var(--muted)]">
            <span className="rounded-full bg-white px-2.5 py-1">식당 {restaurants.length.toLocaleString("ko-KR")}</span>
            <span className="rounded-full bg-white px-2.5 py-1">시설 {places.length.toLocaleString("ko-KR")}</span>
            <span className="rounded-full bg-white px-2.5 py-1">가이드 {guides.length.toLocaleString("ko-KR")}</span>
          </div>
        ) : null}
      </section>

      {total === 0 && keyword ? (
        <section className="px-4 py-10 text-center">
          <Search className="mx-auto text-[var(--muted)]" size={24} />
          <p className="mt-3 text-sm font-black text-[var(--ink)]">검색 결과가 없습니다.</p>
          <p className="mt-2 text-xs leading-6 text-[var(--muted)]">지역명, 업종명, 장소명을 조금 다르게 입력해 보세요.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["서울 동물병원", "동물약국", "미용", "유치원"].map((sample) => (
              <SmartLink key={sample} href={`/search?q=${encodeURIComponent(sample)}`} className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-black text-[var(--brand)] no-underline">
                {sample}
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}

      {restaurants.length > 0 ? (
        <section>
          <SectionHeader title="식당" count={restaurants.length} description="반려동물 동반 식당은 방문 전 좌석, 대형견, 피크타임 조건을 확인하세요." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {restaurants.map((restaurant) => (
              <article key={restaurant.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <SmartLink href={`/restaurants/${restaurant.id}`} className="block text-[var(--ink)] no-underline">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand)]">식당</span>
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{restaurant.businessType}</span>
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{restaurant.lat !== null ? "지도 가능" : "주소 검색"}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{restaurant.name}</h3>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel(restaurant)}</p>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{restaurant.address}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#9ca3af]"><CalendarDays size={12} /> 기준 {formatDate(restaurant.updatedAt)}</p>
                </SmartLink>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <SmartLink href={restaurantMapHref(restaurant)} pendingLabel="지도 여는 중..." className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--brand)] px-3 text-xs font-black text-[var(--brand)]">
                    <Navigation size={13} />
                    지도
                  </SmartLink>
                  <SmartLink href={`/restaurants/${restaurant.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 text-xs font-black text-white">
                    상세
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {places.length > 0 ? (
        <section>
          <SectionHeader title="시설" count={places.length} description="병원, 약국, 미용, 유치원, 장례 시설은 전화·운영 상태·서비스 조건을 먼저 확인하세요." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {places.map((place) => {
              const displayName = getDisplayPlaceName(place);
              const categoryLabel = place.categoryLabel ?? PLACE_CATEGORY_LABELS[place.category] ?? place.category;
              return (
                <article key={place.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                  <SmartLink href={`/places/${place.id}`} className="block text-[var(--ink)] no-underline">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded bg-[#e0f2fe] px-2 py-0.5 text-[10px] font-black text-[#0369a1]">{categoryLabel}</span>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.lat !== null ? "지도 가능" : "주소 검색"}</span>
                      {place.businessStatus ? <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{place.businessStatus}</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{displayName}</h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--muted)]"><MapPin size={12} />{regionLabel(place)}</p>
                    {(place.roadAddress ?? place.address) ? <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--muted)]">{place.roadAddress ?? place.address}</p> : null}
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#9ca3af]"><CalendarDays size={12} /> 기준 {formatDate(place.updatedAt)}</p>
                  </SmartLink>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                    <SmartLink href={placeMapHref(place)} pendingLabel="지도 여는 중..." className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--brand)] px-3 text-xs font-black text-[var(--brand)]">
                      <Navigation size={13} />
                      지도
                    </SmartLink>
                    {place.phone ? (
                      <a href={`tel:${place.phone.replace(/\s+/g, "")}`} className="inline-flex min-h-9 items-center rounded-full border border-[var(--line)] px-3 text-xs font-black text-[var(--ink)]">전화</a>
                    ) : null}
                    <SmartLink href={`/places/${place.id}`} className="inline-flex min-h-9 items-center rounded-full bg-[var(--ink)] px-3 text-xs font-black text-white">
                      상세
                    </SmartLink>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {guides.length > 0 ? (
        <section>
          <SectionHeader title="가이드" count={guides.length} description="방문 전 확인할 질문과 체크리스트를 먼저 볼 수 있습니다." />
          <div className="grid gap-2 p-3 sm:grid-cols-2">
            {guides.map((guide) => (
              <SmartLink key={guide.slug} href={`/guide/${guide.slug}`} className="rounded-lg border border-[var(--line)] bg-white p-4 text-[var(--ink)] no-underline transition hover:bg-[#fcfbf9]">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-[#f5f3ff] px-2 py-0.5 text-[10px] font-black text-[#7c3aed]">가이드</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{GUIDE_CATEGORY_LABELS[guide.category] ?? "가이드"}</span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-black text-[var(--muted)]">{guide.readMinutes}분</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-[15px] font-black leading-snug">{guide.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{guide.summary}</p>
                <span className="mt-3 inline-flex text-xs font-black text-[#7c3aed]">가이드 보기 →</span>
              </SmartLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
