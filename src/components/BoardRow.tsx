import Link from "next/link";

export type BoardRowItem = {
  id: string;
  badge: string;
  title: string;
  href: string;
  region?: string;
  actionLabel?: string;
  // legacy fields (ignored)
  badgeColor?: string;
  views?: number;
  comments?: number;
  timeLabel?: string;
};

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  공지: { bg: "var(--brand)", color: "#fff" },
  식당: { bg: "var(--brand-soft)", color: "var(--brand)" },
  병원: { bg: "#e8f0fe", color: "#2563eb" },
  미용: { bg: "#fce7f3", color: "#be185d" },
  유치원: { bg: "#fef3c7", color: "#92400e" },
  장례: { bg: "#f3f4f6", color: "#4b5563" },
  찾아요: { bg: "var(--accent-soft)", color: "#c2410c" },
  가이드: { bg: "#f0fdf4", color: "#166534" },
};

export function BoardRow({ item }: { item: BoardRowItem }) {
  const color = BADGE_COLORS[item.badge] ?? { bg: "#f3f4f6", color: "#555" };
  const action = item.actionLabel ?? (item.badge === "가이드" ? "보기" : item.badge === "찾아요" ? "제보" : "상세");

  return (
    <Link href={item.href} className="pl-row">
      <span
        className="pl-badge"
        style={{ background: color.bg, color: color.color }}
      >
        {item.badge}
      </span>
      <span className="pl-title">{item.title}</span>
      <span className="pl-region">{item.region ?? ""}</span>
      <span className="pl-action">{action} →</span>
    </Link>
  );
}
