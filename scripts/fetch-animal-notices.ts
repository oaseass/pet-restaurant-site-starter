import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

const SERVICE_KEY = "e1cf5def7f382f64c38d972dd0b3c17a07d078fb63ecfee0518b450febe592c7";
const BASE_URL = "https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

interface ApiNoticeItem {
  desertionNo?: string;
  noticeNo?: string;
  noticeSdt?: string;
  noticeEdt?: string;
  happenDt?: string;
  happenPlace?: string;
  kindCd?: string;
  kindNm?: string;
  colorCd?: string;
  age?: string;
  weight?: string;
  sexCd?: string;
  neuterYn?: string;
  specialMark?: string;
  careNm?: string;
  careTel?: string;
  careAddr?: string;
  orgNm?: string;
  popfile1?: string;
  popfile2?: string;
  processState?: string;
}

async function fetchPage(bgnde: string, endde: string, pageNo: number): Promise<{ items: ApiNoticeItem[]; totalCount: number }> {
  const url = `${BASE_URL}?serviceKey=${SERVICE_KEY}&_type=json&bgnde=${bgnde}&endde=${endde}&numOfRows=100&pageNo=${pageNo}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const body = data?.response?.body;
  if (!body) throw new Error("응답 구조 오류");
  const totalCount = Number(body.totalCount ?? 0);
  const rawItems = body.items?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  return { items: items as ApiNoticeItem[], totalCount };
}

async function main() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const bgnde = formatDate(startDate);
  const endde = formatDate(endDate);

  console.log(`[fetch-animal-notices] 조회 기간: ${bgnde} ~ ${endde}`);

  const { items: firstPageItems, totalCount } = await fetchPage(bgnde, endde, 1);
  const totalPages = Math.ceil(totalCount / 100);
  console.log(`[fetch-animal-notices] 전체 ${totalCount}건 (${totalPages}페이지)`);

  const allItems: ApiNoticeItem[] = [...firstPageItems];
  for (let page = 2; page <= totalPages; page++) {
    console.log(`[fetch-animal-notices] 페이지 ${page}/${totalPages} 요청 중...`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { items } = await fetchPage(bgnde, endde, page);
    allItems.push(...items);
  }

  const notices = allItems.map((item) => ({
    desertionNo: item.desertionNo ?? "",
    noticeNo: item.noticeNo ?? "",
    noticeSdt: item.noticeSdt ?? "",
    noticeEdt: item.noticeEdt ?? "",
    happenDt: item.happenDt ?? "",
    happenPlace: item.happenPlace ?? "",
    kindCd: item.kindNm ?? item.kindCd ?? "",
    colorCd: item.colorCd ?? "",
    age: item.age ?? "",
    weight: item.weight ?? "",
    sexCd: item.sexCd ?? "",
    neuterYn: item.neuterYn ?? "",
    specialMark: item.specialMark ?? "",
    careNm: item.careNm ?? "",
    careTel: item.careTel ?? "",
    careAddr: item.careAddr ?? "",
    orgNm: item.orgNm ?? "",
    popfile: item.popfile1 ?? "",
    processState: item.processState ?? "",
  }));

  const byStateMap = new Map<string, number>();
  for (const notice of notices) {
    const state = notice.processState || "미분류";
    byStateMap.set(state, (byStateMap.get(state) ?? 0) + 1);
  }

  const counts = {
    total: notices.length,
    byState: Array.from(byStateMap.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count),
    fetchedAt: new Date().toISOString(),
  };

  const outputDir = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outputDir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputDir, "animal-notices.json"), JSON.stringify(notices, null, 2)),
    fs.writeFile(path.join(outputDir, "animal-notice-counts.json"), JSON.stringify(counts, null, 2)),
  ]);

  console.log(JSON.stringify({ total: notices.length, byState: counts.byState, fetchedAt: counts.fetchedAt }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
