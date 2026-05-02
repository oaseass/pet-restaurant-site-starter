import Link from "next/link";

export type BoardRowItem = {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  href: string;
  region?: string;
  views?: number;
  comments?: number;
  timeLabel?: string;
};

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  공지: { bg: "#1f6b5b", color: "#fff" },
  식당: { bg: "#e5f3ef", color: "#1f6b5b" },
  병원: { bg: "#e8f0fe", color: "#2563eb" },
  미용: { bg: "#fce7f3", color: "#be185d" },
  유치원: { bg: "#fef3c7", color: "#92400e" },
  장례: { bg: "#f3f4f6", color: "#4b5563" },
  찾아요: { bg: "#fff1e8", color: "#c2410c" },
  가이드: { bg: "#f0fdf4", color: "#166534" },
};

export function BoardRow({ item }: { item: BoardRowItem }) {
  const color = BADGE_COLORS[item.badge] ?? { bg: "#f3f4f6", color: "#555" };

  return (
    <Link href={item.href} className="board-row">
      <span
        className="board-row-badge"
        style={{ background: color.bg, color: color.color }}
      >
        {item.badge}
      </span>
      <span className="board-row-title">{item.title}</span>
      <span className="board-row-region">{item.region ?? ""}</span>
      <span className="board-row-stats">
        {item.comments !== undefined && item.comments > 0 && (
          <span className="board-row-stat">
            <span style={{ fontSize: "10px" }}>💬</span>
            {item.comments}
          </span>
        )}
        {item.views !== undefined && (
          <span className="board-row-stat">
            <span style={{ fontSize: "10px" }}>👁</span>
            {item.views}
          </span>
        )}
        {item.timeLabel && (
          <span>{item.timeLabel}</span>
        )}
      </span>
    </Link>
  );
}
