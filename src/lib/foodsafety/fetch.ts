import * as cheerio from "cheerio";
import { parseRestaurantsFromHtml, parseRestaurantsFromXlsx, SourceRestaurant } from "./parse";

const DEFAULT_SOURCE_URL = "https://www.foodsafetykorea.go.kr/portal/petKorea.do";

function absolutizeUrl(href: string, baseUrl: string) {
  return new URL(href, baseUrl).toString();
}

async function fetchWithTimeout(url: string, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": `pet-restaurant-site/0.1 daily-sync ${process.env.SOURCE_CONTACT_EMAIL ?? ""}`.trim(),
        "Accept": "text/html,application/xhtml+xml,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function findXlsxUrl(html: string, sourceUrl: string) {
  const $ = cheerio.load(html);
  const links = $("a")
    .map((_, a) => ({ href: $(a).attr("href") ?? "", text: $(a).text() }))
    .get();

  const match = links.find((link) => /xlsx/i.test(link.href) || /xlsx|excel|엑셀/i.test(link.text));
  if (!match?.href) return null;

  // Ignore javascript-only download links. In that case HTML parsing fallback is safer.
  if (/^javascript:/i.test(match.href)) return null;
  return absolutizeUrl(match.href, sourceUrl);
}

export async function fetchFoodSafetyRestaurants(): Promise<{
  rows: SourceRestaurant[];
  sourceUrl: string;
  mode: "xlsx" | "html";
}> {
  const sourceUrl = process.env.FOODSAFETY_SOURCE_URL || DEFAULT_SOURCE_URL;
  const pageResponse = await fetchWithTimeout(sourceUrl);

  if (!pageResponse.ok) {
    throw new Error(`Official source page failed: ${pageResponse.status} ${pageResponse.statusText}`);
  }

  const html = await pageResponse.text();
  const xlsxUrl = findXlsxUrl(html, sourceUrl);

  if (xlsxUrl) {
    const fileResponse = await fetchWithTimeout(xlsxUrl);
    if (fileResponse.ok) {
      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      const rows = parseRestaurantsFromXlsx(buffer);
      if (rows.length > 0) return { rows, sourceUrl, mode: "xlsx" };
    }
  }

  const rows = parseRestaurantsFromHtml(html);
  return { rows, sourceUrl, mode: "html" };
}
