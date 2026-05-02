import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot } from "@/lib/public-data";
import { GUIDE_DOCS } from "@/lib/platform-content";

export default async function GuidePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {/* 상단 헤더 */}
      <div className="portal-section-header">
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            생활 가이드
          </h1>
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            반려생활 필수 정보 모음
          </p>
        </div>
      </div>

      {/* 통계 바 */}
      <div className="portal-notice-bar">
        <span style={{ fontSize: "12px", color: "#777" }}>
          가이드 <strong style={{ color: "#222" }}>{GUIDE_DOCS.length}</strong>건
        </span>
      </div>

      {/* 가이드 목록 */}
      <div>
        {GUIDE_DOCS.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="pl-row"
          >
            <span className="pl-badge" style={{ background: "#f0fdf4", color: "#166534" }}>
              가이드
            </span>
            <span className="pl-title">{guide.title}</span>
            <span className="pl-region" style={{ width: "auto", fontSize: "11px", color: "#999" }}>
              {guide.category}
            </span>
            <span className="pl-action">보기 →</span>
          </Link>
        ))}
      </div>
    </PublicPageShell>
  );
}
