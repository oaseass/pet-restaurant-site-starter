import Link from "next/link";
import { FeedCard, type FeedCardItem } from "@/components/FeedCard";
import { getRestaurantsLightSnapshot, getCategoryCountsSnapshot } from "@/lib/public-data";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { TODAY_GUIDES } from "@/lib/platform-content";

function categoryFeedItem(slug: string): FeedCardItem {
  const c = CATEGORY_CONTENT[slug];
  return {
    id: `category-${slug}`,
    category: c.subtitle,
    source: "정적 정보",
    title: c.title,
    description: c.description,
    tags: c.checklist.slice(0, 3),
    href: `/${slug === "hospital" ? "hospitals" : slug === "daycare" ? "daycare" : slug}`,
    mapHref: "/map",
    reportHref: "/guide",
  };
}

export async function HomeFeed() {
  const [restaurantsLight, counts] = await Promise.all([
    getRestaurantsLightSnapshot(),
    getCategoryCountsSnapshot(),
  ]);

  const recentRestaurants = restaurantsLight.slice(0, 8);

  const restaurantItems: FeedCardItem[] = recentRestaurants.map((r) => ({
    id: r.id,
    category: "식당",
    region: r.sigungu ? `${r.sido} · ${r.sigungu}` : r.sido,
    source: r.officialRegistered ? "공식 등록" : "데이터 수집",
    title: r.name,
    description: r.address,
    tags: [r.businessType],
    href: `/restaurants/${r.id}`,
    mapHref: r.lat && r.lng ? `/map?id=${r.id}` : "/map",
    reportHref: "/guide",
  }));

  const categoryItems: FeedCardItem[] = [
    categoryFeedItem("hospital"),
    categoryFeedItem("grooming"),
    categoryFeedItem("daycare"),
    categoryFeedItem("funeral"),
  ];

  const guideItems: FeedCardItem[] = TODAY_GUIDES.map((g, i) => ({
    id: `guide-${i}`,
    category: "가이드",
    source: "댕냥지도",
    title: g.title,
    description: g.description,
    href: g.href,
  }));

  // Interleave: restaurant × 2, category, restaurant × 2, guide, ...
  const feedItems: FeedCardItem[] = [];
  let ri = 0;
  let ci = 0;
  let gi = 0;

  while (ri < restaurantItems.length || ci < categoryItems.length || gi < guideItems.length) {
    if (ri < restaurantItems.length) feedItems.push(restaurantItems[ri++]);
    if (ri < restaurantItems.length) feedItems.push(restaurantItems[ri++]);
    if (ci < categoryItems.length) feedItems.push(categoryItems[ci++]);
    if (gi < guideItems.length) feedItems.push(guideItems[gi++]);
  }

  return (
    <div>
      {/* Stats bar */}
      <div
        className="flex flex-wrap gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 mb-3 text-xs font-bold text-[var(--muted)]"
      >
        <span>
          식당 <span className="text-[var(--ink)]">{counts.restaurantCount.toLocaleString("ko-KR")}건</span>
        </span>
        <span className="text-[var(--line-strong)]">·</span>
        <span>
          병원·장소 <span className="text-[var(--ink)]">{counts.placeCount.toLocaleString("ko-KR")}건</span>
        </span>
        <span className="text-[var(--line-strong)]">·</span>
        <span>
          찾아요 <span className="text-[var(--ink)]">{counts.lostPetCount.toLocaleString("ko-KR")}건</span>
        </span>
        {counts.lastUpdatedAt && (
          <>
            <span className="text-[var(--line-strong)]">·</span>
            <span>업데이트 {new Date(counts.lastUpdatedAt).toLocaleDateString("ko-KR")}</span>
          </>
        )}
      </div>

      {/* Feed items */}
      <div className="flex flex-col gap-2">
        {feedItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>

      {/* Feed footer */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/restaurants" className="btn-secondary text-xs">
          식당 전체 보기
        </Link>
        <Link href="/lost-pets" className="btn-secondary text-xs">
          실종 제보 보기
        </Link>
        <Link href="/guide" className="btn-secondary text-xs">
          생활 가이드
        </Link>
      </div>
    </div>
  );
}
