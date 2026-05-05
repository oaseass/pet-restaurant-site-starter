import { SmartLink } from "@/components/SmartLink";
import type { PublicCategoryCounts } from "@/lib/public-data";

interface CategoryCardItem {
  label: string;
  desc: string;
  href: string;
  cta: string;
  count?: number;
}

const CATEGORIES: CategoryCardItem[] = [
  {
    label: "식당",
    desc: "반려동물 동반 가능 식당 검색",
    href: "/restaurants",
    cta: "식당 찾기",
  },
  {
    label: "병원",
    desc: "동물병원 정보 안내",
    href: "/hospitals",
    cta: "정보 보기",
  },
  {
    label: "미용",
    desc: "반려동물 미용 안내",
    href: "/grooming",
    cta: "정보 보기",
  },
  {
    label: "유치원·호텔",
    desc: "위탁관리 및 유치원 안내",
    href: "/daycare",
    cta: "정보 보기",
  },
  {
    label: "장례",
    desc: "반려동물 장례 안내",
    href: "/funeral",
    cta: "정보 보기",
  },
  {
    label: "약국",
    desc: "동물약국 정보 안내",
    href: "/pharmacy",
    cta: "정보 보기",
  },
  {
    label: "찾아요",
    desc: "실종 제보 등록 및 확인",
    href: "/lost-pets",
    cta: "제보 보기",
  },
  {
    label: "가이드",
    desc: "반려동물 여행·생활 가이드",
    href: "/guide",
    cta: "가이드 보기",
  },
];

interface HomeCategoryCardsProps {
  counts: PublicCategoryCounts;
}

const CATEGORY_COUNT_KEYS: Record<string, keyof NonNullable<PublicCategoryCounts["placeCategoryCounts"]>> = {
  병원: "ANIMAL_HOSPITAL",
  미용: "GROOMING",
  "유치원·호텔": "DAYCARE",
  장례: "FUNERAL",
  약국: "PHARMACY",
};

function getCategoryCount(category: CategoryCardItem, counts: PublicCategoryCounts) {
  if (category.label === "식당") return counts.restaurantCount;
  const key = CATEGORY_COUNT_KEYS[category.label];
  return key ? counts.placeCategoryCounts?.[key] : undefined;
}

export function HomeCategoryCards({ counts }: HomeCategoryCardsProps) {
  const categories = CATEGORIES.map((category) => ({ ...category, count: getCategoryCount(category, counts) }));

  return (
    <section style={{ padding: "16px 14px 0" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          color: "#999",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        카테고리
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "6px",
        }}
      >
        {categories.map((c) => (
          <SmartLink
            key={c.href}
            href={c.href}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              textDecoration: "none",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                {c.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                {c.count !== undefined
                  ? `${c.count.toLocaleString("ko-KR")}건`
                  : c.desc}
              </div>
              {c.count !== undefined ? (
                <div style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>{c.desc}</div>
              ) : null}
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--brand)",
                flexShrink: 0,
                marginLeft: "8px",
              }}
            >
              {c.cta} →
            </span>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}
