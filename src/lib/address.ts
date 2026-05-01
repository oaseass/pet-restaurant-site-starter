const SIDO_LIST = [
  "서울", "인천", "경기", "강원", "충북", "충남", "세종", "대전", "경북", "대구",
  "전북", "광주", "전남", "경남", "울산", "부산", "제주"
];

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeAddress(value: string) {
  return normalizeText(value)
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSido(regionOrAddress: string) {
  const text = normalizeText(regionOrAddress);
  const direct = SIDO_LIST.find((sido) => text.startsWith(sido) || text.includes(`${sido}광역시`) || text.includes(`${sido}특별시`));
  if (direct) return direct;

  if (text.includes("서울특별시")) return "서울";
  if (text.includes("부산광역시")) return "부산";
  if (text.includes("대구광역시")) return "대구";
  if (text.includes("인천광역시")) return "인천";
  if (text.includes("광주광역시")) return "광주";
  if (text.includes("대전광역시")) return "대전";
  if (text.includes("울산광역시")) return "울산";
  if (text.includes("세종특별자치시")) return "세종";
  if (text.includes("경기도")) return "경기";
  if (text.includes("강원")) return "강원";
  if (text.includes("충청북도")) return "충북";
  if (text.includes("충청남도")) return "충남";
  if (text.includes("전북") || text.includes("전라북도")) return "전북";
  if (text.includes("전남") || text.includes("전라남도")) return "전남";
  if (text.includes("경북") || text.includes("경상북도")) return "경북";
  if (text.includes("경남") || text.includes("경상남도")) return "경남";
  if (text.includes("제주")) return "제주";

  return text.split(" ")[0] || "기타";
}

export function extractSigungu(address: string) {
  const normalized = normalizeAddress(address);
  const match = normalized.match(/(?:특별시|광역시|특별자치시|도)\s+([^\s]+(?:시|군|구))/);
  if (match?.[1]) return match[1];
  const parts = normalized.split(" ");
  return parts.find((part) => /(?:시|군|구)$/.test(part) && !/(특별시|광역시|특별자치시)$/.test(part));
}

export function extractDong(address: string) {
  const normalized = normalizeAddress(address);
  const parts = normalized.split(" ");
  return parts.find((part) => /(?:동|읍|면|리)$/.test(part));
}
