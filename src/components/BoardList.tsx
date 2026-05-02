import { BoardRow, type BoardRowItem } from "@/components/BoardRow";
import { getRestaurantsLightSnapshot, getCategoryCountsSnapshot } from "@/lib/public-data";
import { CATEGORY_CONTENT } from "@/lib/category-info-content";
import { TODAY_GUIDES } from "@/lib/platform-content";

const NOTICES: BoardRowItem[] = [
  {
    id: "notice-1",
    badge: "공지",
    title: "댕냥지도 데이터는 공공데이터포털 식품안전나라를 기반으로 합니다",
    href: "/guide",
    region: "공지",
    actionLabel: "확인",
  },
  {
    id: "notice-2",
    badge: "공지",
    title: "반려동물 동반 식당 제보·수정 요청은 업체등록 메뉴를 이용해주세요",
    href: "/business",
    region: "공지",
    actionLabel: "등록",
  },
];

export async function BoardList() {
  const [restaurantsLight, counts] = await Promise.all([
    getRestaurantsLightSnapshot(),
    getCategoryCountsSnapshot(),
  ]);

  const rows: BoardRowItem[] = [];

  // 공지
  rows.push(...NOTICES);

  // 식당 목록 (최대 12개)
  const restaurants = restaurantsLight.slice(0, 12);
  for (const r of restaurants) {
    rows.push({
      id: r.id,
      badge: "식당",
      title: r.name,
      href: `/restaurants/${r.id}`,
      region: r.sigungu ? `${r.sido} ${r.sigungu}` : r.sido,
      actionLabel: "상세",
    });
  }

  // 카테고리 가이드
  const categoryGuides: BoardRowItem[] = [
    {
      id: "cat-hospital",
      badge: "병원",
      title: CATEGORY_CONTENT["hospital"].title,
      href: "/hospitals",
      region: "전국",
      actionLabel: "보기",
    },
    {
      id: "cat-grooming",
      badge: "미용",
      title: CATEGORY_CONTENT["grooming"].title,
      href: "/grooming",
      region: "전국",
      actionLabel: "보기",
    },
    {
      id: "cat-daycare",
      badge: "유치원",
      title: CATEGORY_CONTENT["daycare"].title,
      href: "/daycare",
      region: "전국",
      actionLabel: "보기",
    },
    {
      id: "cat-funeral",
      badge: "장례",
      title: CATEGORY_CONTENT["funeral"].title,
      href: "/funeral",
      region: "전국",
      actionLabel: "보기",
    },
    {
      id: "cat-pharmacy",
      badge: "약국",
      title: CATEGORY_CONTENT["pharmacy"].title,
      href: "/pharmacy",
      region: "전국",
      actionLabel: "보기",
    },
  ];
  rows.push(...categoryGuides);

  // 찾아요 CTA
  rows.push({
    id: "lost-pets-cta",
    badge: "찾아요",
    title: `${counts.lostPetCount.toLocaleString("ko-KR")}건의 실종 제보가 등록되어 있습니다 — 목격하셨나요?`,
    href: "/lost-pets",
    region: "전국",
    actionLabel: "보기",
  });

  // 가이드
  for (const g of TODAY_GUIDES) {
    rows.push({
      id: `guide-${g.href}`,
      badge: "가이드",
      title: g.title,
      href: g.href,
      actionLabel: "보기",
    });
  }

  return (
    <div>
      {/* 통계 바 */}
      <div className="portal-notice-bar">
        <span style={{ color: "#777", fontSize: "12px" }}>
          식당{" "}
          <strong style={{ color: "#222" }}>
            {counts.restaurantCount.toLocaleString("ko-KR")}
          </strong>건 &nbsp;·&nbsp; 장소{" "}
          <strong style={{ color: "#222" }}>
            {counts.placeCount.toLocaleString("ko-KR")}
          </strong>건 &nbsp;·&nbsp; 찾아요{" "}
          <strong style={{ color: "#222" }}>
            {counts.lostPetCount.toLocaleString("ko-KR")}
          </strong>건
        </span>
        {counts.lastUpdatedAt && (
          <span style={{ marginLeft: "auto", color: "#aaa", fontSize: "11px", flexShrink: 0 }}>
            {new Date(counts.lastUpdatedAt).toLocaleDateString("ko-KR")} 기준
          </span>
        )}
      </div>

      {/* 목록 */}
      <div>
        {rows.map((row) => (
          <BoardRow key={row.id} item={row} />
        ))}
      </div>
    </div>
  );
}
