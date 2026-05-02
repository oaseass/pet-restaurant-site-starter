import crypto from "crypto";
import { PlaceCategory, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { extractDong, extractSido, extractSigungu, normalizeAddress, normalizeText } from "@/lib/address";
import { prisma } from "@/lib/prisma";

const SHEET_NAME = "places_upload";
const TEMPLATE_FILE_NAME = "daengnyang-manual-place-upload-template.xlsx";

export const MANUAL_PLACE_TEMPLATE_FILE_NAME = TEMPLATE_FILE_NAME;
export const MANUAL_IMPORT_SUPPORTED_CATEGORIES = ["PET_RESTAURANT", "ANIMAL_HOSPITAL", "GROOMING", "DAYCARE", "FUNERAL"] as const satisfies readonly PlaceCategory[];

export const MANUAL_PLACE_TEMPLATE_COLUMNS = [
  { key: "sourceId", label: "고정 식별자", required: "권장", description: "같은 업소를 다시 업데이트할 때 동일한 값을 유지합니다. 비우면 category+name+address 기준으로 자동 생성됩니다." },
  { key: "category", label: "카테고리", required: "필수", description: "ANIMAL_HOSPITAL, GROOMING, DAYCARE, FUNERAL 등 PlaceCategory 값만 허용합니다." },
  { key: "name", label: "업소명", required: "필수", description: "화면에 노출될 장소 이름입니다." },
  { key: "address", label: "지번/대표 주소", required: "선택", description: "비워두면 기존 값을 유지합니다. CLEAR 입력 시 주소를 비웁니다." },
  { key: "roadAddress", label: "도로명 주소", required: "선택", description: "비워두면 기존 값을 유지합니다. 주소가 바뀌면 시도/시군구/동도 함께 자동 재계산됩니다." },
  { key: "phone", label: "전화번호", required: "선택", description: "비워두면 기존 값을 유지합니다. CLEAR 입력 시 전화번호를 비웁니다." },
  { key: "lat", label: "위도", required: "선택", description: "숫자만 입력합니다. 빈칸이면 기존 값 유지, CLEAR이면 삭제합니다." },
  { key: "lng", label: "경도", required: "선택", description: "숫자만 입력합니다. 빈칸이면 기존 값 유지, CLEAR이면 삭제합니다." },
  { key: "isActive", label: "활성 여부", required: "선택", description: "TRUE/FALSE, Y/N, 1/0, 예/아니오를 허용합니다. 빈칸이면 기존 값 유지, 신규는 TRUE 처리됩니다." },
  { key: "ownerVerified", label: "업체 인증", required: "선택", description: "TRUE/FALSE 형식. 빈칸이면 기존 값 유지됩니다." },
  { key: "businessStatus", label: "운영상태", required: "선택", description: "예: 정상영업, 휴업, 리뉴얼 준비중" },
  { key: "description", label: "설명", required: "선택", description: "PlaceProfile.description에 저장됩니다." },
  { key: "openingHours", label: "운영시간", required: "선택", description: "PlaceProfile.openingHours에 저장됩니다." },
  { key: "priceText", label: "가격 메모", required: "선택", description: "PlaceProfile.priceText에 저장됩니다." },
  { key: "reservationUrl", label: "예약 URL", required: "선택", description: "예약 또는 공식 상세 페이지 주소를 넣습니다." },
  { key: "serviceTags", label: "서비스 태그", required: "선택", description: "쉼표로 구분합니다. 예: 24시,주차,대형견" },
  { key: "parkingAvailable", label: "주차 가능", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "largeDogAllowed", label: "대형견 가능", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "catAllowed", label: "고양이 가능", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "indoorAllowed", label: "실내 가능", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "outdoorAllowed", label: "실외 가능", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "leashRequired", label: "리드줄 필수", required: "선택", description: "TRUE/FALSE 형식" },
  { key: "cageRequired", label: "케이지 필수", required: "선택", description: "TRUE/FALSE 형식" },
] as const;

type RawRow = Record<string, unknown>;

type NullableField<T> = T | null | undefined;

export type ManualPlaceImportRow = {
  rowNumber: number;
  sourceId: string;
  category: PlaceCategory;
  name: string;
  normalizedName: string;
  address: NullableField<string>;
  roadAddress: NullableField<string>;
  phone: NullableField<string>;
  lat: NullableField<number>;
  lng: NullableField<number>;
  isActive: NullableField<boolean>;
  ownerVerified: NullableField<boolean>;
  businessStatus: NullableField<string>;
  description: NullableField<string>;
  openingHours: NullableField<string>;
  priceText: NullableField<string>;
  reservationUrl: NullableField<string>;
  serviceTags: NullableField<string[]>;
  parkingAvailable: NullableField<boolean>;
  largeDogAllowed: NullableField<boolean>;
  catAllowed: NullableField<boolean>;
  indoorAllowed: NullableField<boolean>;
  outdoorAllowed: NullableField<boolean>;
  leashRequired: NullableField<boolean>;
  cageRequired: NullableField<boolean>;
};

export type ManualPlacePreviewRow = {
  rowNumber: number;
  sourceId: string;
  category: PlaceCategory;
  name: string;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  businessStatus: string | null;
  action: "CREATE" | "UPDATE";
};

export type ManualPlacePreviewResult = {
  totalRows: number;
  addedCount: number;
  updatedCount: number;
  categories: PlaceCategory[];
  rows: ManualPlaceImportRow[];
  previewRows: ManualPlacePreviewRow[];
};

type ExistingManualPlace = {
  id: string;
  sourceId: string | null;
  address: string | null;
  roadAddress: string | null;
  ownerVerified: boolean;
  isActive: boolean;
};

export type ManualPlaceUploadResult = {
  totalRows: number;
  addedCount: number;
  updatedCount: number;
  deactivatedCount: number;
  profileUpdatedCount: number;
  categories: PlaceCategory[];
};

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").replace(/[_-]/g, "").toLowerCase();
}

function readCell(record: RawRow, field: string) {
  const normalized = normalizeHeader(field);

  for (const [key, value] of Object.entries(record)) {
    if (normalizeHeader(key) === normalized) {
      return value;
    }
  }

  return undefined;
}

function asText(value: unknown) {
  return normalizeText(String(value ?? ""));
}

function isBlank(value: unknown) {
  return asText(value) === "";
}

function parseTextField(value: unknown): string | null | undefined {
  const text = asText(value);
  if (!text) return undefined;
  if (["CLEAR", "NULL", "삭제", "비움"].includes(text.toUpperCase())) return null;
  return text;
}

function parseBooleanField(value: unknown): boolean | null | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const upper = text.toUpperCase();
  if (["CLEAR", "NULL", "삭제", "비움"].includes(upper)) return null;
  if (["TRUE", "T", "Y", "YES", "1", "예", "사용", "활성"].includes(upper)) return true;
  if (["FALSE", "F", "N", "NO", "0", "아니오", "미사용", "비활성"].includes(upper)) return false;
  throw new Error(`불린 값 해석 실패: ${text}`);
}

function parseNumberField(value: unknown): number | null | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const upper = text.toUpperCase();
  if (["CLEAR", "NULL", "삭제", "비움"].includes(upper)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    throw new Error(`숫자 값 해석 실패: ${text}`);
  }
  return parsed;
}

function parseStringArrayField(value: unknown): string[] | null | undefined {
  const text = asText(value);
  if (!text) return undefined;
  const upper = text.toUpperCase();
  if (["CLEAR", "NULL", "삭제", "비움"].includes(upper)) return null;
  return text.split(",").map((item) => normalizeText(item)).filter(Boolean);
}

function isEmptyRow(record: RawRow) {
  return Object.values(record).every((value) => isBlank(value));
}

function createManualSourceId(category: PlaceCategory, name: string, address: string, rowNumber: number) {
  return crypto.createHash("sha256").update(`${category}|${name}|${address || `row-${rowNumber}`}`).digest("hex");
}

function resolveRegionField(explicitValue: string | null | undefined, derivedValue: string | null | undefined, currentValue: string | null | undefined) {
  if (explicitValue !== undefined) return explicitValue;
  if (derivedValue !== undefined) return derivedValue;
  return currentValue;
}

function parseWorkbookRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.Sheets[SHEET_NAME] ? SHEET_NAME : workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("업로드 파일에 시트가 없습니다.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  if (rows.length === 0) {
    throw new Error("업로드 파일에 데이터 행이 없습니다.");
  }

  return rows.filter((row) => !isEmptyRow(row));
}

function parseCategory(value: unknown, rowNumber: number) {
  const text = asText(value).toUpperCase();
  if (!text) {
    throw new Error(`${rowNumber}행: category는 필수입니다.`);
  }
  const allowed = Object.values(PlaceCategory);
  if (!allowed.includes(text as PlaceCategory)) {
    throw new Error(`${rowNumber}행: 지원하지 않는 category입니다. (${text})`);
  }
  return text as PlaceCategory;
}

function parseManualPlaceRows(records: RawRow[]) {
  const parsedRows = [] as ManualPlaceImportRow[];
  const errors = [] as string[];
  const seenSourceIds = new Set<string>();

  records.forEach((record, index) => {
    const rowNumber = index + 2;

    try {
      const category = parseCategory(readCell(record, "category"), rowNumber);
      const name = normalizeText(asText(readCell(record, "name")));
      if (!name) {
        throw new Error(`${rowNumber}행: name은 필수입니다.`);
      }

      const address = parseTextField(readCell(record, "address"));
      const roadAddress = parseTextField(readCell(record, "roadAddress"));
      const identifierBase = normalizeAddress((roadAddress ?? address ?? asText(readCell(record, "phone"))) || "");
      const sourceId = normalizeText(asText(readCell(record, "sourceId"))) || createManualSourceId(category, name, identifierBase, rowNumber);

      if (seenSourceIds.has(sourceId)) {
        throw new Error(`${rowNumber}행: sourceId가 파일 안에서 중복됩니다. (${sourceId})`);
      }
      seenSourceIds.add(sourceId);

      parsedRows.push({
        rowNumber,
        sourceId,
        category,
        name,
        normalizedName: normalizeText(name).toLowerCase(),
        address: address ? normalizeAddress(address) : address,
        roadAddress: roadAddress ? normalizeAddress(roadAddress) : roadAddress,
        phone: parseTextField(readCell(record, "phone")),
        lat: parseNumberField(readCell(record, "lat")),
        lng: parseNumberField(readCell(record, "lng")),
        isActive: parseBooleanField(readCell(record, "isActive")),
        ownerVerified: parseBooleanField(readCell(record, "ownerVerified")),
        businessStatus: parseTextField(readCell(record, "businessStatus")),
        description: parseTextField(readCell(record, "description")),
        openingHours: parseTextField(readCell(record, "openingHours")),
        priceText: parseTextField(readCell(record, "priceText")),
        reservationUrl: parseTextField(readCell(record, "reservationUrl")),
        serviceTags: parseStringArrayField(readCell(record, "serviceTags")),
        parkingAvailable: parseBooleanField(readCell(record, "parkingAvailable")),
        largeDogAllowed: parseBooleanField(readCell(record, "largeDogAllowed")),
        catAllowed: parseBooleanField(readCell(record, "catAllowed")),
        indoorAllowed: parseBooleanField(readCell(record, "indoorAllowed")),
        outdoorAllowed: parseBooleanField(readCell(record, "outdoorAllowed")),
        leashRequired: parseBooleanField(readCell(record, "leashRequired")),
        cageRequired: parseBooleanField(readCell(record, "cageRequired")),
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.slice(0, 12).join(" | "));
  }

  return parsedRows;
}

function assertSupportedManualImportRows(
  rows: ManualPlaceImportRow[],
  supportedCategories: readonly PlaceCategory[],
  expectedCategory?: PlaceCategory | null,
) {
  const supportedSet = new Set(supportedCategories);

  for (const row of rows) {
    if (!supportedSet.has(row.category)) {
      throw new Error(`${row.rowNumber}행: ${row.category} 카테고리는 이 import 흐름에서 지원하지 않습니다.`);
    }

    if (expectedCategory && row.category !== expectedCategory) {
      throw new Error(`${row.rowNumber}행: 선택한 카테고리(${expectedCategory})와 파일 category 값이 다릅니다.`);
    }
  }
}

async function getExistingManualPlaceMap(sourceIds: string[]) {
  const existingPlaces = await prisma.place.findMany({
    where: {
      sourceType: "MANUAL_DATA",
      sourceId: { in: sourceIds },
    },
    select: {
      id: true,
      sourceId: true,
      address: true,
      roadAddress: true,
      ownerVerified: true,
      isActive: true,
    },
  });

  return new Map(existingPlaces.map((place) => [place.sourceId ?? "", place]));
}

export async function previewManualPlaceWorkbook(input: {
  buffer: Buffer;
  supportedCategories?: readonly PlaceCategory[];
  expectedCategory?: PlaceCategory | null;
}) {
  const workbookRows = parseWorkbookRows(input.buffer);
  const rows = parseManualPlaceRows(workbookRows);
  const supportedCategories = input.supportedCategories ?? MANUAL_IMPORT_SUPPORTED_CATEGORIES;

  assertSupportedManualImportRows(rows, supportedCategories, input.expectedCategory);

  const existingMap = await getExistingManualPlaceMap(rows.map((row) => row.sourceId));
  const previewRows = rows.map((row) => ({
    rowNumber: row.rowNumber,
    sourceId: row.sourceId,
    category: row.category,
    name: row.name,
    address: row.address ?? null,
    roadAddress: row.roadAddress ?? null,
    phone: row.phone ?? null,
    businessStatus: row.businessStatus ?? null,
    action: existingMap.has(row.sourceId) ? "UPDATE" : "CREATE",
  } satisfies ManualPlacePreviewRow));

  return {
    totalRows: rows.length,
    addedCount: previewRows.filter((row) => row.action === "CREATE").length,
    updatedCount: previewRows.filter((row) => row.action === "UPDATE").length,
    categories: Array.from(new Set(rows.map((row) => row.category))),
    rows,
    previewRows,
  } satisfies ManualPlacePreviewResult;
}

export function createManualPlaceApprovalToken(rows: ManualPlaceImportRow[]) {
  const adminSecret = normalizeText(process.env.ADMIN_SECRET ?? "");
  if (!adminSecret) {
    throw new Error("ADMIN_SECRET이 설정되어 있지 않습니다.");
  }

  return crypto.createHmac("sha256", adminSecret).update(JSON.stringify(rows)).digest("hex");
}

export function isManualPlaceApprovalTokenValid(rows: ManualPlaceImportRow[], token: string) {
  const normalizedToken = normalizeText(token);
  if (!normalizedToken) return false;

  const expected = createManualPlaceApprovalToken(rows);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(normalizedToken);

  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function applyManualPlaceImportRows(
  rows: ManualPlaceImportRow[],
  options: {
    supportedCategories?: readonly PlaceCategory[];
    expectedCategory?: PlaceCategory | null;
  } = {},
) {
  const supportedCategories = options.supportedCategories ?? MANUAL_IMPORT_SUPPORTED_CATEGORIES;
  assertSupportedManualImportRows(rows, supportedCategories, options.expectedCategory);

  const sourceIds = rows.map((row) => row.sourceId);
  const existingMap = await getExistingManualPlaceMap(sourceIds);
  const now = new Date();
  let addedCount = 0;
  let updatedCount = 0;
  let deactivatedCount = 0;
  let profileUpdatedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = existingMap.get(row.sourceId) as ExistingManualPlace | undefined;
      const resolvedAddress = row.address !== undefined
        ? row.address
        : row.roadAddress !== undefined
          ? row.roadAddress
          : existing?.roadAddress ?? existing?.address ?? null;
      const resolvedRoadAddress = row.roadAddress !== undefined ? row.roadAddress : existing?.roadAddress ?? null;
      const addressForRegion = resolvedRoadAddress ?? resolvedAddress ?? null;
      const derivedSido = row.address !== undefined || row.roadAddress !== undefined
        ? (addressForRegion ? extractSido(addressForRegion) : null)
        : undefined;
      const derivedSigungu = row.address !== undefined || row.roadAddress !== undefined
        ? (addressForRegion ? extractSigungu(addressForRegion) ?? null : null)
        : undefined;
      const derivedDong = row.address !== undefined || row.roadAddress !== undefined
        ? (addressForRegion ? extractDong(addressForRegion) ?? null : null)
        : undefined;

      const nextIsActive = row.isActive !== undefined ? (row.isActive ?? false) : existing?.isActive ?? true;
      const nextOwnerVerified = row.ownerVerified !== undefined ? (row.ownerVerified ?? false) : existing?.ownerVerified ?? false;

      const place = await tx.place.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: "MANUAL_DATA",
            sourceId: row.sourceId,
          },
        },
        update: {
          category: row.category,
          name: row.name,
          normalizedName: row.normalizedName,
          address: row.address,
          roadAddress: row.roadAddress,
          phone: row.phone,
          lat: row.lat,
          lng: row.lng,
          businessStatus: row.businessStatus,
          sido: resolveRegionField(undefined, derivedSido, undefined),
          sigungu: resolveRegionField(undefined, derivedSigungu, undefined),
          eupmyeondong: resolveRegionField(undefined, derivedDong, undefined),
          ownerVerified: nextOwnerVerified,
          isActive: nextIsActive,
          sourceName: null,
          sourceUrl: null,
          sourceUpdatedAt: now,
          lastSeenAt: now,
        },
        create: {
          category: row.category,
          name: row.name,
          normalizedName: row.normalizedName,
          address: row.address ?? null,
          roadAddress: row.roadAddress ?? null,
          phone: row.phone ?? null,
          lat: row.lat ?? null,
          lng: row.lng ?? null,
          businessStatus: row.businessStatus ?? null,
          sido: derivedSido ?? (addressForRegion ? extractSido(addressForRegion) : null),
          sigungu: derivedSigungu ?? (addressForRegion ? extractSigungu(addressForRegion) ?? null : null),
          eupmyeondong: derivedDong ?? (addressForRegion ? extractDong(addressForRegion) ?? null : null),
          sourceType: "MANUAL_DATA",
          sourceName: null,
          sourceUrl: null,
          sourceId: row.sourceId,
          sourceUpdatedAt: now,
          lastSeenAt: now,
          ownerVerified: nextOwnerVerified,
          isActive: nextIsActive,
        },
      });

      if (existing) {
        updatedCount += 1;
      } else {
        addedCount += 1;
      }

      if (nextIsActive === false) {
        deactivatedCount += 1;
      }

      const profileFields = {
        description: row.description,
        openingHours: row.openingHours,
        priceText: row.priceText,
        reservationUrl: row.reservationUrl,
        serviceTags: row.serviceTags,
        parkingAvailable: row.parkingAvailable,
        largeDogAllowed: row.largeDogAllowed,
        catAllowed: row.catAllowed,
        indoorAllowed: row.indoorAllowed,
        outdoorAllowed: row.outdoorAllowed,
        leashRequired: row.leashRequired,
        cageRequired: row.cageRequired,
      };

      if (Object.values(profileFields).some((value) => value !== undefined)) {
        await tx.placeProfile.upsert({
          where: { placeId: place.id },
          update: {
            description: row.description,
            openingHours: row.openingHours,
            priceText: row.priceText,
            reservationUrl: row.reservationUrl,
            serviceTags: row.serviceTags === undefined ? undefined : row.serviceTags === null ? Prisma.DbNull : row.serviceTags,
            parkingAvailable: row.parkingAvailable,
            largeDogAllowed: row.largeDogAllowed,
            catAllowed: row.catAllowed,
            indoorAllowed: row.indoorAllowed,
            outdoorAllowed: row.outdoorAllowed,
            leashRequired: row.leashRequired,
            cageRequired: row.cageRequired,
            ownerUpdatedAt: now,
          },
          create: {
            placeId: place.id,
            description: row.description ?? null,
            openingHours: row.openingHours ?? null,
            priceText: row.priceText ?? null,
            reservationUrl: row.reservationUrl ?? null,
            serviceTags: row.serviceTags === undefined ? undefined : row.serviceTags === null ? Prisma.DbNull : row.serviceTags,
            parkingAvailable: row.parkingAvailable ?? null,
            largeDogAllowed: row.largeDogAllowed ?? null,
            catAllowed: row.catAllowed ?? null,
            indoorAllowed: row.indoorAllowed ?? null,
            outdoorAllowed: row.outdoorAllowed ?? null,
            leashRequired: row.leashRequired ?? null,
            cageRequired: row.cageRequired ?? null,
            ownerUpdatedAt: now,
          },
        });
        profileUpdatedCount += 1;
      }
    }
  });

  return {
    totalRows: rows.length,
    addedCount,
    updatedCount,
    deactivatedCount,
    profileUpdatedCount,
    categories: Array.from(new Set(rows.map((row) => row.category))),
  } satisfies ManualPlaceUploadResult;
}

export async function importManualPlaceWorkbook(input: { buffer: Buffer }) {
  const preview = await previewManualPlaceWorkbook({
    buffer: input.buffer,
    supportedCategories: Object.values(PlaceCategory),
  });

  return applyManualPlaceImportRows(preview.rows, {
    supportedCategories: Object.values(PlaceCategory),
  });
}

export function buildManualPlaceTemplateBuffer() {
  const workbook = XLSX.utils.book_new();

  const templateRows = [
    {
      sourceId: "manual-animal-hospital-seoul-001",
      category: "ANIMAL_HOSPITAL",
      name: "댕냥 동물의료센터",
      address: "서울특별시 마포구 양화로 45",
      roadAddress: "서울특별시 마포구 양화로 45",
      phone: "02-1234-5678",
      lat: 37.5501,
      lng: 126.9138,
      isActive: "TRUE",
      ownerVerified: "TRUE",
      businessStatus: "정상영업",
      description: "24시간 응급 대응, 고양이 진료 가능",
      openingHours: "매일 00:00-24:00",
      priceText: "초진 25,000원부터",
      reservationUrl: "https://example.com/reserve",
      serviceTags: "24시,응급,주차",
      parkingAvailable: "TRUE",
      largeDogAllowed: "TRUE",
      catAllowed: "TRUE",
      indoorAllowed: "TRUE",
      outdoorAllowed: "FALSE",
      leashRequired: "TRUE",
      cageRequired: "FALSE",
    },
  ];

  const instructionRows: Array<{ field: string; required: string; description: string }> = MANUAL_PLACE_TEMPLATE_COLUMNS.map((column) => ({
    field: column.key,
    required: column.required,
    description: column.description,
  }));
  instructionRows.push({ field: "blank rule", required: "-", description: "빈칸은 기존 값 유지입니다. CLEAR 또는 NULL은 값 삭제입니다." });
  instructionRows.push({ field: "category values", required: "-", description: Object.values(PlaceCategory).join(", ") });

  const templateSheet = XLSX.utils.json_to_sheet(templateRows, {
    header: MANUAL_PLACE_TEMPLATE_COLUMNS.map((column) => column.key),
  });
  const instructionSheet = XLSX.utils.json_to_sheet(instructionRows);

  XLSX.utils.book_append_sheet(workbook, templateSheet, SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "instructions");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
}