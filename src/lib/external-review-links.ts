import * as cheerio from "cheerio";
import { unstable_cache } from "next/cache";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";
import { getApprovedExternalReviewLinks } from "@/lib/external-link-submissions";
import { buildPlaceExperienceQueries, getPlaceExperienceFocus, inferPlaceExperienceCategory, type PlaceExperienceCategory } from "@/lib/place-experience";

export type ExternalReviewCategory = PlaceExperienceCategory;

export type ExternalReviewLink = {
  title: string;
  href: string;
  sourceLabel: string;
  publishedAtLabel: string | null;
  summary: string;
  kind: "blog" | "web" | "map";
  isApproved?: boolean;
};

type ExternalReviewTarget = {
  targetType?: "RESTAURANT" | "PLACE";
  targetId?: string;
  name: string;
  category: string;
  categoryLabel: string;
  regionLabel?: string | null;
  address?: string | null;
  enrichment?: BusinessEnrichmentEntry | null;
};

type NaverBlogItem = {
  title?: string;
  link?: string;
  postdate?: string;
  description?: string;
};

type NaverWebItem = {
  title?: string;
  link?: string;
  description?: string;
};

type ParsedHtmlReviewLink = {
  title: string;
  href: string;
  kind: ExternalReviewLink["kind"];
  contextText?: string;
};

type RankedHtmlReviewLink = ParsedHtmlReviewLink & {
  hostname: string;
  sourceRank: number;
  originalIndex: number;
};

const BLOG_HOSTNAMES = new Set([
  "blog.naver.com",
  "m.blog.naver.com",
  "post.naver.com",
  "brunch.co.kr",
  "brunchstory.co.kr",
  "blog.daum.net",
  "story.kakao.com",
  "tistory.com",
  "velog.io",
  "medium.com",
  "substack.com",
]);

const MAX_HTML_LINKS = 6;
const MAX_LINKS_PER_HOST = 2;
const NAME_MATCH_STOPWORDS = new Set([
  "애견",
  "반려",
  "반려견",
  "반려동물",
  "강아지",
  "고양이",
  "펫",
  "카페",
  "호텔",
  "펜션",
  "식당",
  "맛집",
  "동반",
  "병원",
  "약국",
  "미용",
  "유치원",
  "훈련",
  "장례",
  "센터",
  "스토어",
  "샵",
]);
const REGION_SUFFIXES = ["특별시", "광역시", "자치시", "도", "시", "군", "구", "읍", "면", "동", "로", "길"] as const;
const ADDRESS_DETAIL_SUFFIXES = ["읍", "면", "동", "로", "길"] as const;
const EXTERNAL_REVIEW_CACHE_VERSION = "2026-05-09b";

type AutomaticExternalReviewCandidate = ExternalReviewLink & {
  contextText?: string | null;
};

type ExternalReviewCandidateMatch = {
  score: number;
  hasExactNameMatch: boolean;
  matchedNameTokenCount: number;
  hasRegionMatch: boolean;
  hasDetailAddressMatch: boolean;
  keepPrimary: boolean;
  keepFallback: boolean;
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

function normalizeCompactText(value: string | null | undefined) {
  return normalizeText(value).toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
}

function tokenizeMatchText(value: string | null | undefined) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function expandRegionToken(token: string) {
  const variants = new Set<string>();
  const normalized = token.trim().toLowerCase();
  if (!normalized || normalized.length < 2) return variants;

  variants.add(normalized);
  for (const suffix of REGION_SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 1) {
      variants.add(normalized.slice(0, -suffix.length));
    }
  }
  return variants;
}

function getMeaningfulNameTokens(name: string) {
  const tokens = tokenizeMatchText(name)
    .filter((token) => token.length >= 2)
    .filter((token) => !NAME_MATCH_STOPWORDS.has(token));

  if (tokens.length > 0) return Array.from(new Set(tokens));

  const compactName = normalizeCompactText(name);
  return compactName.length >= 2 ? [compactName] : [];
}

function getRegionTokens(target: Pick<ExternalReviewTarget, "regionLabel" | "address">) {
  const tokens = new Set<string>();
  const regionText = [target.regionLabel, target.address].filter(Boolean).join(" ");
  const rawTokens = tokenizeMatchText(regionText).slice(0, 6);

  for (const token of rawTokens) {
    for (const variant of expandRegionToken(token)) {
      if (variant.length >= 2) tokens.add(variant);
    }
  }

  return Array.from(tokens);
}

function getAddressDetailTokens(target: Pick<ExternalReviewTarget, "regionLabel" | "address">) {
  const tokens = new Set<string>();
  const regionTokens = new Set(tokenizeMatchText(target.regionLabel));
  const rawAddressTokens = tokenizeMatchText(target.address).slice(0, 8);

  for (const token of rawAddressTokens) {
    if (token.length < 2 || /^\d+$/.test(token)) continue;

    const isRegionDuplicate = regionTokens.has(token);
    const isDetailLike = ADDRESS_DETAIL_SUFFIXES.some((suffix) => token.endsWith(suffix)) || (!isRegionDuplicate && token.length >= 3);
    if (!isDetailLike) continue;

    for (const variant of expandRegionToken(token)) {
      if (variant.length >= 2) tokens.add(variant);
    }
  }

  return Array.from(tokens);
}

function matchesAnyLocationToken(tokens: string[], tokenizedCombined: string[], compactCombined: string) {
  return tokens.some((token) => tokenizedCombined.some((item) => item.includes(token)) || compactCombined.includes(normalizeCompactText(token)));
}

function isGenericTargetName(name: string) {
  const compactName = normalizeCompactText(name);
  const tokens = getMeaningfulNameTokens(name);
  return tokens.length <= 1 && compactName.length <= 5;
}

export function evaluateExternalReviewCandidateMatch(
  target: Pick<ExternalReviewTarget, "name" | "regionLabel" | "address">,
  candidate: Pick<AutomaticExternalReviewCandidate, "title" | "href" | "contextText">,
): ExternalReviewCandidateMatch {
  const compactTargetName = normalizeCompactText(target.name);
  const meaningfulNameTokens = getMeaningfulNameTokens(target.name);
  const combinedText = [candidate.title, candidate.contextText ?? "", candidate.href].join(" ");
  const compactCombined = normalizeCompactText(combinedText);
  const tokenizedCombined = tokenizeMatchText(combinedText);
  const regionTokens = getRegionTokens(target);
  const detailAddressTokens = getAddressDetailTokens(target);
  const hasExactNameMatch = compactTargetName.length >= 2 && compactCombined.includes(compactTargetName);
  const matchedNameTokenCount = meaningfulNameTokens.filter((token) => compactCombined.includes(normalizeCompactText(token))).length;
  const hasBroadRegionMatch = matchesAnyLocationToken(regionTokens, tokenizedCombined, compactCombined);
  const hasDetailAddressMatch = matchesAnyLocationToken(detailAddressTokens, tokenizedCombined, compactCombined);
  const hasRegionMatch = hasBroadRegionMatch || hasDetailAddressMatch;
  const genericTargetName = isGenericTargetName(target.name);
  const requiresDetailAddressMatch = genericTargetName && detailAddressTokens.length > 0;
  const nameMatchThreshold = Math.min(2, Math.max(1, meaningfulNameTokens.length));
  const hasMeaningfulNameMatch = hasExactNameMatch || matchedNameTokenCount >= nameMatchThreshold;
  const hasAnyLocationSignal = regionTokens.length === 0 || hasRegionMatch;
  const satisfiesGenericLocation = !requiresDetailAddressMatch ? hasAnyLocationSignal : hasDetailAddressMatch;
  const score = (hasExactNameMatch ? 8 : 0) + matchedNameTokenCount * 2 + (hasBroadRegionMatch ? 2 : 0) + (hasDetailAddressMatch ? 4 : 0);
  const keepPrimary = hasExactNameMatch && (!genericTargetName || hasDetailAddressMatch || (!requiresDetailAddressMatch && hasBroadRegionMatch) || matchedNameTokenCount >= 2);
  const keepFallback = hasMeaningfulNameMatch
    && score >= (genericTargetName ? (requiresDetailAddressMatch ? 10 : 8) : 6)
    && (!genericTargetName || satisfiesGenericLocation || matchedNameTokenCount >= 2);

  return {
    score,
    hasExactNameMatch,
    matchedNameTokenCount,
    hasRegionMatch,
    hasDetailAddressMatch,
    keepPrimary,
    keepFallback,
  };
}

function getAutomaticSourcePriority(link: Pick<ExternalReviewLink, "href" | "kind">) {
  return getHtmlSourceRank(getNormalizedHostname(link.href)) + (link.kind === "blog" ? 2 : link.kind === "web" ? 1 : 0);
}

export function rankAutomaticExternalReviewLinks(
  target: Pick<ExternalReviewTarget, "name" | "regionLabel" | "address">,
  candidates: AutomaticExternalReviewCandidate[],
) {
  const evaluated = candidates
    .map((candidate) => ({
      candidate,
      match: evaluateExternalReviewCandidateMatch(target, candidate),
      sourcePriority: getAutomaticSourcePriority(candidate),
    }))
    .filter((item) => item.match.keepFallback)
    .sort((left, right) => {
      if (Number(right.match.keepPrimary) !== Number(left.match.keepPrimary)) {
        return Number(right.match.keepPrimary) - Number(left.match.keepPrimary);
      }
      if (right.match.score !== left.match.score) return right.match.score - left.match.score;
      return right.sourcePriority - left.sourcePriority;
    });

  const deduped = new Map<string, ExternalReviewLink>();
  for (const { candidate } of evaluated) {
    if (!deduped.has(candidate.href)) {
      const { contextText: _contextText, ...publicLink } = candidate;
      deduped.set(candidate.href, publicLink);
    }
  }

  return Array.from(deduped.values()).slice(0, MAX_HTML_LINKS);
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
    if (hostname === "brunch.co.kr" || hostname === "brunchstory.co.kr") return "브런치";
    if (hostname === "blog.daum.net") return "다음 블로그";
    if (hostname === "story.kakao.com") return "카카오스토리";
    if (hostname.endsWith(".tistory.com") || hostname === "tistory.com") return "티스토리";
    if (hostname === "place.map.kakao.com") return "카카오맵";
    if (hostname === "map.naver.com") return "네이버지도";
    if (hostname.includes("google.")) return "구글지도";
    return hostname;
  } catch {
    return "외부 사이트";
  }
}

function normalizeHref(value: string) {
  return value.replace(/&amp;/g, "&").trim();
}

function getNormalizedHostname(href: string) {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getHtmlSourceRank(hostname: string) {
  if (!hostname) return 0;
  if (hostname === "brunch.co.kr" || hostname === "brunchstory.co.kr") return 5;
  if (hostname === "tistory.com" || hostname.endsWith(".tistory.com")) return 5;
  if (hostname === "story.kakao.com") return 4;
  if (hostname === "velog.io" || hostname === "medium.com" || hostname.endsWith(".substack.com")) return 4;
  if (hostname === "post.naver.com" || hostname === "blog.daum.net") return 3;
  if (hostname === "blog.naver.com" || hostname === "m.blog.naver.com") return 2;
  if (hostname.includes("blog")) return 1;
  return 0;
}

function rankHtmlReviewLinks(links: ParsedHtmlReviewLink[]) {
  const ranked = links
    .map<RankedHtmlReviewLink>((link, index) => ({
      ...link,
      hostname: getNormalizedHostname(link.href),
      sourceRank: getHtmlSourceRank(getNormalizedHostname(link.href)),
      originalIndex: index,
    }))
    .sort((left, right) => right.sourceRank - left.sourceRank || left.originalIndex - right.originalIndex);

  const selected: RankedHtmlReviewLink[] = [];
  const perHostCount = new Map<string, number>();

  for (const link of ranked) {
    const currentCount = perHostCount.get(link.hostname) ?? 0;
    if (currentCount >= MAX_LINKS_PER_HOST) continue;
    selected.push(link);
    perHostCount.set(link.hostname, currentCount + 1);
    if (selected.length >= MAX_HTML_LINKS) {
      return selected.map(({ hostname: _hostname, sourceRank: _sourceRank, originalIndex: _originalIndex, ...item }) => item);
    }
  }

  for (const link of ranked) {
    if (selected.some((item) => item.href === link.href)) continue;
    selected.push(link);
    if (selected.length >= MAX_HTML_LINKS) break;
  }

  return selected.map(({ hostname: _hostname, sourceRank: _sourceRank, originalIndex: _originalIndex, ...item }) => item);
}

function isBlogLikeHref(href: string) {
  try {
    const hostname = getNormalizedHostname(href);
    return BLOG_HOSTNAMES.has(hostname)
      || hostname.endsWith(".tistory.com")
      || hostname.endsWith(".substack.com")
      || hostname.includes("blog");
  } catch {
    return false;
  }
}

function isLikelyArticleHref(href: string) {
  try {
    const url = new URL(href);
    const hostname = getNormalizedHostname(href);
    const segments = url.pathname.split("/").filter(Boolean);

    if (hostname === "blog.naver.com" || hostname === "m.blog.naver.com") {
      return url.searchParams.has("logNo") || segments.length >= 2;
    }

    if (hostname === "post.naver.com") {
      return segments.length >= 2;
    }

    if (hostname === "brunch.co.kr" || hostname === "brunchstory.co.kr") {
      return segments.length >= 2 || url.pathname.startsWith("/@");
    }

    if (hostname === "story.kakao.com") {
      return segments.length >= 2 || url.searchParams.has("profile_id");
    }

    if (hostname === "blog.daum.net" || hostname === "tistory.com" || hostname.endsWith(".tistory.com") || hostname.endsWith(".substack.com") || hostname === "medium.com" || hostname === "velog.io") {
      return segments.length >= 1;
    }

    return segments.length >= 1;
  } catch {
    return false;
  }
}

function isUsefulHtmlLinkTitle(value: string) {
  if (!value) return false;
  if (value.length < 6) return false;
  if (/^\d+$/.test(value)) return false;
  if (value === "Image" || value === "favicon") return false;
  return true;
}

export function extractExternalReviewLinksFromNaverHtml(html: string) {
  const $ = cheerio.load(html);
  const deduped = new Map<string, ParsedHtmlReviewLink>();

  $("a[href]").each((_, element) => {
    const rawHref = $(element).attr("href") ?? "";
    const href = normalizeHref(rawHref.startsWith("/") ? new URL(rawHref, "https://search.naver.com").toString() : rawHref);
    if (!isAllowedExternalHref(href) || !isBlogLikeHref(href) || !isLikelyArticleHref(href)) return;

    const title = normalizeText($(element).text());
    if (!isUsefulHtmlLinkTitle(title)) return;

    const contextText = normalizeText([
      $(element).parent().text(),
      $(element).parent().parent().text(),
    ].join(" "));

    const kind: ExternalReviewLink["kind"] = "blog";
    if (!deduped.has(href)) {
      deduped.set(href, { title, href, kind, contextText });
    }
  });

  return rankHtmlReviewLinks(Array.from(deduped.values()));
}

export function mergeExternalReviewLinksByPriority({
  approvedLinks,
  searchLinks,
  mapLinks,
}: {
  approvedLinks: ExternalReviewLink[];
  searchLinks: ExternalReviewLink[];
  mapLinks: ExternalReviewLink[];
}) {
  const approvedDeduped = new Map<string, ExternalReviewLink>();
  for (const link of approvedLinks) {
    if (!approvedDeduped.has(link.href)) approvedDeduped.set(link.href, link);
  }

  const pinnedApproved = Array.from(approvedDeduped.values());
  const pinnedHrefSet = new Set(pinnedApproved.map((link) => link.href));
  const remaining = new Map<string, ExternalReviewLink>();

  for (const link of [...searchLinks, ...mapLinks]) {
    if (pinnedHrefSet.has(link.href) || remaining.has(link.href)) continue;
    remaining.set(link.href, link);
  }

  return [...pinnedApproved, ...Array.from(remaining.values())].slice(0, MAX_HTML_LINKS);
}

function resolveExternalReviewCategory(target: ExternalReviewTarget): ExternalReviewCategory {
  return inferPlaceExperienceCategory({
    baseCategory: target.category,
    name: target.name,
    categoryLabel: target.categoryLabel,
    externalCategory: target.enrichment?.externalCategory ?? target.enrichment?.naverCategory ?? target.enrichment?.googlePrimaryType ?? null,
  });
}

function buildGeneratedSummary(category: ExternalReviewCategory, sourceLabel: string, kind: ExternalReviewLink["kind"]) {
  if (kind === "map") return `${sourceLabel} 원문으로 이동해 평점, 사진, 이용자 리뷰를 직접 확인할 수 있어요.`;
  return `${sourceLabel} 원문으로 이동해 ${getPlaceExperienceFocus(category)}을 참고할 수 있어요.`;
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
  const category = resolveExternalReviewCategory(target);

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
      summary: buildGeneratedSummary(category, item.sourceLabel, "map"),
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
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) return [] as T[];
  const json = await response.json() as { items?: T[] };
  return json.items ?? [];
}

async function fetchNaverHtmlSearchLinks(target: ExternalReviewTarget, category: ExternalReviewCategory, queries: string[]) {
  const candidates: AutomaticExternalReviewCandidate[] = [];

  for (const query of queries) {
    const response = await fetch(`https://search.naver.com/search.naver?where=blog&sm=tab_opt&query=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) continue;

    const html = await response.text();
    const parsed = extractExternalReviewLinksFromNaverHtml(html);
    for (const item of parsed) {
      const sourceLabel = getHostLabel(item.href);
      candidates.push({
        href: item.href,
        title: item.title,
        sourceLabel,
        publishedAtLabel: null,
        summary: buildGeneratedSummary(category, sourceLabel, item.kind),
        kind: item.kind,
        isApproved: false,
        contextText: item.contextText ?? null,
      });
      if (candidates.length >= MAX_HTML_LINKS * queries.length) break;
    }
  }

  return rankAutomaticExternalReviewLinks(target, candidates);
}

async function fetchNaverSearchLinks(target: ExternalReviewTarget) {
  const category = resolveExternalReviewCategory(target);
  const queries = buildPlaceExperienceQueries({
    category,
    placeName: target.name,
    regionLabel: target.regionLabel,
    address: target.address,
  }).slice(0, 3);
  if (queries.length === 0) return [] as ExternalReviewLink[];

  const config = getNaverSearchConfig();

  if (!config) {
    try {
      return await fetchNaverHtmlSearchLinks(target, category, queries.slice(0, 2));
    } catch {
      return [] as ExternalReviewLink[];
    }
  }

  try {
    const blogItems: NaverBlogItem[] = [];
    const webItems: NaverWebItem[] = [];

    for (const query of queries) {
      const [nextBlogItems, nextWebItems] = await Promise.all([
        fetchNaverItems<NaverBlogItem>("blog", query, 2),
        fetchNaverItems<NaverWebItem>("webkr", query, 2),
      ]);
      blogItems.push(...nextBlogItems);
      webItems.push(...nextWebItems);
      if (blogItems.length + webItems.length >= 8) break;
    }

    const blogLinks = blogItems
      .map<AutomaticExternalReviewCandidate | null>((item) => {
        const href = item.link?.trim() ?? "";
        if (!isAllowedExternalHref(href)) return null;
        const title = normalizeText(item.title) || `${target.name} 후기`;
        const sourceLabel = getHostLabel(href);
        return {
          href,
          title,
          sourceLabel,
          publishedAtLabel: formatPublishedAtLabel(item.postdate),
          summary: buildGeneratedSummary(category, sourceLabel, "blog"),
          kind: "blog" as const,
          isApproved: false,
          contextText: normalizeText(item.description),
        } satisfies AutomaticExternalReviewCandidate;
      })
      .filter(isExternalReviewLink);

    const webLinks = webItems
      .map<AutomaticExternalReviewCandidate | null>((item) => {
        const href = item.link?.trim() ?? "";
        if (!isAllowedExternalHref(href)) return null;
        const title = normalizeText(item.title) || `${target.name} 방문 후기`;
        const sourceLabel = getHostLabel(href);
        return {
          href,
          title,
          sourceLabel,
          publishedAtLabel: null,
          summary: buildGeneratedSummary(category, sourceLabel, "web"),
          kind: "web" as const,
          isApproved: false,
          contextText: normalizeText(item.description),
        } satisfies AutomaticExternalReviewCandidate;
      })
      .filter(isExternalReviewLink);

    const directLinks = rankAutomaticExternalReviewLinks(target, [...blogLinks, ...webLinks]);
    if (directLinks.length > 0) return directLinks;

    return await fetchNaverHtmlSearchLinks(target, category, queries.slice(0, 2));
  } catch {
    try {
      return await fetchNaverHtmlSearchLinks(target, category, queries.slice(0, 2));
    } catch {
      return [] as ExternalReviewLink[];
    }
  }
}

export async function getExternalReviewLinks(target: ExternalReviewTarget) {
  const category = resolveExternalReviewCategory(target);
  const cacheKey = [
    EXTERNAL_REVIEW_CACHE_VERSION,
    target.targetType ?? "",
    target.targetId ?? "",
    target.name,
    target.category,
    target.categoryLabel,
    category,
    target.regionLabel ?? "",
    target.address ?? "",
    target.enrichment?.kakaoPlaceUrl ?? "",
    target.enrichment?.naverPlaceUrl ?? "",
    target.enrichment?.googleMapsUri ?? "",
  ].join("|");

  return unstable_cache(
    async () => {
      const [approvedLinks, searchLinks, mapLinks] = await Promise.all([
        target.targetType && target.targetId ? getApprovedExternalReviewLinks(target.targetType, target.targetId) : Promise.resolve([]),
        fetchNaverSearchLinks(target),
        Promise.resolve(getMapFallbackLinks(target)),
      ]);

      return mergeExternalReviewLinksByPriority({ approvedLinks, searchLinks, mapLinks });
    },
    [`external-review-links:${cacheKey}`],
    { revalidate: 60 * 60 * 24 },
  )();
}