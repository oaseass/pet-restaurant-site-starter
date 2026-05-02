import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LostPetCard } from "@/components/LostPetCard";
import { EmptyState } from "@/components/EmptyState";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function LostPetsPage() {
  const [items, counts] = await Promise.all([
    prisma.lostPet.findMany({
      where: { status: { in: ["APPROVED", "FOUND"] } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    getCategoryCountsSnapshot(),
  ]);

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {/* 상단 헤더 */}
      <div className="portal-section-header">
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            댕냥이 찾아요
          </h1>
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            실종 반려동물 제보 목록
          </p>
        </div>
        <Link
          href="/lost-pets/new"
          style={{
            fontSize: "11px", fontWeight: 700, color: "#fff",
            background: "#c2410c", borderRadius: "6px",
            padding: "5px 10px", textDecoration: "none",
          }}
        >
          실종 글 올리기
        </Link>
      </div>

      {/* 통계 바 */}
      <div className="portal-notice-bar">
        <span style={{ fontSize: "12px", color: "#777" }}>
          공개 제보 <strong style={{ color: "#222" }}>{items.length}</strong>건 표시 중
        </span>
      </div>

      {/* 목록 */}
      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
        {items.length > 0
          ? items.map((item) => <LostPetCard key={item.id} item={item} />)
          : <EmptyState title="공개 중인 실종 제보가 없습니다." description="새 글을 등록하면 내부 검수 후 공개됩니다." character="cat-peeking" />}
      </div>
    </PublicPageShell>
  );
}
