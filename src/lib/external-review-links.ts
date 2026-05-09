import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";

export type ExternalReviewCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

export type ExternalReviewLink = {
  title: string;
  href: string;
  sourceLabel: string;
  publishedAtLabel: string | null;
  summary: string;
  kind: "blog" | "web" | "map";
};

type ExternalReviewTarget = {
  name: string;
  category: ExternalReviewCategory;
  categoryLabel: string;
  regionLabel?: string | null;
  address?: string | null;
  enrichment?: BusinessEnrichmentEntry | null;
};

type NaverBlogItem = {
  title?: string;
  link?: string;
  postdate?: string;
};

type NaverWebItem = {
  title?: string;
  link?: string;
};

function isExternalReviewLink(value: ExternalReviewLink | null): value is ExternalReviewLink {
  return Boolean(value);
}

function getNaverSearchConfig() {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID?.trim() || process.env.NAVER_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET?.trim() || process.env.NAVER_CLIENT_SECRET?.trim() || "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeText(value: string | null | undefined) {
  return decodeHtmlEntities(stripHtmlTags(value ?? "")).replace(/\s+/g, " ").trim();
}

function formatPublishedAtLabel(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  if (/^\d{8}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("ko-KR");
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("ko-KR");
}

function getHostLabel(href: string) {
  try {
    const hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "blog.naver.com" || hostname === "m.blog.naver.com") return "네이버 블로그";
    if (hostname === "post.naver.com") return "네이버 포스트";
    if (hostname === "brunch.co.kr") return "브런치";
    if (hostname === "blog.daum.net") return "다음 블로그";
    if (hostname.endsWith(".tistory.com") || hostname === "tistory.com") return "티스토리";
    if (hostname === "place.map.kakao.com") return "카카오맵";
    if (hostname === "map.naver.com") return "네이버지도";
    if (hostname.includes("google.")) return "구글지도";
    return hostname;
  } catch {
    return "외부 사이트";
  }
}

function getCategoryFocus(category: ExternalReviewCategory) {
  if (category === "RESTAURANT") return "동반 조건과 좌석 분위기";
  if (category === "ANIMAL_HOSPITAL") return "진료 경험과 운영 분위기";
  if (category === "PHARMACY") return "구매 경험과 운영 여부";
  if (category === "GROOMING") return "견종별 예약 경험과 미용 분위기";
  if (category === "DAYCARE") return "입소 조건과 호텔링 경험";
  return "상담 절차와 이용 경험";
}

function buildGeneratedSummary(category: ExternalReviewCategory, sourceLabel: string, kind: ExternalReviewLink["kind"]) {
  if (kind === "map") return `${sourceLabel} 원문으로 이동해 평점, 사진, 이용자 리뷰를 직접 확인할 수 있어요.`;
  return `${sourceLabel} 원문으로 이동해 ${getCategoryFocus(category)}을 참고할 수 있어요.`;
}

function getCategorySearchHint(category: ExternalReviewCategory) {
  if (category === "RESTAURANT") return "반려견 동반 식당 후기";
  if (category === "ANIMAL_HOSPITAL") return "동물병원 후기";
  if (category === "PHARMACY") return "동물약국 후기";
  if (category === "GROOMING") return "애견미용 후기";
  if (category === "DAYCARE") return "반려견 유치원 호텔 후기";
  return "반려동물 장례 후기";
}

function buildSearchQuery(target: ExternalReviewTarget) {
  return [target.regionLabel?.replace(/·/g, " "), target.name, getCategorySearchHint(target.category)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAllowedExternalHref(href: string) {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (hostname.includes("pet-restaurant-site-starter")) return false;
    if (hostname === "map.naver.com" || hostname === "place.map.kakao.com") return false;
    if (hostname.includes("google.") && url.pathname.includes("/maps")) return false;
    if (hostname === "search.naver.com") return false;
    return true;
  } catch {
    return false;
  }
}

function getMapFallbackLinks(target: ExternalReviewTarget) {
  const enrichment = target.enrichment;
  if (!enrichment || enrichment.matchScore < 0.85) return [];

  const candidates = [
    { href: enrichment.kakaoPlaceUrl, title: `${target.name} 카카오맵 리뷰`, sourceLabel: "카카오맵" },
    { href: enrichment.naverPlaceUrl, title: `${target.name} 네이버지도 리뷰`, sourceLabel: "네이버지도" },
    { href: enrichment.googleMapsUri, title: `${target.name} 구글지도 리뷰`, sourceLabel: "구글지도" },
  ];

  return candidates
    .filter((item): item is { href: string; title: string; sourceLabel: string } => Boolean(item.href))
    .map((item) => ({
      href: item.href,
      title: item.title,
      sourceLabel: item.sourceLabel,
      publishedAtLabel: null,
      summary: buildGeneratedSummary(target.category, item.sourceLabel, "map"),
      kind: "map" as const,
    }));
}

async function fetchNaverItems<T>(path: "blog" | "webkr", query: string, display: number) {
  const config = getNaverSearchConfig();
  if (!config) return [] as T[];

  const response = await fetch(`https://openapi.naver.com/v1/search/${path}.json?query=${encodeURIComponent(query)}&display=${display}&sort=sim`, {
    headers: {
      "X-Naver-Client-Id": config.clientId,
      "X-Naver-Client-Secret": config.clientSecret,
    },
    next: { revalidate: 60 * 60 * 12 },
  });

  if (!response.ok) return [] as T[];
  const json = await response.json() as { items?: T[] };
  return json.items ?? [];
}

async function fetchNaverSearchLinks(target: ExternalReviewTarget) {
  const config = getNaverSearchConfig();
  if (!config) return [] as ExternalReviewLink[];

  const query = buildSearchQuery(target);
  if (!query) return [] as ExternalReviewLink[];

  try {
    const [blogItems, webItems] = await Promise.all([
      fetchNaverItems<NaverBlogItem>("blog", query, 3),
      fetchNaverItems<NaverWebItem>("webkr", query, 2),
    ]);

    const blogLinks = blogItems
      .map<ExternalReviewLink | null>((item) => {
        const href = item.link?.trim() ?? "";
        if (!isAllowedExternalHref(href)) return null;
        const title = normalizeText(item.title) || `${target.name} 후기`;
        const sourceLabel = getHostLabel(href);
        return {
          href,
          title,
          sourceLabel,
          publishedAtLabel: formatPublishedAtLabel(item.postdate),
          summary: buildGeneratedSummary(target.category, sourceLabel, "blog"),
          kind: "blog" as const,
        } satisfies ExternalReviewLink;
      })
      .filter(isExternalReviewLink);

    const webLinks = webItems
      .map<ExternalReviewLink | null>((item) => {
        const href = item.link?.trim() ?? "";
        if (!isAllowedExternalHref(href)) return null;
        const title = normalizeText(item.title) || `${target.name} 방문 후기`;
        const sourceLabel = getHostLabel(href);
        return {
          href,
          title,
          sourceLabel,
          publishedAtLabel: null,
          summary: buildGeneratedSummary(target.category, sourceLabel, "web"),
          kind: "web" as const,
        } satisfies ExternalReviewLink;
      })
      .filter(isExternalReviewLink);

    return [...blogLinks, ...webLinks];
  } catch {
    return [] as ExternalReviewLink[];
  }
}

export async function getExternalReviewLinks(target: ExternalReviewTarget) {
  const [searchLinks, mapLinks] = await Promise.all([
    fetchNaverSearchLinks(target),
    Promise.resolve(getMapFallbackLinks(target)),
  ]);

  const deduped = new Map<string, ExternalReviewLink>();
  for (const link of [...searchLinks, ...mapLinks]) {
    if (!deduped.has(link.href)) deduped.set(link.href, link);
  }
  return Array.from(deduped.values()).slice(0, 6);
}