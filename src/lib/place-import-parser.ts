import * as XLSX from "xlsx";
import { normalizeText, extractSido, extractSigungu, extractDong, normalizeAddress } from "@/lib/address";

export type ParsedPlaceRow = {
  name: string;
  address: string | null;
  roadAddress: string | null;
  sido: string | null;
  sigungu: string | null;
  eupmyeondong: string | null;
  normalizedAddress: string | null;
  phone: string | null;
  businessStatus: string | null;
  lat: number | null;
  lng: number | null;
  licenseDate: string | null;
  /** API import 시 원천 고유 ID (MNG_NO 등). 없으면 sha256 자동 생성. */
  sourceId?: string | null;
  /** API import 시 원천 업데이트 시각 */
  sourceUpdatedAt?: Date | null;
};

type RawRow = Record<string, unknown>;

/** 컬럼명 정규화: 공백·괄호·단위 제거 후 소문자 */
function normalizeKey(key: string): string {
  return key.replace(/[\s()（）㎡]/g, "").toLowerCase();
}

function cell(row: RawRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return normalizeText(String(value));
    }
  }
  return "";
}

function cellRaw(row: RawRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

/** 컬럼 alias 테이블 — 로컬데이터 표준 컬럼명 → ParsedPlaceRow 필드 */
const COLUMN_ALIASES: Record<string, (keyof ParsedPlaceRow)[]> = {
  사업장명: ["name"],
  업소명: ["name"],
  상호명: ["name"],
  사업장명칭: ["name"],
  시설명: ["name"],
  소재지전체주소: ["address"],
  소재지주소: ["address"],
  지번주소: ["address"],
  주소: ["address"],
  소재지: ["address"],
  도로명전체주소: ["roadAddress"],
  소재지도로명주소: ["roadAddress"],
  도로명주소: ["roadAddress"],
  도로명전체주소_: ["roadAddress"],
  시도명: ["sido"],
  시도: ["sido"],
  시군구명: ["sigungu"],
  시군구: ["sigungu"],
  소재지전화: ["phone"],
  전화번호: ["phone"],
  연락처: ["phone"],
  영업상태명: ["businessStatus"],
  영업상태: ["businessStatus"],
  상세영업상태명: ["businessStatus"],
  인허가일자: ["licenseDate"],
  허가일자: ["licenseDate"],
  위도: ["lat"],
  경도: ["lng"],
  좌표정보y: ["lat"],  // 좌표정보(Y) → lat (위도)
  좌표정보x: ["lng"],  // 좌표정보(X) → lng (경도)
  위도좌표: ["lat"],
  경도좌표: ["lng"],
};

function buildNormalizedKeyMap(rawRow: RawRow): Map<keyof ParsedPlaceRow, string> {
  const result = new Map<keyof ParsedPlaceRow, string>();
  for (const [rawKey, rawValue] of Object.entries(rawRow)) {
    const normalizedKey = normalizeKey(rawKey);
    const fieldNames = COLUMN_ALIASES[normalizedKey];
    if (!fieldNames) continue;
    const value = rawValue !== null && rawValue !== undefined ? String(rawValue).trim() : "";
    if (!value) continue;
    for (const field of fieldNames) {
      if (!result.has(field)) {
        result.set(field, normalizeText(value));
      }
    }
  }
  return result;
}

function parseCoord(value: string): number | null {
  const num = Number(value.replace(/[^\d.\-]/g, ""));
  if (!Number.isFinite(num) || num === 0) return null;
  return num;
}

function fromRawRow(rawRow: RawRow): ParsedPlaceRow | null {
  const fields = buildNormalizedKeyMap(rawRow);

  const name = fields.get("name") ?? "";
  if (!name || name.length < 2) return null;

  // 이름이 컬럼 헤더인 경우 스킵
  const nameNorm = normalizeText(name).toLowerCase();
  if (["사업장명", "업소명", "상호명", "번호", "연번", "no"].includes(nameNorm)) return null;

  const addressRaw = fields.get("address") ?? "";
  const roadAddressRaw = fields.get("roadAddress") ?? "";
  const sidoRaw = fields.get("sido") ?? "";
  const sigunguRaw = fields.get("sigungu") ?? "";
  const primaryAddress = roadAddressRaw || addressRaw;
  const normalizedAddr = primaryAddress ? normalizeAddress(primaryAddress) : null;

  // sido/sigungu: 필드가 있으면 사용, 없으면 주소에서 추출
  const sido = sidoRaw || (normalizedAddr ? extractSido(normalizedAddr) : null) || null;
  const sigungu = sigunguRaw || (normalizedAddr ? extractSigungu(normalizedAddr) : null) || null;
  const eupmyeondong = normalizedAddr ? extractDong(normalizedAddr) : null;

  const latRaw = fields.get("lat") ?? "";
  const lngRaw = fields.get("lng") ?? "";
  const lat = latRaw ? parseCoord(latRaw) : null;
  const lng = lngRaw ? parseCoord(lngRaw) : null;

  // 위도 범위 검증 (한국: 33~39, 경도: 124~132)
  const validLat = lat !== null && lat >= 33 && lat <= 39 ? lat : null;
  const validLng = lng !== null && lng >= 124 && lng <= 132 ? lng : null;

  return {
    name,
    address: addressRaw || null,
    roadAddress: roadAddressRaw || null,
    sido: sido || null,
    sigungu: sigungu || null,
    eupmyeondong: eupmyeondong || null,
    normalizedAddress: normalizedAddr,
    phone: fields.get("phone") ?? null,
    businessStatus: fields.get("businessStatus") ?? null,
    lat: validLat,
    lng: validLng,
    licenseDate: fields.get("licenseDate") ?? null,
  };
}

export type ParsePlaceFileResult = {
  rows: ParsedPlaceRow[];
  totalParsed: number;
  skippedCount: number;
  format: "csv" | "xlsx";
};

/** CSV 텍스트를 Row 배열로 파싱 */
function parseCsvToRows(text: string): RawRow[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // BOM 제거
  const firstLine = lines[0].replace(/^\uFEFF/, "");
  const headers = parseCsvLine(firstLine);
  if (headers.length === 0) return [];

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = parseCsvLine(line);
    const row: RawRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function detectFormat(buffer: Buffer): "csv" | "xlsx" | "unknown" {
  // XLSX/ZIP magic: PK (0x50 0x4B)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return "xlsx";
  // XLS magic: D0 CF 11 E0
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf) return "xlsx";
  // UTF-8 BOM or printable text → CSV
  if (buffer[0] === 0xef || buffer[0] < 128) return "csv";
  return "unknown";
}

export function parsePlaceFile(buffer: Buffer, hintFormat?: "csv" | "xlsx" | "json"): ParsePlaceFileResult {
  const format = hintFormat ?? detectFormat(buffer);
  let rawRows: RawRow[] = [];

  if (format === "xlsx") {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (sheetName) {
        const sheet = workbook.Sheets[sheetName];
        rawRows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
      }
    } catch {
      // XLSX 파싱 실패 시 CSV 시도
      const text = buffer.toString("utf8");
      rawRows = parseCsvToRows(text);
    }
  } else {
    // EUC-KR / UTF-8 둘 다 시도
    let text: string;
    try {
      const td = new TextDecoder("euc-kr");
      const decoded = td.decode(buffer);
      // EUC-KR 디코딩 성공 여부를 헤더 존재로 판단
      if (decoded.includes("사업장명") || decoded.includes("업소명") || decoded.includes("시도명")) {
        text = decoded;
      } else {
        text = buffer.toString("utf8");
      }
    } catch {
      text = buffer.toString("utf8");
    }
    rawRows = parseCsvToRows(text);
  }

  const parsed: ParsedPlaceRow[] = [];
  let skippedCount = 0;
  for (const raw of rawRows) {
    const row = fromRawRow(raw);
    if (row) parsed.push(row);
    else skippedCount++;
  }

  return {
    rows: parsed,
    totalParsed: rawRows.length,
    skippedCount,
    format: format === "xlsx" ? "xlsx" : "csv",
  };
}
