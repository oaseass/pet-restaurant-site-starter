import Link from "next/link";
import type { CategoryContent } from "@/lib/category-info-content";

interface Props {
  data: CategoryContent;
}

export function CategoryInfoPage({ data }: Props) {
  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* ?곷떒 ?ㅻ뜑 */}
      <div className="portal-section-header">
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {data.title}
          </h1>
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            {data.subtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Link href={data.ctaPrimary.href} style={{
            fontSize: "11px", fontWeight: 700, color: "#fff",
            background: "var(--brand)", borderRadius: "6px",
            padding: "5px 10px", textDecoration: "none",
          }}>
            {data.ctaPrimary.label}
          </Link>
          <Link href={data.ctaSecondary.href} style={{
            fontSize: "11px", fontWeight: 700, color: "#555",
            background: "#f3f4f6", border: "1px solid var(--line)",
            borderRadius: "6px", padding: "5px 10px", textDecoration: "none",
          }}>
            {data.ctaSecondary.label}
          </Link>
        </div>
      </div>

      {/* ?뚭컻 臾멸뎄 */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", background: "#fafdf9" }}>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65, margin: 0 }}>
          {data.description}
        </p>
      </div>

      {/* ?뺣낫 移대뱶 */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "#888", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "10px" }}>
          ?뚯븘?먮㈃ ?꾩????섎뒗 ?뺣낫
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px" }}>
          {data.cards.map((card) => (
            <div
              key={card.title}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "8px",
                background: "var(--surface)",
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: "18px", lineHeight: 1, marginBottom: "6px" }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: "13px", fontWeight: 800, marginBottom: "4px", color: "var(--ink)" }}>
                {card.title}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 泥댄겕由ъ뒪??*/}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "#888", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "10px" }}>
          諛⑸Ц ??泥댄겕由ъ뒪??
        </p>
        <div style={{ border: "1px solid var(--line)", borderRadius: "8px", background: "var(--surface)", padding: "12px 14px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.checklist.map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, width: "14px", height: "14px", borderRadius: "3px", border: "1.5px solid var(--line-strong)", background: "var(--surface)", display: "inline-block", marginTop: "2px" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: "#888", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "10px" }}>
          ?먯＜ 臾삳뒗 吏덈Ц
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.faq.map((item) => (
            <div key={item.q} style={{ border: "1px solid var(--line)", borderRadius: "8px", background: "var(--surface)", padding: "12px 14px" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--brand)", marginBottom: "4px" }}>
                Q. {item.q}
              </p>
              <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 異쒖쿂 ?명듃 */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.6, padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px" }}>
          {data.sourceNote}
        </p>
      </div>
    </div>
  );
}

