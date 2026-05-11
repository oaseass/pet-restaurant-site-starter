import { ExternalLink, Link2 } from "lucide-react";
import type { ExternalReviewLink } from "@/lib/external-review-links";
import { buildPlaceExperienceQueries, getPlaceExperienceChecklist, inferPlaceExperienceCategory, type PlaceExperienceCategory } from "@/lib/place-experience";

export type ExternalReviewSearchShortcut = {
  title: string;
  href: string;
  sourceLabel: string;
  summary: string;
};

const GENERIC_REVIEW_QUERIES = new Set([
  "반려견 동반",
  "애견동반",
  "반려동물 동반",
  "강아지 동반",
  "반려동물 가능",
]);

type ExternalReviewLinksPanelProps = {
  name: string;
  categoryLabel: string;
  category?: string | PlaceExperienceCategory;
  regionLabel?: string | null;
  address?: string | null;
  links: ExternalReviewLink[];
};

function getKindLabel(kind: ExternalReviewLink["kind"]) {
  if (kind === "blog") return "블로그";
  if (kind === "web") return "웹문서";
  return "지도 리뷰";
}

function pickPreferredSearchQuery(name: string, queries: string[]) {
  const normalizedName = name.trim();

  return queries.find((query) => {
    const suffix = query.replace(normalizedName, "").trim();
    return suffix && !GENERIC_REVIEW_QUERIES.has(suffix);
  }) ?? queries[0] ?? normalizedName;
}

export function buildExternalReviewSearchShortcuts({
  name,
  categoryLabel,
  category,
  regionLabel,
  address,
}: Omit<ExternalReviewLinksPanelProps, "links">): ExternalReviewSearchShortcut[] {
  const resolvedCategory = category
    ? inferPlaceExperienceCategory({ baseCategory: category, name, categoryLabel })
    : inferPlaceExperienceCategory({ name, categoryLabel });
  const queries = buildPlaceExperienceQueries({
    category: resolvedCategory,
    placeName: name,
    regionLabel,
    address,
  });
  const query = pickPreferredSearchQuery(name, queries) || [name, regionLabel, categoryLabel].filter(Boolean).join(" ").trim();

  if (!query) return [];

  return [
    {
      title: `${name} 네이버 블로그 검색`,
      href: `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(query)}`,
      sourceLabel: "네이버 블로그 검색",
      summary: `${categoryLabel} 관련 블로그 원문을 더 찾아볼 수 있어요.`,
    },
    {
      title: `${name} 다음 블로그 검색`,
      href: `https://search.daum.net/search?w=blog&q=${encodeURIComponent(query)}`,
      sourceLabel: "다음 블로그 검색",
      summary: `네이버 외 블로그 후기까지 함께 확인할 수 있어요.`,
    },
    {
      title: `${name} 구글 검색`,
      href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      sourceLabel: "구글 검색",
      summary: `개인 블로그와 웹문서를 넓게 다시 찾아볼 수 있어요.`,
    },
  ];
}

export function ExternalReviewLinksPanel({ name, categoryLabel, category, regionLabel, address, links }: ExternalReviewLinksPanelProps) {
  const searchShortcuts = buildExternalReviewSearchShortcuts({ name, categoryLabel, category, regionLabel, address });
  if (links.length === 0 && searchShortcuts.length === 0) return null;

  const resolvedCategory = category
    ? inferPlaceExperienceCategory({ baseCategory: category, name, categoryLabel })
    : null;
  const checklist = resolvedCategory ? getPlaceExperienceChecklist(resolvedCategory) : [];

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Link2 size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">외부 후기 원문</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            실제 방문 사진, 분위기, 동반 조건을 더 확인하고 싶을 때 참고할 수 있는 외부 원문 링크입니다. 저작권은 각 작성자와 플랫폼에 있습니다.
          </p>
          <p className="mt-1 text-xs font-bold leading-6 text-[var(--muted)]">승인된 원문 링크가 적으면 업체명과 카테고리를 반영한 검색 바로가기도 함께 제공합니다.</p>
          <p className="mt-1 text-xs font-bold leading-6 text-[var(--muted)]">{name}의 영업 여부, 요금, 동반 조건, 객실 정책은 바뀔 수 있으니 원문과 업체 안내를 함께 확인하는 편이 안전합니다.</p>
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">후기 내용은 참고용이며 최종 조건은 업체 안내가 우선입니다.</p>
        </div>
      </div>

      {checklist.length > 0 ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#fcfaf7] p-4">
          <h3 className="text-sm font-black text-[var(--ink)]">펜션 방문 전 확인사항</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
            {checklist.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      ) : null}

      {links.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {links.map((link) => (
            <article key={`${link.kind}:${link.href}`} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[var(--brand)]">{getKindLabel(link.kind)}</span>
                {link.isApproved ? <span className="rounded-full bg-[rgba(31,74,64,0.12)] px-2.5 py-1 text-[#1f4a40]">검수 승인</span> : null}
                <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[var(--muted)]">출처: {link.sourceLabel}</span>
                {link.publishedAtLabel ? <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[var(--muted)]">작성일: {link.publishedAtLabel}</span> : null}
              </div>
              <h3 className="mt-3 text-base font-black tracking-tight text-[var(--ink)]">{link.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{link.summary}</p>
              <a href={link.href} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                <ExternalLink size={14} />
                원문 새창으로 보기
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[#fcfaf7] p-4 text-sm leading-7 text-[var(--muted)]">
          바로 보여줄 원문 링크가 아직 부족해, 아래 검색 바로가기부터 먼저 제공합니다.
        </div>
      )}

      {searchShortcuts.length > 0 ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#fcfaf7] p-4">
          <h3 className="text-sm font-black text-[var(--ink)]">직접 더 찾아보기</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {searchShortcuts.map((shortcut) => (
              <article key={shortcut.href} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <p className="text-[11px] font-black text-[var(--brand)]">{shortcut.sourceLabel}</p>
                <h4 className="mt-2 text-sm font-black tracking-tight text-[var(--ink)]">{shortcut.title}</h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{shortcut.summary}</p>
                <a href={shortcut.href} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                  <ExternalLink size={14} />
                  검색 결과 열기
                </a>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}