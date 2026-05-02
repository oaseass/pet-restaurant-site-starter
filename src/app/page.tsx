import Link from "next/link";
import { AppSidebar } from "@/components/AppSidebar";
import { RightRail } from "@/components/RightRail";
import { FeedTabs } from "@/components/FeedTabs";
import { HomeFeed } from "@/components/HomeFeed";
import { HomeShellClient } from "@/components/HomeShellClient";
import { getCategoryCountsSnapshot } from "@/lib/public-data";

export default async function HomePage() {
  const counts = await getCategoryCountsSnapshot();

  return (
    <>
      {/* Locks html scroll on desktop; cleaned up on navigation */}
      <HomeShellClient />

      <div className="home-app-shell">
        {/* Left Sidebar */}
        <div className="home-left-rail">
          <AppSidebar />
        </div>

        {/* Center Feed */}
        <div className="home-feed-shell">
          {/* Sticky top: compact intro + tabs */}
          <div className="home-feed-top">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5 mb-0">
              <div className="min-w-0">
                <h1 className="text-[14px] font-black text-[var(--ink)] leading-tight tracking-tight">
                  댕냥지도 피드
                </h1>
                <p className="text-[11px] text-[var(--muted)] leading-normal mt-0.5">
                  반려동물 동반 식당, 병원, 미용, 실종 제보를 한눈에 확인하세요.
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link
                  href="/map"
                  className="btn-primary"
                  style={{ minHeight: "28px", height: "28px", fontSize: "11px", padding: "0 10px" }}
                >
                  지도 열기
                </Link>
                <Link
                  href="/lost-pets"
                  className="btn-secondary"
                  style={{ minHeight: "28px", height: "28px", fontSize: "11px", padding: "0 10px" }}
                >
                  제보하기
                </Link>
              </div>
            </div>
            <FeedTabs />
          </div>

          {/* Scrollable feed area */}
          <div className="home-feed-scroll">
            <HomeFeed />
          </div>
        </div>

        {/* Right Rail */}
        <div className="home-right-rail">
          <RightRail
            restaurantCount={counts.restaurantCount}
            lastUpdatedAt={counts.lastUpdatedAt}
          />
        </div>
      </div>
    </>
  );
}

