import type { PlaceCategory, SourceType, SyncSource } from "@prisma/client";

export type SourceSyncResult = {
  skipped: boolean;
  log: {
    id: string;
    source: SyncSource;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    totalCount: number;
    addedCount: number;
    updatedCount: number;
    removedCount: number;
    skippedReason?: string | null;
    errorMessage?: string | null;
    sourceUrl?: string | null;
  };
};

export type NormalizedPlaceInput = {
  category: PlaceCategory;
  name: string;
  normalizedName: string;
  sido?: string | null;
  sigungu?: string | null;
  eupmyeondong?: string | null;
  address?: string | null;
  roadAddress?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  businessStatus?: string | null;
  sourceType: SourceType;
  sourceName?: SyncSource | null;
  sourceUrl?: string | null;
  sourceId?: string | null;
  sourceUpdatedAt?: Date | null;
};