import Link from "next/link";
import { MapPin } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { FeedTabs } from "@/components/FeedTabs";
import { BoardList } from "@/components/BoardList";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export default async function HomePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <PublicPageShell
      restaurantCount={counts.restaurantCount}
      lastUpdatedAt={counts.lastUpdatedAt}
    >
      {/* ?섏씠吏 ?ㅻ뜑 */}
      <div className="portal-section-header">
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            ?뺣깷吏??          </h1>
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, marginTop: "1px" }}>
            諛섎젮?숇Ъ ?숇컲 ?앸떦 쨌 蹂묒썝 쨌 誘몄슜 쨌 ?ㅼ쥌 ?쒕낫
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <Link
            href="/map"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
              background: "var(--brand)",
              borderRadius: "6px",
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            <MapPin size={11} />
            吏???닿린
          </Link>
          <Link
            href="/lost-pets"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#555",
              background: "#f3f4f6",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            ?쒕낫?섍린
          </Link>
        </div>
      </div>

      {/* ??*/}
      <FeedTabs />

      {/* 紐⑸줉 */}
      <BoardList />
    </PublicPageShell>
  );
}

