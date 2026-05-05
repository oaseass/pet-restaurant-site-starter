import { AdSlot } from "@/components/AdSlot";
import { CharacterImage } from "@/components/CharacterImage";
import { SmartLink } from "@/components/SmartLink";
import { SourceBadge } from "@/components/SourceBadge";
import { GUIDE_DOCS, type GuideDoc } from "@/lib/guide-content";
import { PLACE_CATEGORY_LABELS, QUICK_CATEGORIES } from "@/lib/platform-content";

const COMMON_NOTICE = "법령, 항공사·선사 규정, 병원 비용, 업체 운영정책은 시점과 업체에 따라 달라질 수 있습니다. 실제 이용 전 공식 기관 또는 업체에 다시 확인하세요.";

function getRelatedGuides(guide: GuideDoc) {
  const linkedGuideSlugs = new Set(
    guide.relatedLinks
      .map((link) => link.href.match(/^\/guide\/([^/?#]+)/)?.[1])
      .filter((slug): slug is string => Boolean(slug)),
  );

  const preferred = GUIDE_DOCS.filter((doc) => doc.slug !== guide.slug && (linkedGuideSlugs.has(doc.slug) || doc.category === guide.category));
  const fallback = GUIDE_DOCS.filter((doc) => doc.slug !== guide.slug && !preferred.some((item) => item.slug === doc.slug));

  return [...preferred, ...fallback].slice(0, 3);
}

export function GuideArticle({ guide }: { guide: GuideDoc }) {
  const character = QUICK_CATEGORIES.find((item) => item.category === guide.category)?.character ?? "cat-peeking";
  const categoryLabel = PLACE_CATEGORY_LABELS[guide.category] ?? "가이드";
  const relatedGuides = getRelatedGuides(guide);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-3 top-3 h-24 w-24 opacity-95 sm:h-28 sm:w-28">
          <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <SourceBadge label="관리자 검수형 가이드" tone="manual" />
            <SourceBadge label={categoryLabel} tone="official" />
            <SourceBadge label={`${guide.readMinutes}분 읽기`} tone="official" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">{guide.summary}</p>
          <p className="mt-4 text-sm font-black text-[var(--brand)]">최신 확인일 {guide.updatedAt}</p>
        </div>
      </section>

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">핵심 체크리스트</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#5f5550] sm:grid-cols-2">
          {guide.checklist.map((item) => (
            <li key={item} className="rounded-lg border border-[var(--line)] bg-[#fcfbf9] px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-4">
        {guide.sections.map((section) => (
          <article key={section.heading} className="card rounded-[1.25rem] p-6">
            <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-sm leading-8 text-[#5f5550] sm:text-[15px]">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 card rounded-[1.25rem] border-[#fed7aa] bg-[#fff7ed] p-6">
        <h2 className="text-xl font-black tracking-tight text-[#9a3412]">주의사항</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-[#7c2d12]">
          {guide.warnings.map((warning) => (
            <li key={warning}>· {warning}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">관련 장소 바로가기</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.relatedLinks.map((link) => (
            <SmartLink key={link.href} href={link.href} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-black text-white">
              {link.label}
            </SmartLink>
          ))}
        </div>
      </section>

      <section className="mt-6 card rounded-[1.25rem] p-6">
        <h2 className="text-xl font-black tracking-tight">관련 가이드 추천</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {relatedGuides.map((item) => (
            <SmartLink key={item.slug} href={`/guide/${item.slug}`} className="rounded-lg border border-[var(--line)] bg-white p-4 transition hover:border-[rgba(31,107,91,0.22)] hover:bg-[#f9faf8]">
              <p className="text-sm font-black text-[var(--ink)]">{item.title}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">{item.summary}</p>
            </SmartLink>
          ))}
        </div>
      </section>

      <AdSlot label={`${guide.title} 광고 영역`} />

      <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 text-sm leading-7 text-[var(--muted)]">
        <h2 className="text-base font-black text-[var(--ink)]">하단 공통 고지</h2>
        <p className="mt-3">{COMMON_NOTICE}</p>
      </section>
    </main>
  );
}