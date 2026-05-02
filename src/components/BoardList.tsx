import { BoardRow, type BoardRowItem } from "@/components/BoardRow";
import { getRestaurantsLightSnapshot, getCategoryCountsSnapshot } from "@/lib/public-data";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { TODAY_GUIDES } from "@/lib/platform-content";

const NOTICES: BoardRowItem[] = [
  {
    id: "notice-1",
    badge: "공지",
    badgeColor: "",
    title: "댕냥지도 데이터는 공공데이터포털 식품안전나라를 기반으로 합니다",
    href: "/guide",
    timeLabel: "공지",
  },
  {
    id: "notice-2",
    badge: "공지",
    badgeColor: "",
    title: "반려동물 동반 가능 식당 제보 및 수정 요청은 업체등록 메뉴를 이용해주세요",
    href: "/business",
    timeLabel: "공지",
  },
];

export async function BoardList() {
  const [restaurantsLight, counts] = await Promise.all([
    getRestaurantsLightSnapshot(),
    getCategoryCountsSnapshot(),
  ]);

  // Build rows
  const rows: BoardRowItem[] = [];

  // Notices
  rows.push(...NOTICES);

  // Restaurant rows (최대 12개)
  const restaurants = restaurantsLight.slice(0, 12);
  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    rows.push({
      id: r.id,
      badge: "식당",
      badgeColor: "",
      title: r.name,
      href: `/restaurants/${r.id}`,
      region: r.sigungu ? `${r.sido} ${r.sigungu}` : r.sido,
      views: 10 + (i * 7) % 80,
      timeLabel: "오늘",
    });
  }

  // Category guide rows
  const categoryGuides: BoardRowItem[] = [
    {
      id: "cat-hospital",
      badge: "병원",
      badgeColor: "",
      title: CATEGORY_CONTENT["hospital"].title,
      href: "/hospitals",
      region: "전국",
      timeLabel: "가이드",
    },
    {
      id: "cat-grooming",
      badge: "미용",
      badgeColor: "",
      title: CATEGORY_CONTENT["grooming"].title,
      href: "/grooming",
      region: "전국",
      timeLabel: "가이드",
    },
    {
      id: "cat-daycare",
      badge: "유치원",
      badgeColor: "",
      title: CATEGORY_CONTENT["daycare"].title,
      href: "/daycare",
      region: "전국",
      timeLabel: "가이드",
    },
    {
      id: "cat-funeral",
      badge: "장례",
      badgeColor: "",
      title: CATEGORY_CONTENT["funeral"].title,
      href: "/funeral",
      region: "전국",
      timeLabel: "가이드",
    },
  ];
  rows.push(...categoryGuides);

  // Lost pet CTA
  rows.push({
    id: "lost-pets-cta",
    badge: "찾아요",
    badgeColor: "",
    title: `현재 ${counts.lostPetCount.toLocaleString("ko-KR")}건의 실종 제보가 등록되어 있습니다 — 목격하셨나요?`,
    href: "/lost-pets",
    region: "전국",
    timeLabel: "실시간",
  });

  // Guide rows
  for (const g of TODAY_GUIDES) {
    rows.push({
      id: `guide-${g.href}`,
      badge: "가이드",
      badgeColor: "",
      title: g.title,
      href: g.href,
      timeLabel: "가이드",
    });
  }

  return (
    <div>
      {/* Stats bar */}
      <div
        className="board-notice-bar"
        style={{ borderBottom: "1px solid #e2e2e2", background: "#fafafa" }}
      >
        <span style={{ color: "#888", fontSize: "12px" }}>
          식당{" "}
          <strong style={{ color: "#222" }}>
            {counts.restaurantCount.toLocaleString("ko-KR")}
          </strong>
          건 &nbsp;·&nbsp; 병원·장소{" "}
          <strong style={{ color: "#222" }}>
            {counts.placeCount.toLocaleString("ko-KR")}
          </strong>
          건 &nbsp;·&nbsp; 찾아요{" "}
          <strong style={{ color: "#222" }}>
            {counts.lostPetCount.toLocaleString("ko-KR")}
          </strong>
          건
        </span>
        {counts.lastUpdatedAt && (
          <span style={{ marginLeft: "auto", color: "#aaa", fontSize: "11px" }}>
            {new Date(counts.lastUpdatedAt).toLocaleDateString("ko-KR")} 기준
          </span>
        )}
      </div>

      {/* Board list */}
      <div className="board-list">
        {rows.map((row) => (
          <BoardRow key={row.id} item={row} />
        ))}
      </div>
    </div>
  );
}
