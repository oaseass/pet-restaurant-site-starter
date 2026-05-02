import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { RightRail } from "@/components/RightRail";
import { FeedTabs } from "@/components/FeedTabs";
import { HomeFeed } from "@/components/HomeFeed";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export default async function HomePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <div
      className="mx-auto flex w-full"
      style={{ maxWidth: "1280px", padding: "0 16px", gap: "0", alignItems: "flex-start" }}
    >
      {/* Left Sidebar */}
      <AppSidebar />

      {/* Center Feed */}
      <main
        className="min-w-0 flex-1"
        style={{ padding: "16px 0 48px", paddingLeft: "0", paddingRight: "0" }}
      >
        {/* Feed Intro */}
        <div
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] mb-3"
          style={{ padding: "16px 20px" }}
        >
          <p className="eyebrow mb-2">반려생활 피드</p>
          <h1 className="text-xl font-black tracking-tight text-[var(--ink)] leading-tight">
            댕냥지도 반려생활 피드
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            반려동물 동반 식당, 병원, 미용, 유치원, 장례, 실종 제보까지
            지역별 정보를 피드와 지도에서 빠르게 확인하세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/map" className="btn-primary" style={{ minHeight: "36px", fontSize: "13px" }}>
              지도 열기
            </Link>
            <Link href="/restaurants" className="btn-secondary" style={{ minHeight: "36px", fontSize: "13px" }}>
              식당 보기
            </Link>
            <Link href="/guide" className="btn-secondary" style={{ minHeight: "36px", fontSize: "13px" }}>
              가이드
            </Link>
          </div>
        </div>

        {/* Feed Tabs */}
        <FeedTabs />

        {/* Feed Content */}
        <HomeFeed />

        {/* Mobile RightRail (below feed) */}
        <div className="mt-6 xl:hidden">
          <RightRail
            restaurantCount={counts.restaurantCount}
            lastUpdatedAt={counts.lastUpdatedAt}
          />
        </div>
      </main>

      {/* Right Rail (desktop) */}
      <div className="hidden xl:block" style={{ width: "16px", flexShrink: 0 }} />
      <div className="hidden xl:block">
        <RightRail
          restaurantCount={counts.restaurantCount}
          lastUpdatedAt={counts.lastUpdatedAt}
        />
      </div>
    </div>
  );
}
