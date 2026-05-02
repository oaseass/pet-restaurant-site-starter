import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { RightRail } from "@/components/RightRail";
import { FeedTabs } from "@/components/FeedTabs";
import { BoardList } from "@/components/BoardList";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export default async function HomePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <div className="board-layout">
      {/* Left: 게시판 메뉴 */}
      <aside className="board-sidebar">
        <AppSidebar />
      </aside>

      {/* Center: 게시판 본문 */}
      <main className="board-main">
        {/* 게시판 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px 8px",
            borderBottom: "1px solid #e2e2e2",
            background: "#fff",
          }}
        >
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: 800, color: "#222", lineHeight: 1.3, margin: 0 }}>
              댕냥지도
            </h1>
            <p style={{ fontSize: "11px", color: "#888", margin: 0, marginTop: "2px" }}>
              반려동물 동반 식당 · 병원 · 미용 · 실종 제보
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <Link
              href="/map"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#fff",
                background: "#1f6b5b",
                border: "none",
                borderRadius: "3px",
                padding: "5px 10px",
                textDecoration: "none",
              }}
            >
              지도 열기
            </Link>
            <Link
              href="/lost-pets"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#555",
                background: "#f3f3f3",
                border: "1px solid #ddd",
                borderRadius: "3px",
                padding: "5px 10px",
                textDecoration: "none",
              }}
            >
              제보하기
            </Link>
          </div>
        </div>

        {/* 탭 */}
        <FeedTabs />

        {/* 목록 */}
        <BoardList />
      </main>

      {/* Right: 위젯 */}
      <aside className="board-right">
        <RightRail
          restaurantCount={counts.restaurantCount}
          lastUpdatedAt={counts.lastUpdatedAt}
        />
      </aside>
    </div>
  );
}


