import * as cheerio from "cheerio";
import * as XLSX from "xlsx";
import crypto from "crypto";
import { extractDong, extractSido, extractSigungu, normalizeAddress, normalizeText } from "@/lib/address";

export type SourceRestaurant = {
  sourceKey: string;
  name: string;
  businessType: string;
  sido: string;
  sigungu?: string;
  eupmyeondong?: string;
  address: string;
  normalizedAddress: string;
};

const BUSINESS_TYPES = ["일반음식점", "휴게음식점", "제과점", "위탁급식영업", "집단급식소", "식품접객업"];
const HEADER_NAME_VALUES = new Set(["업소명", "업체명", "상호명", "연번"]);
const HEADER_TYPE_VALUES = new Set(["업종", "업태", "업종명"]);
const HEADER_REGION_VALUES = new Set(["지역", "시도", "시·도"]);
const HEADER_ADDRESS_VALUES = new Set(["업소주소", "주소", "소재지", "영업소재지"]);

function makeSourceKey(row: Pick<SourceRestaurant, "name" | "businessType" | "normalizedAddress">) {
  return crypto
    .createHash("sha256")
    .update(`${row.name}|${row.businessType}|${row.normalizedAddress}`)
    .digest("hex");
}

function cleanCell(value: unknown) {
  return normalizeText(String(value ?? ""));
}

function fromRawRow(raw: Record<string, unknown>): SourceRestaurant | null {
  const normalizedKeys = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [normalizeText(key), value])
  );

  const name = cleanCell(
    normalizedKeys["업소명"] ?? normalizedKeys["업체명"] ?? normalizedKeys["상호명"]
  );
  const businessType = cleanCell(
    normalizedKeys["업종"] ?? normalizedKeys["업태"] ?? normalizedKeys["업종명"]
  );
  const region = cleanCell(normalizedKeys["지역"] ?? normalizedKeys["시도"] ?? normalizedKeys["시·도"]);
  const address = cleanCell(
    normalizedKeys["업소주소"] ?? normalizedKeys["주소"] ?? normalizedKeys["소재지"] ?? normalizedKeys["영업소재지"]
  );

  if (!name || !businessType || !address) return null;
  if (
    HEADER_NAME_VALUES.has(name) ||
    HEADER_TYPE_VALUES.has(businessType) ||
    HEADER_REGION_VALUES.has(region) ||
    HEADER_ADDRESS_VALUES.has(address)
  ) {
    return null;
  }

  const normalizedAddress = normalizeAddress(address);
  const sido = extractSido(region || normalizedAddress);
  const sigungu = extractSigungu(normalizedAddress);
  const eupmyeondong = extractDong(normalizedAddress);

  return {
    sourceKey: makeSourceKey({ name, businessType, normalizedAddress }),
    name,
    businessType,
    sido,
    sigungu,
    eupmyeondong,
    address,
    normalizedAddress,
  };
}

export function parseRestaurantsFromXlsx(buffer: Buffer): SourceRestaurant[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const parsed = rows.map(fromRawRow).filter((row): row is SourceRestaurant => Boolean(row));

  return dedupe(parsed);
}

export function parseRestaurantsFromHtml(html: string): SourceRestaurant[] {
  const $ = cheerio.load(html);
  const tableRows: SourceRestaurant[] = [];

  $("tr").each((_, tr) => {
    const cells = $(tr)
      .find("th,td")
      .map((__, cell) => normalizeText($(cell).text()))
      .get()
      .filter(Boolean);

    if (cells.length < 4) return;

    const maybeNo = /^\d+$/.test(cells[0]) ? cells[0] : "";
    const offset = maybeNo ? 1 : 0;
    const row = fromRawRow({
      업소명: cells[offset],
      업종: cells[offset + 1],
      지역: cells[offset + 2],
      업소주소: cells.slice(offset + 3).join(" "),
    });
    if (row) tableRows.push(row);
  });

  if (tableRows.length > 0) return dedupe(tableRows);

  const lines = $.text()
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean);

  const textRows: SourceRestaurant[] = [];

  for (const line of lines) {
    const noMatch = line.match(/^\d+\s+(.+)$/);
    if (!noMatch) continue;

    const withoutNo = noMatch[1];
    const type = BUSINESS_TYPES.find((candidate) => withoutNo.includes(` ${candidate} `));
    if (!type) continue;

    const [namePart, afterTypeRaw] = withoutNo.split(` ${type} `);
    const afterType = normalizeText(afterTypeRaw ?? "");
    const region = extractSido(afterType);
    const address = afterType.replace(new RegExp(`^${region}\\s+`), "");

    const row = fromRawRow({
      업소명: namePart,
      업종: type,
      지역: region,
      업소주소: address,
    });
    if (row) textRows.push(row);
  }

  return dedupe(textRows);
}

function dedupe(rows: SourceRestaurant[]) {
  const map = new Map<string, SourceRestaurant>();
  for (const row of rows) map.set(row.sourceKey, row);
  return [...map.values()];
}
