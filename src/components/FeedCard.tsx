import Link from "next/link";
import { MapPin, ArrowRight, Share2 } from "lucide-react";

export type FeedCardItem = {
  id: string;
  category: string;
  region?: string;
  source?: string;
  title: string;
  description?: string;
  tags?: string[];
  href: string;
  mapHref?: string;
  reportHref?: string;
};

export function FeedCard({ item }: { item: FeedCardItem }) {
  return (
    <article
      className="border border-[var(--line)] bg-[var(--surface)] rounded-lg hover:border-[var(--line-strong)] transition-colors"
      style={{ padding: "10px 12px", marginBottom: "8px" }}
    >
      {/* meta row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-black text-[var(--brand)]">
          {item.category}
        </span>
        {item.region && (
          <>
            <span className="text-[var(--line-strong)]">·</span>
            <span className="text-[11px] font-bold text-[var(--muted)]">{item.region}</span>
          </>
        )}
        {item.source && (
          <>
            <span className="text-[var(--line-strong)]">·</span>
            <span className="text-[11px] text-[var(--muted)]">{item.source}</span>
          </>
        )}
      </div>

      {/* title */}
      <Link href={item.href}>
        <h3 className="text-[15px] font-black text-[var(--ink)] leading-snug hover:text-[var(--brand)] transition-colors">
          {item.title}
        </h3>
      </Link>

      {/* description */}
      {item.description && (
        <p className="mt-1 text-xs leading-5 text-[var(--muted)] line-clamp-2">
          {item.description}
        </p>
      )}

      {/* tags — max 3 */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* actions — no border-t, tight spacing */}
      <div className="mt-2 flex items-center gap-1">
        {item.mapHref && (
          <Link
            href={item.mapHref}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors"
          >
            <MapPin size={11} />
            지도
          </Link>
        )}
        <Link
          href={item.href}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowRight size={11} />
          상세
        </Link>
        {item.reportHref && (
          <Link
            href={item.reportHref}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors"
          >
            <Share2 size={11} />
            제보
          </Link>
        )}
      </div>
    </article>
  );
}
