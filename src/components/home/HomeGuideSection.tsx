import Link from "next/link";

const GUIDE_CARDS = [
  {
    title: "식당 가기 전",
    desc: "좌석·동반 조건",
    href: "/guide/travel",
  },
  {
    title: "비행기 준비",
    desc: "기내·위탁 체크",
    href: "/guide/flight",
  },
  {
    title: "예방접종",
    desc: "일정·주의할 점",
    href: "/guide/vaccination",
  },
  {
    title: "실종 대응",
    desc: "제보·공고 확인",
    href: "/lost-pets",
  },
] as const;

export function HomeGuideSection() {
  return (
    <section style={{ padding: "16px 14px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#999", letterSpacing: "0.05em" }}>
          가기 전에 챙길 것
        </div>
        <Link
          href="/guide"
          style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}
        >
          전체 보기 →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" }}>
        {GUIDE_CARDS.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            style={{
              display: "flex",
              minHeight: "76px",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "7px",
              padding: "10px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                {g.title}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", lineHeight: 1.35 }}>
                {g.desc}
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--brand)",
              }}
            >
              읽기 →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
