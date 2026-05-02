import { normalizeAddress } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import { geocodeAddressDetailed, hasGeocodeServerConfig, type GeocodeProvider } from "@/lib/sources/geocode";
import type { PlaceCategory } from "@prisma/client";

export const MAX_PLACE_GEOCODE_LIMIT = 100;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Logger = Pick<typeof console, "info" | "warn" | "error">;

export type GeocodePlacesBatchArgs = {
  category?: string;
  limit: number;
  dryRun: boolean;
};

export type GeocodePlaceProcessedItem = {
  placeId: string;
  name: string;
  address: string;
  status: "updated" | "would-update" | "failed";
  source: "db-cache" | "runtime-cache" | GeocodeProvider | null;
  lat: number | null;
  lng: number | null;
  reason?: string;
};

export type GeocodePlacesBatchResult = {
  category: string | null;
  limit: number;
  dryRun: boolean;
  providerConfigured: boolean;
  selectedCount: number;
  resolvedCount: number;
  updatedCount: number;
  failedCount: number;
  apiRequestCount: number;
  processed: GeocodePlaceProcessedItem[];
};

export async function geocodePlacesBatch(
  args: GeocodePlacesBatchArgs,
  log: Logger = console,
): Promise<GeocodePlacesBatchResult> {
  const { category, limit, dryRun } = args;
  const providerConfigured = hasGeocodeServerConfig();

  if (!providerConfigured) {
    return {
      category: category ?? null,
      limit,
      dryRun,
      providerConfigured: false,
      selectedCount: 0,
      resolvedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      apiRequestCount: 0,
      processed: [],
    };
  }

  // 좌표 없는 Place 선택
  const candidates = await prisma.place.findMany({
    where: {
      lat: null,
      isActive: true,
      address: { not: null },
      ...(category ? { category: category as PlaceCategory } : {}),
    },
    select: { id: true, name: true, address: true, normalizedName: true },
    orderBy: { firstSeenAt: "desc" },
    take: limit,
  });

  log.info(`[place-geocode] 대상 ${candidates.length}건 (category=${category ?? "all"}, dryRun=${dryRun})`);

  const runtimeCache = new Map<string, { lat: number; lng: number }>();
  const processed: GeocodePlaceProcessedItem[] = [];
  let apiRequestCount = 0;

  for (const place of candidates) {
    const address = place.address!;
    const cacheKey = normalizeAddress(address).toLowerCase().trim();

    // DB 캐시: 이미 좌표 있는 같은 주소 Place
    let resolved: { lat: number; lng: number; source: string } | null = null;

    const dbCached = await prisma.place.findFirst({
      where: { normalizedName: place.normalizedName, lat: { not: null } },
      select: { lat: true, lng: true },
    });
    if (dbCached?.lat && dbCached.lng) {
      resolved = { lat: dbCached.lat, lng: dbCached.lng, source: "db-cache" };
    }

    // 런타임 캐시
    if (!resolved && runtimeCache.has(cacheKey)) {
      const cached = runtimeCache.get(cacheKey)!;
      resolved = { lat: cached.lat, lng: cached.lng, source: "runtime-cache" };
    }

    // Kakao Geocode API
    if (!resolved) {
      try {
        await delay(120);
        const result = await geocodeAddressDetailed({ address });
        apiRequestCount += 1;
        if (result?.coordinates?.lat && result.coordinates.lng) {
          resolved = { lat: result.coordinates.lat, lng: result.coordinates.lng, source: result.provider ?? "kakao" };
          runtimeCache.set(cacheKey, { lat: result.coordinates.lat, lng: result.coordinates.lng });
        }
      } catch (error) {
        log.warn(`[place-geocode] geocode 실패 ${place.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (resolved) {
      if (!dryRun) {
        await prisma.place.update({
          where: { id: place.id },
          data: { lat: resolved.lat, lng: resolved.lng },
        });
      }
      processed.push({
        placeId: place.id,
        name: place.name,
        address,
        status: dryRun ? "would-update" : "updated",
        source: resolved.source as GeocodePlaceProcessedItem["source"],
        lat: resolved.lat,
        lng: resolved.lng,
      });
    } else {
      processed.push({
        placeId: place.id,
        name: place.name,
        address,
        status: "failed",
        source: null,
        lat: null,
        lng: null,
        reason: "좌표를 찾을 수 없음",
      });
    }
  }

  const updatedCount = processed.filter((p) => p.status === "updated").length;
  const failedCount = processed.filter((p) => p.status === "failed").length;

  log.info(`[place-geocode] 완료 — 갱신 ${updatedCount}건, 실패 ${failedCount}건, API 호출 ${apiRequestCount}회`);

  return {
    category: category ?? null,
    limit,
    dryRun,
    providerConfigured,
    selectedCount: candidates.length,
    resolvedCount: updatedCount,
    updatedCount,
    failedCount,
    apiRequestCount,
    processed,
  };
}
