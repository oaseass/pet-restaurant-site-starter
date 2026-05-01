import crypto from "crypto";
import * as XLSX from "xlsx";
import type { PlaceCategory, SyncSource } from "@prisma/client";
import { extractDong, extractSido, extractSigungu, normalizeAddress, normalizeText } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/sources/geocode";
import { delay, withRetry } from "@/lib/sources/rate-limit";
import { runManagedSync } from "@/lib/sources/sync-runner";

type LocalDataConfig = {
  source: SyncSource;
  category: PlaceCategory;
  urlEnvName: string;
  sourceLabel: string;
  activeStatusKeywords: string[];
  includeInactive?: boolean;
};

type RawRecord = Record<string, unknown>;

const NAME_ALIASES = ["사업장명", "업소명", "업체명", "상호명", "사업장명칭"];
const ADDRESS_ALIASES = ["소재지전체주소", "사업장소재지", "업소주소", "주소", "도로명전체주소", "도로명주소"];
const ROAD_ADDRESS_ALIASES = ["도로명전체주소", "도로명주소", "소재지도로명주소"];
const PHONE_ALIASES = ["소재지전화", "전화번호", "대표전화"];
const STATUS_ALIASES = ["영업상태명", "영업상태", "상태명"];
const SOURCE_ID_ALIASES = ["관리번호", "인허가번호", "개방서비스명", "사업장일련번호"];
const LAT_ALIASES = ["위도", "lat", "latitude"];
const LNG_ALIASES = ["경도", "lng", "longitude"];

function normalizeFieldKey(value: string) {
  return value.replace(/\s+/g, "").replace(/[()/_-]/g, "").toLowerCase();
}

function getField(record: RawRecord, aliases: string[]) {
  const normalizedRecord = new Map(
    Object.entries(record).map(([key, value]) => [normalizeFieldKey(key), value])
  );

  for (const alias of aliases) {
    const value = normalizedRecord.get(normalizeFieldKey(alias));
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return normalizeText(String(value));
    }
  }

  return "";
}

function normalizeStatus(value: string) {
  return normalizeText(value).toUpperCase();
}

function isLikelyActive(status: string, config: LocalDataConfig) {
  if (config.includeInactive) return true;
  const normalized = normalizeStatus(status);
  if (!normalized) return true;
  return config.activeStatusKeywords.some((keyword) => normalized.includes(keyword.toUpperCase()));
}

async function fetchDatasetRows(sourceUrl: string): Promise<RawRecord[]> {
  const response = await withRetry(
    () => fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": `daengnyang-map/1.0 daily-sync ${process.env.SOURCE_CONTACT_EMAIL ?? ""}`.trim(),
        Accept: "application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,*/*",
      },
    }),
    2,
    1200
  );

  if (!response.ok) {
    throw new Error(`Official source download failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || sourceUrl.toLowerCase().endsWith(".json")) {
    const json = await response.json();
    if (Array.isArray(json)) return json as RawRecord[];
    if (Array.isArray((json as { data?: unknown }).data)) return (json as { data: RawRecord[] }).data;
    if (Array.isArray((json as { records?: unknown }).records)) return (json as { records: RawRecord[] }).records;
    return [];
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  return XLSX.utils.sheet_to_json<RawRecord>(workbook.Sheets[firstSheetName], { defval: "" });
}

function createSourceId(record: RawRecord, source: SyncSource, name: string, address: string) {
  const explicit = getField(record, SOURCE_ID_ALIASES);
  if (explicit) return explicit;

  return crypto.createHash("sha256").update(`${source}|${name}|${address}`).digest("hex");
}

async function normalizeLocalDataRecord(record: RawRecord, config: LocalDataConfig, sourceUrl: string) {
  const name = getField(record, NAME_ALIASES);
  const address = normalizeAddress(getField(record, ADDRESS_ALIASES));
  const roadAddress = normalizeAddress(getField(record, ROAD_ADDRESS_ALIASES) || address);
  const businessStatus = getField(record, STATUS_ALIASES);

  if (!name || !address) return null;
  if (!isLikelyActive(businessStatus, config)) return null;

  const explicitLat = Number(getField(record, LAT_ALIASES));
  const explicitLng = Number(getField(record, LNG_ALIASES));
  let lat = Number.isFinite(explicitLat) && explicitLat !== 0 ? explicitLat : null;
  let lng = Number.isFinite(explicitLng) && explicitLng !== 0 ? explicitLng : null;

  if ((!lat || !lng) && (roadAddress || address)) {
    const geocoded = await geocodeAddress({ address: roadAddress || address });
    lat = geocoded?.lat ?? null;
    lng = geocoded?.lng ?? null;
    if (geocoded) {
      await delay(80);
    }
  }

  return {
    category: config.category,
    name,
    normalizedName: normalizeText(name).toLowerCase(),
    sido: extractSido(roadAddress || address),
    sigungu: extractSigungu(roadAddress || address) ?? null,
    eupmyeondong: extractDong(roadAddress || address) ?? null,
    address,
    roadAddress,
    lat,
    lng,
    phone: getField(record, PHONE_ALIASES) || null,
    businessStatus: businessStatus || null,
    sourceType: "OFFICIAL_DATA" as const,
    sourceName: config.source,
    sourceUrl,
    sourceId: createSourceId(record, config.source, name, address),
  };
}

async function upsertLocalDataPlaces(config: LocalDataConfig, normalizedRows: Awaited<ReturnType<typeof normalizeLocalDataRecord>>[]) {
  const rows = normalizedRows.filter((row): row is NonNullable<typeof row> => Boolean(row));
  const now = new Date();
  const existingPlaces = await prisma.place.findMany({
    where: { sourceName: config.source },
    select: { id: true, sourceId: true, createdAt: true, firstSeenAt: true },
  });
  const existingMap = new Map(existingPlaces.map((place) => [place.sourceId, place]));

  const payload = rows.map((row) => {
    const existing = existingMap.get(row.sourceId);
    return {
      id: existing?.id ?? crypto.randomUUID(),
      ...row,
      sourceUpdatedAt: now.toISOString(),
      firstSeenAt: (existing?.firstSeenAt ?? now).toISOString(),
      lastSeenAt: now.toISOString(),
      ownerVerified: false,
      isActive: true,
      createdAt: (existing?.createdAt ?? now).toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  if (payload.length === 0) {
    const removed = await prisma.place.updateMany({
      where: { sourceName: config.source, isActive: true },
      data: { isActive: false, sourceUpdatedAt: now },
    });
    return { addedCount: 0, updatedCount: 0, removedCount: removed.count };
  }

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
    FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS record(
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

  const currentIds = rows.map((row) => row.sourceId);
  const removed = await prisma.place.updateMany({
    where: {
      sourceName: config.source,
      sourceId: { notIn: currentIds },
      isActive: true,
    },
    data: { isActive: false, sourceUpdatedAt: now },
  });

  const addedCount = payload.filter((item) => !existingMap.has(item.sourceId)).length;
  return {
    addedCount,
    updatedCount: payload.length - addedCount,
    removedCount: removed.count,
  };
}

export async function syncLocalDataCategory(config: LocalDataConfig, options: { force?: boolean } = {}) {
  const sourceUrl = process.env[config.urlEnvName]?.trim();

  return runManagedSync({
    source: config.source,
    sourceUrl: sourceUrl || "https://www.localdata.go.kr",
    force: options.force,
    skipWhenExternalSyncDisabled: true,
    runner: async () => {
      if (!sourceUrl) {
        return {
          totalCount: 0,
          addedCount: 0,
          updatedCount: 0,
          removedCount: 0,
          message: `${config.urlEnvName} 환경 변수가 비어 있어 ${config.sourceLabel} 공식 파일을 가져오지 못했습니다. URL을 넣으면 즉시 실제 배치 수집이 동작합니다.`,
          sourceUrl: "https://www.localdata.go.kr",
        };
      }

      const records = await fetchDatasetRows(sourceUrl);
      const normalizedRows = [] as Awaited<ReturnType<typeof normalizeLocalDataRecord>>[];

      for (const record of records) {
        normalizedRows.push(await normalizeLocalDataRecord(record, config, sourceUrl));
      }

      const counts = await upsertLocalDataPlaces(config, normalizedRows);
      return {
        totalCount: normalizedRows.filter(Boolean).length,
        addedCount: counts.addedCount,
        updatedCount: counts.updatedCount,
        removedCount: counts.removedCount,
        message: `${config.sourceLabel} 공식 파일 ${records.length.toLocaleString("ko-KR")}행을 읽어 ${normalizedRows.filter(Boolean).length.toLocaleString("ko-KR")}건을 내부 DB에 반영했습니다.`,
        sourceUrl,
      };
    },
  });
}