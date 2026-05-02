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
          padding: "3rem 1.5rem 2.5rem",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <span className="eyebrow" style={{ marginBottom: "1rem" }}>
            {data.subtitle}
          </span>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginTop: "0.75rem",
              marginBottom: "1rem",
              color: "var(--ink)",
            }}
          >
            {data.title}
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--muted)",
              lineHeight: 1.75,
              maxWidth: "600px",
              marginBottom: "1.75rem",
            }}
          >
            {data.description}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
      <section style={{ padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
              color: "var(--ink)",
            }}
          >
            알아두면 도움이 되는 정보
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {data.cards.map((card) => (
              <div
                key={card.title}
                className="card"
                style={{ padding: "1.25rem 1.5rem" }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    lineHeight: 1,
                    marginBottom: "0.75rem",
                  }}
                >
                  {card.icon}
                </div>
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 800,
                    marginBottom: "0.5rem",
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--muted)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section
        style={{
          padding: "0 1.5rem 2.5rem",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div
            className="section-shell"
            style={{ padding: "1.5rem 1.75rem" }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                marginBottom: "1rem",
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
                gap: "0.625rem",
              }}
            >
              {data.checklist.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.625rem",
                    fontSize: "0.9375rem",
                    color: "var(--ink)",
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "20px",
                      height: "20px",
                      borderRadius: "5px",
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
      <section style={{ padding: "0 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
              color: "var(--ink)",
            }}
          >
            자주 묻는 질문
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.faq.map((item) => (
              <div
                key={item.q}
                className="card"
                style={{ padding: "1.25rem 1.5rem" }}
              >
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 800,
                    color: "var(--brand)",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Q. {item.q}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Note */}
      <section style={{ padding: "0 1.5rem 3rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--muted)",
              lineHeight: 1.65,
              padding: "1rem 1.25rem",
              background: "#fffaf5",
              border: "1px solid var(--line)",
              borderRadius: "0.75rem",
            }}
          >
            {data.sourceNote}
          </p>
        </div>
      </section>
    </main>
  );
}
