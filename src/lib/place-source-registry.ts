import type { PlaceCategory, SyncSource } from "@prisma/client";

export type PlaceSourceEntry = {
  category: PlaceCategory;
  label: string;
  syncSource: SyncSource;
  dataGoKrId: string;
  sourceUrl: string;
  expectedFormat: "csv" | "xlsx";
  estimatedCount: number;
};

export const PLACE_SOURCE_REGISTRY = {
  ANIMAL_HOSPITAL: {
    category: "ANIMAL_HOSPITAL" as const,
    label: "동물병원",
    syncSource: "LOCALDATA_ANIMAL_HOSPITAL" as const,
    dataGoKrId: "15045050",
    sourceUrl: "https://file.localdata.go.kr/file/animal_hospitals/info",
    expectedFormat: "csv" as const,
    estimatedCount: 9445,
  },
  GROOMING: {
    category: "GROOMING" as const,
    label: "동물미용업",
    syncSource: "LOCALDATA_GROOMING" as const,
    dataGoKrId: "15107032",
    sourceUrl: "https://file.localdata.go.kr/file/pet_grooming/info",
    expectedFormat: "csv" as const,
    estimatedCount: 10609,
  },
  DAYCARE: {
    category: "DAYCARE" as const,
    label: "동물위탁관리업",
    syncSource: "LOCALDATA_DAYCARE" as const,
    dataGoKrId: "15107029",
    sourceUrl: "https://file.localdata.go.kr/file/animal_boarding/info",
    expectedFormat: "csv" as const,
    estimatedCount: 7887,
  },
  FUNERAL: {
    category: "FUNERAL" as const,
    label: "동물장묘업",
    syncSource: "LOCALDATA_FUNERAL" as const,
    dataGoKrId: "15045054",
    sourceUrl: "https://file.localdata.go.kr/file/animal_cremation/info",
    expectedFormat: "csv" as const,
    estimatedCount: 86,
  },
} as const satisfies Record<string, PlaceSourceEntry>;

export type PlaceSourceKey = keyof typeof PLACE_SOURCE_REGISTRY;
export const PLACE_SOURCE_KEYS = Object.keys(PLACE_SOURCE_REGISTRY) as PlaceSourceKey[];

export function getPlaceSourceEntry(category: string): PlaceSourceEntry | null {
  return (PLACE_SOURCE_REGISTRY as Record<string, PlaceSourceEntry>)[category] ?? null;
}
