import { PublicPageShell } from "@/components/PublicPageShell";
import { SmartLink } from "@/components/SmartLink";
import { getCategoryCountsSnapshot } from "@/lib/public-data";
import { GUIDE_DOCS, PLACE_CATEGORY_LABELS } from "@/lib/platform-content";

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
      <div className="grid gap-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_DOCS.map((guide) => (
          <SmartLink
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fbfdf9]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-black text-[#166534]">
                {PLACE_CATEGORY_LABELS[guide.category] ?? "가이드"}
              </span>
              <span className="rounded-full bg-[#f5f1eb] px-2.5 py-1 text-[11px] font-black text-[#63574d]">
                {guide.readMinutes}분 읽기
              </span>
            </div>
            <h2 className="mt-3 text-lg font-black leading-snug tracking-tight text-[var(--ink)]">{guide.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{guide.summary}</p>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[11px] font-black">
              <span className="text-[#8b7b70]">체크리스트 {guide.checklist.length}개</span>
              <span className="text-[var(--brand)]">자세히 보기 →</span>
            </div>
          </SmartLink>
        ))}
      </div>
    </PublicPageShell>
  );
}
