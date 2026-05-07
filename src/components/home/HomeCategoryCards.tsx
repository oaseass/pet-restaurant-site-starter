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
    desc: "강아지랑 갈 곳",
    href: "/restaurants",
    cta: "찾기",
  },
  {
    label: "병원",
    desc: "진료 가능한 곳",
    href: "/hospitals",
    cta: "찾기",
  },
  {
    label: "미용",
    desc: "예약할 곳",
    href: "/grooming",
    cta: "찾기",
  },
  {
    label: "유치원·호텔",
    desc: "맡길 곳",
    href: "/daycare",
    cta: "찾기",
  },
  {
    label: "장례",
    desc: "상담할 곳",
    href: "/funeral",
    cta: "찾기",
  },
  {
    label: "약국",
    desc: "약 물어볼 곳",
    href: "/pharmacy",
    cta: "찾기",
  },
  {
    label: "찾아요",
    desc: "보호·실종 공고",
    href: "/lost-pets",
    cta: "확인",
  },
  {
    label: "가이드",
    desc: "가기 전 체크",
    href: "/guide",
    cta: "읽기",
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
  if (category.label === "찾아요") return counts.lostPetCount;
  const key = CATEGORY_COUNT_KEYS[category.label];
  return key ? counts.placeCategoryCounts?.[key] : undefined;
}

export function HomeCategoryCards({ counts }: HomeCategoryCardsProps) {
  const categories = CATEGORIES.map((category) => ({ ...category, count: getCategoryCount(category, counts) }));

  return (
    <section style={{ padding: "12px 14px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "7px",
        }}
      >
        <div
          style={{
          fontSize: "11px",
          fontWeight: 800,
          color: "#999",
          letterSpacing: "0.05em",
          }}
        >
          무엇을 찾으세요?
        </div>
        <SmartLink href="/categories" style={{ fontSize: "11px", fontWeight: 800, color: "var(--brand)", textDecoration: "none" }}>
          모두 보기 →
        </SmartLink>
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
              minHeight: "58px",
              padding: "8px 10px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                {c.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                {c.desc}
              </div>
              {c.count !== undefined ? (
                <div style={{ fontSize: "10px", color: "#999", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.count.toLocaleString("ko-KR")}곳 정리 중</div>
              ) : null}
            </div>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--brand)",
                flexShrink: 0,
                marginLeft: "6px",
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
