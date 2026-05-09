export type ListPageSearchParams = Record<string, string | string[] | undefined>;

export type ListFilterState = {
  sido: string;
  userLocation: { lat: number; lng: number; radiusKm: number } | null;
  checked: "" | "recent";
  info: "" | "needs";
};

type FilterableLocationItem = {
  sido?: string | null;
  lat?: number | null;
  lng?: number | null;
};

const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 50;

const SIDO_ALIASES: Record<string, string> = {
  서울: "서울",
  서울특별시: "서울",
  부산: "부산",
  부산광역시: "부산",
  대구: "대구",
  대구광역시: "대구",
  인천: "인천",
  인천광역시: "인천",
  광주: "광주",
  광주광역시: "광주",
  대전: "대전",
  대전광역시: "대전",
  울산: "울산",
  울산광역시: "울산",
  세종: "세종",
  세종특별자치시: "세종",
  경기: "경기",
  경기도: "경기",
  강원: "강원",
  강원도: "강원",
  강원특별자치도: "강원",
  충북: "충북",
  충청북도: "충북",
  충남: "충남",
  충청남도: "충남",
  전북: "전북",
  전라북도: "전북",
  전북특별자치도: "전북",
  전남: "전남",
  전라남도: "전남",
  경북: "경북",
  경상북도: "경북",
  경남: "경남",
  경상남도: "경남",
  제주: "제주",
  제주특별자치도: "제주",
};

const SIDO_FULL_NAMES: Record<string, string> = {
  서울: "서울특별시",
  부산: "부산광역시",
  대구: "대구광역시",
  인천: "인천광역시",
  광주: "광주광역시",
  대전: "대전광역시",
  울산: "울산광역시",
  세종: "세종특별자치시",
  경기: "경기도",
  강원: "강원특별자치도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전북특별자치도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주특별자치도",
};

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeSidoText(value?: string | null) {
  return value?.trim().replace(/\s+/g, "") ?? "";
}

function hasUsableCoordinate(lat?: number | null, lng?: number | null) {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
}

export function getSidoLabel(value?: string | null) {
  const normalized = normalizeSidoText(value);
  if (!normalized) return "";
  return SIDO_ALIASES[normalized] ?? value?.trim() ?? "";
}

export function getSidoFullName(value?: string | null) {
  const label = getSidoLabel(value);
  return label ? SIDO_FULL_NAMES[label] ?? label : "";
}

export function matchesSido(itemSido: string | null | undefined, activeSido: string) {
  return Boolean(activeSido) && getSidoLabel(itemSido) === getSidoLabel(activeSido);
}

export function parseListSearchParams(params: ListPageSearchParams = {}): ListFilterState {
  const sido = getSidoLabel(getSingleParam(params.sido));
  const checked = getSingleParam(params.checked) === "recent" ? "recent" : "";
  const info = getSingleParam(params.info) === "needs" ? "needs" : "";
  const rawLat = Number(getSingleParam(params.lat));
  const rawLng = Number(getSingleParam(params.lng));
  const hasUserLocation =
    Number.isFinite(rawLat) &&
    Number.isFinite(rawLng) &&
    rawLat >= 33 &&
    rawLat <= 39 &&
    rawLng >= 124 &&
    rawLng <= 132;
  const rawRadius = Number(getSingleParam(params.radiusKm));
  const radiusKm = Number.isFinite(rawRadius) && rawRadius > 0 && rawRadius <= MAX_RADIUS_KM ? rawRadius : DEFAULT_RADIUS_KM;

  return {
    sido,
    userLocation: hasUserLocation ? { lat: rawLat, lng: rawLng, radiusKm } : null,
    checked,
    info,
  };
}

export function hasActiveListFilter(state: ListFilterState) {
  return Boolean(state.sido || state.userLocation || state.checked || state.info);
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getItemDistanceKm(item: FilterableLocationItem, state: ListFilterState) {
  if (!state.userLocation || !hasUsableCoordinate(item.lat, item.lng)) return null;
  return getDistanceKm(state.userLocation.lat, state.userLocation.lng, item.lat!, item.lng!);
}

export function filterByListLocation<T extends FilterableLocationItem>(items: T[], state: ListFilterState) {
  return items.filter((item) => {
    if (state.sido && !matchesSido(item.sido, state.sido)) return false;
    if (state.userLocation) {
      const distanceKm = getItemDistanceKm(item, state);
      if (distanceKm === null || distanceKm > state.userLocation.radiusKm) return false;
    }
    return true;
  });
}

export function compareByDistance<T extends FilterableLocationItem>(left: T, right: T, state: ListFilterState) {
  if (!state.userLocation) return 0;
  const leftDistance = getItemDistanceKm(left, state) ?? Infinity;
  const rightDistance = getItemDistanceKm(right, state) ?? Infinity;
  return leftDistance - rightDistance;
}

export function getSidoStats<T extends { sido?: string | null }>(items: T[], limit: number) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = getSidoLabel(item.sido);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([sido, count]) => ({ sido, count }))
    .sort((left, right) => right.count - left.count || left.sido.localeCompare(right.sido, "ko-KR"))
    .slice(0, limit);
}

export function buildListFilterHref(
  baseHref: string,
  filters: { sido?: string | null; location?: { lat: number; lng: number; radiusKm: number } | null; checked?: "recent" | null; info?: "needs" | null } = {},
) {
  const url = new URL(baseHref, "https://local.dangnyang.example");
  url.searchParams.delete("sido");
  url.searchParams.delete("lat");
  url.searchParams.delete("lng");
  url.searchParams.delete("radiusKm");
  url.searchParams.delete("checked");
  url.searchParams.delete("info");

  if (filters.sido) url.searchParams.set("sido", filters.sido);
  if (filters.checked === "recent") url.searchParams.set("checked", "recent");
  if (filters.info === "needs") url.searchParams.set("info", "needs");
  if (filters.location) {
    url.searchParams.set("lat", filters.location.lat.toFixed(6));
    url.searchParams.set("lng", filters.location.lng.toFixed(6));
    url.searchParams.set("radiusKm", filters.location.radiusKm.toString());
  }

  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
}