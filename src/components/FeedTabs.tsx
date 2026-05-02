import Link from "next/link";

const FEED_TABS = [
  { label: "전체", href: "/" },
  { label: "식당", href: "/restaurants" },
  { label: "병원", href: "/hospitals" },
  { label: "미용", href: "/grooming" },
  { label: "찾아요", href: "/lost-pets" },
  { label: "가이드", href: "/guide" },
] as const;

export function FeedTabs() {
  return (
    <div
      className="border-b border-[var(--line)] bg-[var(--surface)]"
      style={{ marginBottom: "12px" }}
    >
      <div
        className="flex overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FEED_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="shrink-0 border-b-2 border-transparent px-4 py-2.5 text-sm font-bold text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
