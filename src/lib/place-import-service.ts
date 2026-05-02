import crypto from "crypto";
import type { PlaceCategory, SyncSource } from "@prisma/client";
import { normalizeText } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import type { ParsedPlaceRow } from "@/lib/place-import-parser";

export type ImportPlaceOptions = {
  category: PlaceCategory;
  syncSource: SyncSource;
  sourceUrl: string;
};

export type ImportPlaceError = {
  row: number;
  name: string;
  reason: string;
};

export type ImportPlacesResult = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportPlaceError[];
};

function generateSourceId(syncSource: string, name: string, normalizedAddress: string | null): string {
  const key = `${syncSource}:${name.toLowerCase()}:${normalizedAddress?.toLowerCase() ?? ""}`;
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 40);
}

export async function importPlacesFromRows(
  rows: ParsedPlaceRow[],
  options: ImportPlaceOptions,
): Promise<ImportPlacesResult> {
  const { category, syncSource, sourceUrl } = options;
  const now = new Date();

  const result: ImportPlacesResult = {
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (rows.length === 0) return result;

  // 처리할 레코드 준비 (배치 내 sourceId 중복 제거)
  const seenSourceIds = new Set<string>();
  const records = rows
    .map((row, idx) => {
      if (!row.name || row.name.trim().length < 2) {
        result.skipped++;
        return null;
      }
      const normalizedName = normalizeText(row.name).toLowerCase();
      const sourceId = row.sourceId ?? generateSourceId(syncSource, row.name, row.normalizedAddress);
      return { row, idx, normalizedName, sourceId };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => {
      if (seenSourceIds.has(r.sourceId)) {
        result.skipped++;
        return false;
      }
      seenSourceIds.add(r.sourceId);
      return true;
    });

  // 기존 Place 조회 (sourceType=OFFICIAL_DATA, sourceName=syncSource)
  const sourceIds = records.map((r) => r.sourceId);
  const existingPlaces = await prisma.place.findMany({
    where: {
      sourceType: "OFFICIAL_DATA",
      sourceName: syncSource,
      sourceId: { in: sourceIds },
    },
    select: { id: true, sourceId: true, createdAt: true, firstSeenAt: true },
  });
  const existingMap = new Map(existingPlaces.map((p) => [p.sourceId, p]));

  // 배치 upsert payload 구성
  const payload = records.map(({ row, sourceId, normalizedName }) => {
    const existing = existingMap.get(sourceId);
    return {
      id: existing?.id ?? crypto.randomUUID(),
      category: category as string,
      name: row.name,
      normalizedName,
      sido: row.sido ?? null,
      sigungu: row.sigungu ?? null,
      eupmyeondong: row.eupmyeondong ?? null,
      address: row.address ?? null,
      roadAddress: row.roadAddress ?? null,
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      phone: row.phone ?? null,
      businessStatus: row.businessStatus ?? null,
      sourceType: "OFFICIAL_DATA",
      sourceName: syncSource as string,
      sourceUrl,
      sourceId,
      sourceUpdatedAt: (row.sourceUpdatedAt ?? now).toISOString(),
      firstSeenAt: (existing?.firstSeenAt ?? now).toISOString(),
      lastSeenAt: now.toISOString(),
      ownerVerified: false,
      isActive: true,
      createdAt: (existing?.createdAt ?? now).toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  if (payload.length === 0) return result;

  const addedCount = payload.filter((p) => !existingMap.has(p.sourceId)).length;
  const updatedCount = payload.length - addedCount;

  try {
    await prisma.$executeRaw`
      INSERT INTO "Place" (
        "id", "category", "name", "normalizedName",
        "sido", "sigungu", "eupmyeondong",
        "address", "roadAddress",
        "lat", "lng", "phone", "businessStatus",
        "sourceType", "sourceName", "sourceUrl", "sourceId", "sourceUpdatedAt",
        "firstSeenAt", "lastSeenAt", "ownerVerified", "isActive",
        "createdAt", "updatedAt"
      )
      SELECT
        record."id",
        CAST(record."category" AS "PlaceCategory"),
        record."name", record."normalizedName",
        record."sido", record."sigungu", record."eupmyeondong",
        record."address", record."roadAddress",
        record."lat", record."lng", record."phone", record."businessStatus",
        CAST(record."sourceType" AS "SourceType"),
        CAST(record."sourceName" AS "SyncSource"),
        record."sourceUrl", record."sourceId",
        CAST(record."sourceUpdatedAt" AS TIMESTAMP(3)),
        CAST(record."firstSeenAt" AS TIMESTAMP(3)),
        CAST(record."lastSeenAt" AS TIMESTAMP(3)),
        record."ownerVerified", record."isActive",
        CAST(record."createdAt" AS TIMESTAMP(3)),
        CAST(record."updatedAt" AS TIMESTAMP(3))
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS record(
        "id" TEXT, "category" TEXT, "name" TEXT, "normalizedName" TEXT,
        "sido" TEXT, "sigungu" TEXT, "eupmyeondong" TEXT,
        "address" TEXT, "roadAddress" TEXT,
        "lat" DOUBLE PRECISION, "lng" DOUBLE PRECISION,
        "phone" TEXT, "businessStatus" TEXT,
        "sourceType" TEXT, "sourceName" TEXT,
        "sourceUrl" TEXT, "sourceId" TEXT, "sourceUpdatedAt" TEXT,
        "firstSeenAt" TEXT, "lastSeenAt" TEXT,
        "ownerVerified" BOOLEAN, "isActive" BOOLEAN,
        "createdAt" TEXT, "updatedAt" TEXT
      )
      ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "name" = EXCLUDED."name",
        "normalizedName" = EXCLUDED."normalizedName",
        "sido" = EXCLUDED."sido",
        "sigungu" = EXCLUDED."sigungu",
        "eupmyeondong" = EXCLUDED."eupmyeondong",
        "address" = EXCLUDED."address",
        "roadAddress" = EXCLUDED."roadAddress",
        "lat" = COALESCE(EXCLUDED."lat", "Place"."lat"),
        "lng" = COALESCE(EXCLUDED."lng", "Place"."lng"),
        "phone" = COALESCE(EXCLUDED."phone", "Place"."phone"),
        "businessStatus" = EXCLUDED."businessStatus",
        "sourceUrl" = EXCLUDED."sourceUrl",
        "sourceUpdatedAt" = EXCLUDED."sourceUpdatedAt",
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = EXCLUDED."updatedAt"
    `;

    result.created = addedCount;
    result.updated = updatedCount;
  } catch (error) {
    result.failed = payload.length;
    result.errors.push({
      row: 0,
      name: "(batch)",
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

/** SyncLog 기록 */
export async function logPlaceImportSync(options: {
  syncSource: SyncSource;
  mode: string;
  result: ImportPlacesResult;
  sourceUrl: string;
}): Promise<void> {
  const { syncSource, mode, result, sourceUrl } = options;
  await prisma.syncLog.create({
    data: {
      source: syncSource,
      mode,
      status: result.failed > 0 && result.created === 0 && result.updated === 0 ? "FAILED" : "SUCCESS",
      finishedAt: new Date(),
      totalCount: result.totalRows,
      addedCount: result.created,
      updatedCount: result.updated,
      removedCount: 0,
      errorMessage: result.errors.length > 0 ? result.errors[0].reason : null,
      message: `created=${result.created} updated=${result.updated} skipped=${result.skipped} failed=${result.failed}`,
      sourceUrl,
    },
  });
}
