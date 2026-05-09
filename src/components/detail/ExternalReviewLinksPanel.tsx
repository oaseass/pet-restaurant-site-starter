import { ExternalLink, Link2 } from "lucide-react";
import type { ExternalReviewLink } from "@/lib/external-review-links";

type ExternalReviewLinksPanelProps = {
  name: string;
  categoryLabel: string;
  links: ExternalReviewLink[];
};

function getKindLabel(kind: ExternalReviewLink["kind"]) {
  if (kind === "blog") return "블로그";
  if (kind === "web") return "웹문서";
  return "지도 리뷰";
}

export function ExternalReviewLinksPanel({ name, categoryLabel, links }: ExternalReviewLinksPanelProps) {
  if (links.length === 0) return null;

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Link2 size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">외부 후기 / 방문 리뷰 링크</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {name} 관련 원문 링크만 모아 보여드립니다. 글과 사진은 저장하지 않고, 새창으로 외부 사이트에 이동합니다.
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">{categoryLabel}을 찾는 보호자가 분위기와 이용 경험을 참고할 때만 쓰도록 정리했습니다.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {links.map((link) => (
          <article key={`${link.kind}:${link.href}`} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
              <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[var(--brand)]">{getKindLabel(link.kind)}</span>
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
    </section>
  );
}