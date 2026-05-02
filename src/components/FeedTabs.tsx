import Link from "next/link";

const BOARD_TABS = [
  { label: "전체", href: "/" },
  { label: "식당", href: "/restaurants" },
  { label: "병원", href: "/hospitals" },
  { label: "미용", href: "/grooming" },
  { label: "찾아요", href: "/lost-pets" },
  { label: "가이드", href: "/guide" },
] as const;

export function FeedTabs() {
  return (
    <div className="board-tabs">
      {BOARD_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="board-tab"
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
