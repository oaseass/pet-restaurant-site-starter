import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fetchFoodSafetyRestaurants } from "./fetch";
import { parseSyncMinHours, shouldSkipSync } from "./policy";

export const SOURCE_NAME = "foodsafety-petKorea";

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
        status: "SKIPPED",
        finishedAt: new Date(),
        message: `Skipped: last successful sync was within ${minHours} hours.`,
      },
    });
    return { skipped: true, log: skipped };
  }

  const log = await prisma.syncLog.create({
    data: { source: SOURCE_NAME, status: "FAILED" },
  });

  try {
    const { rows, sourceUrl, mode } = await fetchFoodSafetyRestaurants();
    if (rows.length < 1) throw new Error("No restaurant rows parsed from official source.");

    const now = new Date();
    const existingRestaurants = await prisma.restaurant.findMany({
      select: { id: true, sourceKey: true, createdAt: true, firstSeenAt: true },
    });
    const existingMap = new Map(
      existingRestaurants.map((restaurant) => [restaurant.sourceKey, restaurant])
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

    const currentKeys = rows.map((row) => row.sourceKey);
    const removed = await prisma.restaurant.updateMany({
      where: {
        sourceKey: { notIn: currentKeys },
        status: "ACTIVE",
      },
      data: { status: "REMOVED_FROM_SOURCE", dataUpdatedAt: now },
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
      },
    });

    return { skipped: false, log: successLog };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failedLog = await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "FAILED", finishedAt: new Date(), message },
    });
    throw Object.assign(new Error(message), { log: failedLog });
  }
}
