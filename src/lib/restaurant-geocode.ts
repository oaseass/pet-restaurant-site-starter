import { normalizeAddress } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import { geocodeAddressDetailed, hasGeocodeServerConfig, type GeocodeDetailedResult, type GeocodeProvider } from "@/lib/sources/geocode";

export const MAX_RESTAURANT_GEOCODE_LIMIT = 100;

type Logger = Pick<typeof console, "info" | "warn" | "error">;

type RestaurantGeocodeRow = {
  id: string;
  name: string;
  address: string;
  normalizedAddress: string;
  lat: number | null;
  lng: number | null;
};

type CoordinateCacheEntry = {
  lat: number;
  lng: number;
  source: "db-cache" | "runtime-cache";
};

export type GeocodeRestaurantsArgs = {
  limit: number;
  dryRun: boolean;
};

export type GeocodeRestaurantProcessedItem = {
  restaurantId: string;
  name: string;
  address: string;
  status: "updated" | "would-update" | "failed";
  source: "db-cache" | "runtime-cache" | GeocodeProvider | null;
  lat: number | null;
  lng: number | null;
  reason?: string;
};

export type GeocodeRestaurantsBatchResult = {
  limit: number;
  dryRun: boolean;
  providerConfigured: boolean;
  selectedCount: number;
  resolvedCount: number;
  updatedCount: number;
  failedCount: number;
  apiRequestCount: number;
  dbCacheHitCount: number;
  runtimeCacheHitCount: number;
  processed: GeocodeRestaurantProcessedItem[];
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRestaurantGeocodeCacheKey(address: string, normalizedAddress?: string | null) {
  return (normalizedAddress?.trim().toLowerCase() || normalizeAddress(address).toLowerCase()).trim();
}

export function parseGeocodeRestaurantsArgs(argv: string[]): GeocodeRestaurantsArgs {
  let limit = MAX_RESTAURANT_GEOCODE_LIMIT;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--limit") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("--limit 다음에 숫자를 넣어야 합니다.");
      }

      limit = parseLimitValue(nextValue);
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = parseLimitValue(arg.slice("--limit=".length));
      continue;
    }

    throw new Error(`알 수 없는 옵션입니다: ${arg}`);
  }

  return { limit, dryRun };
}

function parseLimitValue(rawValue: string) {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--limit 값은 1 이상의 정수여야 합니다.");
  }

  if (parsed > MAX_RESTAURANT_GEOCODE_LIMIT) {
    throw new Error(`한 번에 최대 ${MAX_RESTAURANT_GEOCODE_LIMIT}건까지만 처리할 수 있습니다.`);
  }

  return parsed;
}

async function loadRestaurantGeocodeCandidates(limit: number) {
  return prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ lat: null }, { lng: null }],
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      address: true,
      normalizedAddress: true,
      lat: true,
      lng: true,
    },
  });
}

async function loadExistingCoordinatesByAddress(rows: RestaurantGeocodeRow[]) {
  const normalizedAddresses = Array.from(new Set(rows.map((row) => createRestaurantGeocodeCacheKey(row.address, row.normalizedAddress)).filter(Boolean)));
  if (normalizedAddresses.length === 0) return [];

  return prisma.restaurant.findMany({
    where: {
      status: "ACTIVE",
      normalizedAddress: { in: normalizedAddresses },
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      address: true,
      normalizedAddress: true,
      lat: true,
      lng: true,
    },
  });
}

export async function geocodeRestaurantsBatch({
  limit = MAX_RESTAURANT_GEOCODE_LIMIT,
  dryRun = false,
  logger = console,
  sleepMs = 120,
}: Partial<GeocodeRestaurantsArgs> & { logger?: Logger; sleepMs?: number } = {}): Promise<GeocodeRestaurantsBatchResult> {
  if (limit < 1 || limit > MAX_RESTAURANT_GEOCODE_LIMIT) {
    throw new Error(`limit은 1 이상 ${MAX_RESTAURANT_GEOCODE_LIMIT} 이하만 허용됩니다.`);
  }

  const providerConfigured = hasGeocodeServerConfig();
  const rows = await loadRestaurantGeocodeCandidates(limit);
  const existingCoordinateRows = await loadExistingCoordinatesByAddress(rows);
  const coordinateCache = new Map<string, CoordinateCacheEntry>();
  const requestCache = new Map<string, GeocodeDetailedResult>();

  for (const row of existingCoordinateRows) {
    const cacheKey = createRestaurantGeocodeCacheKey(row.address, row.normalizedAddress);
    if (!cacheKey || row.lat === null || row.lng === null || coordinateCache.has(cacheKey)) continue;
    coordinateCache.set(cacheKey, { lat: row.lat, lng: row.lng, source: "db-cache" });
  }

  if (!providerConfigured) {
    logger.warn("No Kakao/Naver server geocoding credentials found. Only DB cache hits can resolve coordinates.");
  }

  let resolvedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let apiRequestCount = 0;
  let dbCacheHitCount = 0;
  let runtimeCacheHitCount = 0;
  const processed: GeocodeRestaurantProcessedItem[] = [];

  for (const row of rows) {
    const cacheKey = createRestaurantGeocodeCacheKey(row.address, row.normalizedAddress);
    if (!cacheKey) {
      failedCount += 1;
      const item = {
        restaurantId: row.id,
        name: row.name,
        address: row.address,
        status: "failed" as const,
        source: null,
        lat: null,
        lng: null,
        reason: "정규화 가능한 주소가 없습니다.",
      };
      processed.push(item);
      logger.warn(`[geocode:failed] ${row.id} ${row.name} -> ${item.reason}`);
      continue;
    }

    const cachedCoordinates = coordinateCache.get(cacheKey);
    if (cachedCoordinates) {
      resolvedCount += 1;
      if (cachedCoordinates.source === "db-cache") dbCacheHitCount += 1;
      if (cachedCoordinates.source === "runtime-cache") runtimeCacheHitCount += 1;

      if (!dryRun) {
        await prisma.restaurant.update({
          where: { id: row.id },
          data: { lat: cachedCoordinates.lat, lng: cachedCoordinates.lng },
        });
        updatedCount += 1;
      }

      const item = {
        restaurantId: row.id,
        name: row.name,
        address: row.address,
        status: dryRun ? "would-update" as const : "updated" as const,
        source: cachedCoordinates.source,
        lat: cachedCoordinates.lat,
        lng: cachedCoordinates.lng,
      };
      processed.push(item);
      logger.info(`[geocode:${item.status}] ${row.id} ${row.name} -> ${cachedCoordinates.lat}, ${cachedCoordinates.lng} (${cachedCoordinates.source})`);
      continue;
    }

    let detailed = requestCache.get(cacheKey);
    if (!detailed) {
      detailed = await geocodeAddressDetailed({ address: row.address });
      requestCache.set(cacheKey, detailed);
      if (detailed.attemptedProviders.length > 0) {
        apiRequestCount += 1;
        await delay(sleepMs);
      }
    }

    if (detailed.status === "success" && detailed.coordinates) {
      coordinateCache.set(cacheKey, {
        lat: detailed.coordinates.lat,
        lng: detailed.coordinates.lng,
        source: "runtime-cache",
      });
      resolvedCount += 1;

      if (!dryRun) {
        await prisma.restaurant.update({
          where: { id: row.id },
          data: {
            lat: detailed.coordinates.lat,
            lng: detailed.coordinates.lng,
          },
        });
        updatedCount += 1;
      }

      const item = {
        restaurantId: row.id,
        name: row.name,
        address: row.address,
        status: dryRun ? "would-update" as const : "updated" as const,
        source: detailed.provider,
        lat: detailed.coordinates.lat,
        lng: detailed.coordinates.lng,
      };
      processed.push(item);
      logger.info(`[geocode:${item.status}] ${row.id} ${row.name} -> ${detailed.coordinates.lat}, ${detailed.coordinates.lng} (${detailed.provider})`);
      continue;
    }

    failedCount += 1;
    const item = {
      restaurantId: row.id,
      name: row.name,
      address: row.address,
      status: "failed" as const,
      source: null,
      lat: null,
      lng: null,
      reason: detailed.reason ?? "좌표를 찾지 못했습니다.",
    };
    processed.push(item);
    logger.warn(`[geocode:failed] ${row.id} ${row.name} -> ${item.reason}`);
  }

  return {
    limit,
    dryRun,
    providerConfigured,
    selectedCount: rows.length,
    resolvedCount,
    updatedCount,
    failedCount,
    apiRequestCount,
    dbCacheHitCount,
    runtimeCacheHitCount,
    processed,
  };
}