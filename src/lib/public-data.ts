import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { normalizeText } from "@/lib/address";

export type PublicRestaurantLight = {
  id: string;
  name: string;
  businessType: string;
  sido: string;
  sigungu: string | null;
  eupmyeondong: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  officialRegistered: boolean;
  updatedAt: string;
};

export type PublicMapPoint = {
  id: string;
  name: string;
  businessType: string;
  lat: number;
  lng: number;
};

export type PublicCategoryCounts = {
  restaurantCount: number;
  restaurantCoordinateReadyCount: number;
  restaurantCoordinatePendingCount: number;
  placeCount: number;
  lostPetCount: number;
  lastUpdatedAt: string | null;
};

export type PublicRegions = {
  bySido: Array<{ sido: string; count: number }>;
  bySigungu: Array<{ sido: string; sigungu: string; count: number }>;
};

const PUBLIC_DATA_DIRECTORY = path.join(process.cwd(), "public", "data");

const EMPTY_CATEGORY_COUNTS: PublicCategoryCounts = {
  restaurantCount: 0,
  restaurantCoordinateReadyCount: 0,
  restaurantCoordinatePendingCount: 0,
  placeCount: 0,
  lostPetCount: 0,
  lastUpdatedAt: null,
};

const EMPTY_REGIONS: PublicRegions = {
  bySido: [],
  bySigungu: [],
};

async function readPublicJsonFile<T>(fileName: string, fallbackValue: T) {
  try {
    const filePath = path.join(PUBLIC_DATA_DIRECTORY, fileName);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallbackValue;
  }
}

export const getRestaurantsLightSnapshot = cache(async () => readPublicJsonFile<PublicRestaurantLight[]>("restaurants-light.json", []));
export const getMapPointsSnapshot = cache(async () => readPublicJsonFile<PublicMapPoint[]>("map-points.json", []));
export const getCategoryCountsSnapshot = cache(async () => readPublicJsonFile<PublicCategoryCounts>("category-counts.json", EMPTY_CATEGORY_COUNTS));
export const getRegionsSnapshot = cache(async () => readPublicJsonFile<PublicRegions>("regions.json", EMPTY_REGIONS));

// ─── Place 공개 스냅샷 타입 ───────────────────────────────────────────────

export type PublicPlaceLight = {
  id: string;
  category: string;
  name: string;
  address: string | null;
  roadAddress: string | null;
  sido: string | null;
  sigungu: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  sourceName: string | null;
  businessStatus: string | null;
  tags?: string[];
  updatedAt: string;
};

export type PublicPlaceMapPoint = {
  id: string;
  category: string;
  name: string;
  lat: number;
  lng: number;
  phone: string | null;
};

export const getPlacesLightSnapshot = cache(async () => readPublicJsonFile<PublicPlaceLight[]>("places-light.json", []));
export const getPlaceMapPointsSnapshot = cache(async () => readPublicJsonFile<PublicPlaceMapPoint[]>("place-map-points.json", []));

export function normalizePublicRestaurantSearchParams(params: { q?: string; sido?: string; type?: string }) {
  return {
    q: normalizeText(params.q ?? ""),
    sido: normalizeText(params.sido ?? ""),
    type: normalizeText(params.type ?? ""),
  };
}

export function filterRestaurantsLight(restaurants: PublicRestaurantLight[], params: { q?: string; sido?: string; type?: string }) {
  const normalized = normalizePublicRestaurantSearchParams(params);

  return restaurants.filter((restaurant) => {
    if (normalized.sido && restaurant.sido !== normalized.sido) return false;
    if (normalized.type && restaurant.businessType !== normalized.type) return false;
    if (!normalized.q) return true;

    const searchHaystack = [restaurant.name, restaurant.address, restaurant.sido, restaurant.sigungu, restaurant.eupmyeondong]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchHaystack.includes(normalized.q.toLowerCase());
  });
}

export function sortRestaurantsLight(restaurants: PublicRestaurantLight[]) {
  return [...restaurants].sort((left, right) => {
    const leftHasCoordinates = left.lat !== null && left.lng !== null;
    const rightHasCoordinates = right.lat !== null && right.lng !== null;
    if (leftHasCoordinates !== rightHasCoordinates) {
      return Number(rightHasCoordinates) - Number(leftHasCoordinates);
    }

    const leftUpdatedAt = new Date(left.updatedAt).getTime();
    const rightUpdatedAt = new Date(right.updatedAt).getTime();
    if (leftUpdatedAt !== rightUpdatedAt) {
      return rightUpdatedAt - leftUpdatedAt;
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}

export function getRestaurantBusinessTypes(restaurants: PublicRestaurantLight[]) {
  return Array.from(new Set(restaurants.map((restaurant) => restaurant.businessType))).sort((left, right) => left.localeCompare(right, "ko-KR"));
}

export function toRestaurantCardItem(restaurant: PublicRestaurantLight) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    businessType: restaurant.businessType,
    sido: restaurant.sido,
    sigungu: restaurant.sigungu,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    officialRegistered: restaurant.officialRegistered,
    dataUpdatedAt: new Date(restaurant.updatedAt),
  };
}

// ─── 보호동물 공고 스냅샷 ──────────────────────────────────────────────────

export type PublicAnimalNotice = {
  desertionNo: string;
  noticeNo: string;
  noticeSdt: string;
  noticeEdt: string;
  happenDt: string;
  happenPlace: string;
  kindCd: string;
  colorCd: string;
  age: string;
  weight: string;
  sexCd: string;
  neuterYn: string;
  specialMark: string;
  careNm: string;
  careTel: string;
  careAddr: string;
  orgNm: string;
  popfile: string;
  processState: string;
};

export type PublicAnimalNoticeCounts = {
  total: number;
  byState: Array<{ state: string; count: number }>;
  fetchedAt: string;
};

const EMPTY_ANIMAL_NOTICE_COUNTS: PublicAnimalNoticeCounts = {
  total: 0,
  byState: [],
  fetchedAt: new Date(0).toISOString(),
};

export const getAnimalNoticesSnapshot = cache(async () => readPublicJsonFile<PublicAnimalNotice[]>("animal-notices.json", []));
export const getAnimalNoticeCountsSnapshot = cache(async () => readPublicJsonFile<PublicAnimalNoticeCounts>("animal-notice-counts.json", EMPTY_ANIMAL_NOTICE_COUNTS));