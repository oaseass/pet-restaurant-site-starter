import { prisma } from "@/lib/prisma";
import type { ExternalReviewLink } from "@/lib/external-review-links";

export const EXTERNAL_LINK_KIND_LABELS = {
  BLOG: "블로그",
  WEB: "웹문서",
  MAP: "지도 리뷰",
} as const;

export type ExternalLinkKindValue = keyof typeof EXTERNAL_LINK_KIND_LABELS;

const BLOG_HOSTS = new Set([
  "blog.naver.com",
  "m.blog.naver.com",
  "post.naver.com",
  "brunch.co.kr",
  "brunchstory.co.kr",
  "blog.daum.net",
  "story.kakao.com",
  "tistory.com",
]);

export function normalizeExternalLinkText(value: string | null | undefined, maxLength: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeExternalLinkKind(value?: string | null): ExternalLinkKindValue {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "BLOG" || normalized === "WEB" || normalized === "MAP") return normalized;
  return "WEB";
}

export function getExternalLinkSourceLabel(href: string) {
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

export function inferExternalLinkKindFromHref(href: string): ExternalLinkKindValue {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      hostname === "place.map.kakao.com" ||
      hostname === "map.naver.com" ||
      (hostname.includes("google.") && url.pathname.includes("/maps"))
    ) {
      return "MAP";
    }
    if (BLOG_HOSTS.has(hostname) || hostname.endsWith(".tistory.com")) return "BLOG";
  } catch {
    return "WEB";
  }

  return "WEB";
}

export function isAllowedExternalLinkHref(href: string) {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (hostname.includes("pet-restaurant-site-starter")) return false;
    if (hostname === "search.naver.com") return false;
    return true;
  } catch {
    return false;
  }
}

function toExternalReviewKind(kind: ExternalLinkKindValue): ExternalReviewLink["kind"] {
  if (kind === "BLOG") return "blog";
  if (kind === "MAP") return "map";
  return "web";
}

function toPublicExternalReviewLink(item: {
  title: string;
  href: string;
  sourceLabel: string;
  summary: string | null;
  publishedAt: Date | null;
  kind: ExternalLinkKindValue;
}): ExternalReviewLink {
  return {
    title: item.title,
    href: item.href,
    sourceLabel: item.sourceLabel,
    summary: item.summary ?? `${item.sourceLabel} 원문으로 이동해 현장 후기와 운영 정보를 직접 확인할 수 있어요.`,
    publishedAtLabel: item.publishedAt ? item.publishedAt.toLocaleDateString("ko-KR") : null,
    kind: toExternalReviewKind(item.kind),
    isApproved: true,
  };
}

export async function getApprovedExternalReviewLinks(targetType: "RESTAURANT" | "PLACE", targetId: string): Promise<ExternalReviewLink[]> {
  try {
    const items = await prisma.externalLinkSubmission.findMany({
      where: { targetType, targetId, status: "APPROVED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        title: true,
        href: true,
        sourceLabel: true,
        summary: true,
        publishedAt: true,
        kind: true,
      },
    });

    return items.map((item) => toPublicExternalReviewLink({
      title: item.title,
      href: item.href,
      sourceLabel: item.sourceLabel,
      summary: item.summary,
      publishedAt: item.publishedAt,
      kind: item.kind as ExternalLinkKindValue,
    }));
  } catch {
    return [];
  }
}