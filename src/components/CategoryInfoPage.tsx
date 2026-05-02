import Link from "next/link";
import type { CategoryContent } from "@/lib/category-info-content";

interface Props {
  data: CategoryContent;
}

export function CategoryInfoPage({ data }: Props) {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          padding: "2rem 1.5rem 1.75rem",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            {data.subtitle}
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginTop: "0.5rem",
              marginBottom: "0.75rem",
              color: "var(--ink)",
            }}
          >
            {data.title}
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--muted)",
              lineHeight: 1.7,
              maxWidth: "600px",
              marginBottom: "1.25rem",
            }}
          >
            {data.description}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href={data.ctaPrimary.href} className="btn-primary">
              {data.ctaPrimary.label}
            </Link>
            <Link href={data.ctaSecondary.href} className="btn-secondary">
              {data.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section style={{ padding: "1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              marginBottom: "0.875rem",
              color: "var(--ink)",
            }}
          >
            알아두면 도움이 되는 정보
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {data.cards.map((card) => (
              <div
                key={card.title}
                className="card"
                style={{ padding: "1rem 1.25rem" }}
              >
                <div style={{ fontSize: "1.25rem", lineHeight: 1, marginBottom: "0.625rem" }}>
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 800,
                    marginBottom: "0.375rem",
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section style={{ padding: "0 1.5rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div className="section-shell" style={{ padding: "1.25rem 1.5rem" }}>
            <h2
              style={{
                fontSize: "0.875rem",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                marginBottom: "0.875rem",
                color: "var(--ink)",
              }}
            >
              방문 전 체크리스트
            </h2>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {data.checklist.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--ink)",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "16px",
                      height: "16px",
                      borderRadius: "3px",
                      border: "1.5px solid var(--line-strong)",
                      background: "var(--surface)",
                      display: "inline-block",
                      marginTop: "2px",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "0 1.5rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              marginBottom: "0.875rem",
              color: "var(--ink)",
            }}
          >
            자주 묻는 질문
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.faq.map((item) => (
              <div key={item.q} className="card" style={{ padding: "1rem 1.25rem" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 800,
                    color: "var(--brand)",
                    marginBottom: "0.375rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Q. {item.q}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Note */}
      <section style={{ padding: "0 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              lineHeight: 1.65,
              padding: "0.875rem 1rem",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "0.5rem",
            }}
          >
            {data.sourceNote}
          </p>
        </div>
      </section>
    </main>
  );
}
