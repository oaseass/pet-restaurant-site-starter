import Link from "next/link";

const GUIDE_CARDS = [
  {
    title: "동반 식당 방문 전 확인할 것",
    desc: "입장 조건, 케이지 규정, 매너 에티켓 정리",
    href: "/guide/travel",
  },
  {
    title: "강아지 비행기 타는 법",
    desc: "국내선·국제선 기내 반입 및 위탁 절차",
    href: "/guide/flight",
  },
  {
    title: "예방접종 전 확인할 것",
    desc: "강아지·고양이 접종 일정과 주의사항",
    href: "/guide/vaccination",
  },
  {
    title: "실종 시 바로 해야 할 일",
    desc: "동물등록·제보 등록·SNS 확산 체크리스트",
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
          가이드
        </div>
        <Link
          href="/guide"
          style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}
        >
          전체 보기 →
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {GUIDE_CARDS.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "10px 12px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              textDecoration: "none",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                {g.title}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                {g.desc}
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--brand)",
                flexShrink: 0,
              }}
            >
              보기 →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
