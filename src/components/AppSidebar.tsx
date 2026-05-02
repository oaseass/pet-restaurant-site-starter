import Link from "next/link";

const BOARD_MENUS = [
  { href: "/", label: "전체" },
  { href: "/restaurants", label: "식당" },
  { href: "/hospitals", label: "병원" },
  { href: "/grooming", label: "미용" },
  { href: "/daycare", label: "유치원·호텔" },
  { href: "/funeral", label: "장례" },
  { href: "/lost-pets", label: "찾아요" },
  { href: "/guide", label: "가이드" },
  { href: "/business", label: "업체등록" },
] as const;

export function AppSidebar() {
  return (
    <div>
      <div
        style={{
          padding: "8px 12px 6px",
          fontSize: "10px",
          fontWeight: 800,
          color: "#aaa",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderBottom: "1px solid #f0f0f0",
          marginBottom: "2px",
        }}
      >
        게시판
      </div>
      <nav>
        {BOARD_MENUS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              height: "36px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#333",
              textDecoration: "none",
              transition: "background 0.1s",
            }}
            className="hover:bg-[#f3f3f3]"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
