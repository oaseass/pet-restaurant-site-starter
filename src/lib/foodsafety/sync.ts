import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fetchFoodSafetyRestaurants } from "./fetch";
import { parseSyncMinHours, shouldSkipSync } from "./policy";

export const SOURCE_NAME = "FOODSAFETY_PET_RESTAURANT" as const;

function minHoursBetweenSyncs() {
  return parseSyncMinHours(process.env.SYNC_MIN_HOURS);
}

export async function getLatestSuccessfulSync() {
  return prisma.syncLog.findFirst({
    where: { source: SOURCE_NAME, status: "SUCCESS" },
    orderBy: { finishedAt: "desc" },
  });
}

export async function syncPetRestaurants(options: { force?: boolean } = {}) {
  const minHours = minHoursBetweenSyncs();
  const lastSuccess = await getLatestSuccessfulSync();

  if (!options.force && lastSuccess?.finishedAt && shouldSkipSync(lastSuccess.finishedAt, minHours)) {
    const skipped = await prisma.syncLog.create({
      data: {
        source: SOURCE_NAME,
        mode: options.force ? "force" : "scheduled",
        status: "SKIPPED",
        finishedAt: new Date(),
        skippedReason: `Skipped: last successful sync was within ${minHours} hours.`,
        message: `Skipped: last successful sync was within ${minHours} hours.`,
      },
    });
    return { skipped: true, log: skipped };
  }

  const log = await prisma.syncLog.create({
    data: { source: SOURCE_NAME, mode: options.force ? "force" : "scheduled", status: "FAILED" },
  });

  try {
    const { rows, sourceUrl, mode } = await fetchFoodSafetyRestaurants();
    if (rows.length < 1) throw new Error("No restaurant rows parsed from official source.");

    const now = new Date();
    const existingRestaurants = await prisma.restaurant.findMany({
      select: { id: true, sourceKey: true, createdAt: true, firstSeenAt: true },
    });
    const existingPlaces = await prisma.place.findMany({
      where: { sourceName: SOURCE_NAME },
      select: { id: true, sourceId: true, createdAt: true, firstSeenAt: true },
    });
    const existingMap = new Map(
      existingRestaurants.map((restaurant) => [restaurant.sourceKey, restaurant])
    );
    const existingPlaceMap = new Map(
      existingPlaces.map((place) => [place.sourceId, place])
    );

    const payload = rows.map((row) => {
      const existing = existingMap.get(row.sourceKey);

      return {
        id: existing?.id ?? crypto.randomUUID(),
        sourceKey: row.sourceKey,
        name: row.name,
        businessType: row.businessType,
        sido: row.sido,
        sigungu: row.sigungu ?? null,
        eupmyeondong: row.eupmyeondong ?? null,
        address: row.address,
        normalizedAddress: row.normalizedAddress,
        status: "ACTIVE",
        sourceUrl,
        dataUpdatedAt: now.toISOString(),
        firstSeenAt: (existing?.firstSeenAt ?? now).toISOString(),
        lastSeenAt: now.toISOString(),
        createdAt: (existing?.createdAt ?? now).toISOString(),
        updatedAt: now.toISOString(),
        officialRegistered: true,
      };
    });

    const addedCount = payload.filter((item) => !existingMap.has(item.sourceKey)).length;
    const updatedCount = payload.length - addedCount;
    const placePayload = rows.map((row) => {
      const existing = existingPlaceMap.get(row.sourceKey);
      return {
        id: existing?.id ?? crypto.randomUUID(),
        category: "PET_RESTAURANT",
        name: row.name,
        normalizedName: row.name.trim().toLowerCase(),
        sido: row.sido,
        sigungu: row.sigungu ?? null,
        eupmyeondong: row.eupmyeondong ?? null,
        address: row.address,
        roadAddress: row.address,
        lat: null,
        lng: null,
        phone: null,
        businessStatus: "영업/운영 상태 미확인",
        sourceType: "OFFICIAL_DATA",
        sourceName: SOURCE_NAME,
        sourceUrl,
        sourceId: row.sourceKey,
        sourceUpdatedAt: now.toISOString(),
        firstSeenAt: (existing?.firstSeenAt ?? now).toISOString(),
        lastSeenAt: now.toISOString(),
        ownerVerified: false,
        isActive: true,
        createdAt: (existing?.createdAt ?? now).toISOString(),
        updatedAt: now.toISOString(),
      };
    });

    await prisma.$executeRaw`
      INSERT INTO "Restaurant" (
        "id",
        "sourceKey",
        "name",
        "businessType",
        "sido",
        "sigungu",
        "eupmyeondong",
        "address",
        "normalizedAddress",
        "officialRegistered",
        "status",
        "sourceUrl",
        "dataUpdatedAt",
        "firstSeenAt",
        "lastSeenAt",
        "createdAt",
        "updatedAt"
      )
      SELECT
        record."id",
        record."sourceKey",
        record."name",
        record."businessType",
        record."sido",
        record."sigungu",
        record."eupmyeondong",
        record."address",
        record."normalizedAddress",
        record."officialRegistered",
        CAST(record."status" AS "RestaurantStatus"),
        record."sourceUrl",
        CAST(record."dataUpdatedAt" AS TIMESTAMP(3)),
        CAST(record."firstSeenAt" AS TIMESTAMP(3)),
        CAST(record."lastSeenAt" AS TIMESTAMP(3)),
        CAST(record."createdAt" AS TIMESTAMP(3)),
        CAST(record."updatedAt" AS TIMESTAMP(3))
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS record(
        "id" TEXT,
        "sourceKey" TEXT,
        "name" TEXT,
        "businessType" TEXT,
        "sido" TEXT,
        "sigungu" TEXT,
        "eupmyeondong" TEXT,
        "address" TEXT,
        "normalizedAddress" TEXT,
        "officialRegistered" BOOLEAN,
        "status" TEXT,
        "sourceUrl" TEXT,
        "dataUpdatedAt" TEXT,
        "firstSeenAt" TEXT,
        "lastSeenAt" TEXT,
        "createdAt" TEXT,
        "updatedAt" TEXT
      )
      ON CONFLICT ("sourceKey") DO UPDATE SET
        "name" = EXCLUDED."name",
        "businessType" = EXCLUDED."businessType",
        "sido" = EXCLUDED."sido",
        "sigungu" = EXCLUDED."sigungu",
        "eupmyeondong" = EXCLUDED."eupmyeondong",
        "address" = EXCLUDED."address",
        "normalizedAddress" = EXCLUDED."normalizedAddress",
        "officialRegistered" = EXCLUDED."officialRegistered",
        "status" = EXCLUDED."status",
        "sourceUrl" = EXCLUDED."sourceUrl",
        "dataUpdatedAt" = EXCLUDED."dataUpdatedAt",
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    await prisma.$executeRaw`
      INSERT INTO "Place" (
        "id",
        "category",
        "name",
        "normalizedName",
        "sido",
        "sigungu",
        "eupmyeondong",
        "address",
        "roadAddress",
        "lat",
        "lng",
        "phone",
        "businessStatus",
        "sourceType",
        "sourceName",
        "sourceUrl",
        "sourceId",
        "sourceUpdatedAt",
        "firstSeenAt",
        "lastSeenAt",
        "ownerVerified",
        "isActive",
        "createdAt",
        "updatedAt"
      )
      SELECT
        record."id",
        CAST(record."category" AS "PlaceCategory"),
        record."name",
        record."normalizedName",
        record."sido",
        record."sigungu",
        record."eupmyeondong",
        record."address",
        record."roadAddress",
        record."lat",
        record."lng",
        record."phone",
        record."businessStatus",
        CAST(record."sourceType" AS "SourceType"),
        CAST(record."sourceName" AS "SyncSource"),
        record."sourceUrl",
        record."sourceId",
        CAST(record."sourceUpdatedAt" AS TIMESTAMP(3)),
        CAST(record."firstSeenAt" AS TIMESTAMP(3)),
        CAST(record."lastSeenAt" AS TIMESTAMP(3)),
        record."ownerVerified",
        record."isActive",
        CAST(record."createdAt" AS TIMESTAMP(3)),
        CAST(record."updatedAt" AS TIMESTAMP(3))
      FROM jsonb_to_recordset(${JSON.stringify(placePayload)}::jsonb) AS record(
        "id" TEXT,
        "category" TEXT,
        "name" TEXT,
        "normalizedName" TEXT,
        "sido" TEXT,
        "sigungu" TEXT,
        "eupmyeondong" TEXT,
        "address" TEXT,
        "roadAddress" TEXT,
        "lat" DOUBLE PRECISION,
        "lng" DOUBLE PRECISION,
        "phone" TEXT,
        "businessStatus" TEXT,
        "sourceType" TEXT,
        "sourceName" TEXT,
        "sourceUrl" TEXT,
        "sourceId" TEXT,
        "sourceUpdatedAt" TEXT,
        "firstSeenAt" TEXT,
        "lastSeenAt" TEXT,
        "ownerVerified" BOOLEAN,
        "isActive" BOOLEAN,
        "createdAt" TEXT,
        "updatedAt" TEXT
      )
      ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "category" = EXCLUDED."category",
        "name" = EXCLUDED."name",
        "normalizedName" = EXCLUDED."normalizedName",
        "sido" = EXCLUDED."sido",
        "sigungu" = EXCLUDED."sigungu",
        "eupmyeondong" = EXCLUDED."eupmyeondong",
        "address" = EXCLUDED."address",
        "roadAddress" = EXCLUDED."roadAddress",
        "lat" = EXCLUDED."lat",
        "lng" = EXCLUDED."lng",
        "phone" = EXCLUDED."phone",
        "businessStatus" = EXCLUDED."businessStatus",
        "sourceName" = EXCLUDED."sourceName",
        "sourceUrl" = EXCLUDED."sourceUrl",
        "sourceUpdatedAt" = EXCLUDED."sourceUpdatedAt",
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    const currentKeys = rows.map((row) => row.sourceKey);
    const removed = await prisma.restaurant.updateMany({
      where: {
        sourceKey: { notIn: currentKeys },
        status: "ACTIVE",
      },
      data: { status: "REMOVED_FROM_SOURCE", dataUpdatedAt: now },
    });
    await prisma.place.updateMany({
      where: {
        sourceName: SOURCE_NAME,
        sourceId: { notIn: currentKeys },
        isActive: true,
      },
      data: { isActive: false, sourceUpdatedAt: now },
    });

    const successLog = await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        finishedAt: now,
        totalCount: rows.length,
        addedCount,
        updatedCount,
        removedCount: removed.count,
        message: `Synced by ${mode}.`,
        sourceUrl,
      },
    });

    return { skipped: false, log: successLog };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedLog = await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "FAILED", finishedAt: new Date(), errorMessage: message, message },
    });
    throw Object.assign(new Error(message), { log: failedLog });
  }
}
