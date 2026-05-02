import type { PlaceCategory, SyncSource } from "@prisma/client";

export type PlaceSourceEntry = {
  category: PlaceCategory;
  label: string;
  syncSource: SyncSource;
  dataGoKrId: string;
  /** apis.data.go.kr 엔드포인트 (기본 URL, /info 제외) */
  apiBaseUrl: string;
  /** file.localdata.go.kr fallback URL (403 가능) */
  sourceUrl: string;
  expectedFormat: "csv" | "xlsx" | "json";
  estimatedCount: number;
};

const APIS_KEY_ENV = "DATA_GO_KR_API_KEY";

export const PLACE_SOURCE_REGISTRY = {
  ANIMAL_HOSPITAL: {
    category: "ANIMAL_HOSPITAL" as const,
    label: "동물병원",
    syncSource: "LOCALDATA_ANIMAL_HOSPITAL" as const,
    dataGoKrId: "15045050",
    apiBaseUrl: "https://apis.data.go.kr/1741000/animal_hospitals",
    sourceUrl: "https://file.localdata.go.kr/file/animal_hospitals/info",
    expectedFormat: "json" as const,
    estimatedCount: 10514,
  },
  PHARMACY: {
    category: "PHARMACY" as const,
    label: "동물약국",
    syncSource: "LOCALDATA_PHARMACY" as const,
    dataGoKrId: "15096578",
    apiBaseUrl: "https://apis.data.go.kr/1741000/animal_pharmacies",
    sourceUrl: "https://file.localdata.go.kr/file/animal_pharmacies/info",
    expectedFormat: "json" as const,
    estimatedCount: 3000,
  },
  GROOMING: {
    category: "GROOMING" as const,
    label: "동물미용업",
    syncSource: "LOCALDATA_GROOMING" as const,
    dataGoKrId: "15107032",
    apiBaseUrl: "https://apis.data.go.kr/1741000/pet_grooming",
    sourceUrl: "https://file.localdata.go.kr/file/pet_grooming/info",
    expectedFormat: "json" as const,
    estimatedCount: 10609,
  },
  DAYCARE: {
    category: "DAYCARE" as const,
    label: "동물위탁관리업",
    syncSource: "LOCALDATA_DAYCARE" as const,
    dataGoKrId: "15107029",
    apiBaseUrl: "https://apis.data.go.kr/1741000/animal_boarding",
    sourceUrl: "https://file.localdata.go.kr/file/animal_boarding/info",
    expectedFormat: "json" as const,
    estimatedCount: 7887,
  },
  FUNERAL: {
    category: "FUNERAL" as const,
    label: "동물장묘업",
    syncSource: "LOCALDATA_FUNERAL" as const,
    dataGoKrId: "15045054",
    apiBaseUrl: "https://apis.data.go.kr/1741000/animal_cremation",
    sourceUrl: "https://file.localdata.go.kr/file/animal_cremation/info",
    expectedFormat: "json" as const,
    estimatedCount: 86,
  },
} as const satisfies Record<string, PlaceSourceEntry>;

export type PlaceSourceKey = keyof typeof PLACE_SOURCE_REGISTRY;
export const PLACE_SOURCE_KEYS = Object.keys(PLACE_SOURCE_REGISTRY) as PlaceSourceKey[];

export function getPlaceSourceEntry(category: string): PlaceSourceEntry | null {
  return (PLACE_SOURCE_REGISTRY as Record<string, PlaceSourceEntry>)[category] ?? null;
}
