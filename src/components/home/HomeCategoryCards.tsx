import Image from "next/image";
import { SmartLink } from "@/components/SmartLink";
import type { PublicCategoryCounts } from "@/lib/public-data";

interface CategoryCardItem {
  label: string;
  desc: string;
  href: string;
  helper: string;
  mascot: string;
  accent: string;
  accentText: string;
  bg: string;
  border: string;
  mascotPos: "right" | "left" | "bottom-center" | "bottom-right";
  count?: number;
  hero?: boolean;
}

const CATEGORIES: Omit<CategoryCardItem, "count">[] = [
  {
    label: "동물병원",
    desc: "진료 가능한 곳",
    href: "/hospitals",
    helper: "오늘 진료는 전화로",
    mascot: "/images/characters/theme-hospital.png",
    accent: "#1f6b5b",
    accentText: "#fff",
    bg: "linear-gradient(135deg, #1a5c4d 0%, #1f6b5b 100%)",
    border: "transparent",
    mascotPos: "right",
    hero: true,
  },
  {
    label: "동반 식당",
    desc: "강아지랑 갈 곳",
    href: "/restaurants",
    helper: "좌석은 가기 전 확인",
    mascot: "/images/characters/theme-restaurant.png",
    accent: "#c07a30",
    accentText: "#111",
    bg: "linear-gradient(135deg, #fffaf2 0%, #fff6e8 100%)",
    border: "#f0e4cc",
    mascotPos: "left",
  },
  {
    label: "미용",
    desc: "예약할 곳",
    href: "/grooming",
    helper: "견종·크기 먼저 확인",
    mascot: "/images/characters/theme-grooming.png",
    accent: "#c0607a",
    accentText: "#111",
    bg: "linear-gradient(160deg, #fff5f8 0%, #ffeef4 100%)",
    border: "#f0d8e0",
    mascotPos: "bottom-right",
  },
  {
    label: "유치원·호텔",
    desc: "맡길 곳",
    href: "/daycare",
    helper: "입소 조건 상담",
    mascot: "/images/characters/theme-hotel.png",
    accent: "#4a7aaa",
    accentText: "#111",
    bg: "linear-gradient(160deg, #f4f9ff 0%, #eaf3ff 100%)",
    border: "#d0e4f4",
    mascotPos: "bottom-center",
  },
  {
    label: "동물약국",
    desc: "약 물어볼 곳",
    href: "/pharmacy",
    helper: "재고는 전화 확인",
    mascot: "/images/characters/theme-pharmacy.png",
    accent: "#5577aa",
    accentText: "#111",
    bg: "#ffffff",
    border: "#e8e8e8",
    mascotPos: "right",
  },
  {
    label: "장례",
    desc: "상담할 곳",
    href: "/funeral",
    helper: "절차·비용 물어보기",
    mascot: "/images/characters/theme-memorial.png",
    accent: "#9080b0",
    accentText: "#111",
    bg: "linear-gradient(135deg, #f8f4ff 0%, #f2ecfa 100%)",
    border: "#e0d8ec",
    mascotPos: "bottom-right",
  },
  {
    label: "찾아요",
    desc: "보호·실종 공고",
    href: "/lost-pets",
    helper: "지역별 공고 보기",
    mascot: "/images/characters/gen-maltese.png",
    accent: "#e06040",
    accentText: "#111",
    bg: "#ffffff",
    border: "#eee",
    mascotPos: "left",
  },
];

const CATEGORY_COUNT_KEYS: Record<string, string> = {
  "동물병원": "ANIMAL_HOSPITAL",
  "미용": "GROOMING",
  "유치원·호텔": "DAYCARE",
  "장례": "FUNERAL",
  "동물약국": "PHARMACY",
};

function getCategoryCount(label: string, counts: PublicCategoryCounts): number | undefined {
  if (label === "동반 식당") return counts.restaurantCount;
  if (label === "찾아요") return counts.lostPetCount;
  const key = CATEGORY_COUNT_KEYS[label] as keyof NonNullable<PublicCategoryCounts["placeCategoryCounts"]> | undefined;
  return key ? counts.placeCategoryCounts?.[key] : undefined;
}

function formatCount(n: number | undefined) {
  if (!n) return null;
  if (n >= 10000) return `${Math.floor(n / 1000)}천+곳`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천곳`;
  return `${n}곳`;
}

export function HomeCategoryCards({ counts }: { counts: PublicCategoryCounts }) {
  const categories = CATEGORIES.map((c) => ({ ...c, count: getCategoryCount(c.label, counts) }));
  const [hero, ...rest] = categories;

  return (
    <section style={{ padding: "12px 14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#999", letterSpacing: "0.05em" }}>무엇을 찾으세요?</span>
        <SmartLink href="/categories" style={{ fontSize: "11px", fontWeight: 800, color: "var(--brand)", textDecoration: "none" }}>
          전체 보기 →
        </SmartLink>
      </div>

      {/* 히어로 카드: 동물병원 */}
      <SmartLink
        href={hero.href}
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          borderRadius: "14px",
          background: hero.bg,
          minHeight: "110px",
          padding: "16px 18px",
          textDecoration: "none",
          marginBottom: "7px",
        }}
      >
        <Image
          src={hero.mascot}
          alt=""
          aria-hidden
          width={100}
          height={100}
          style={{ position: "absolute", right: 4, bottom: 0, height: 100, width: "auto", objectFit: "contain", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.20))", pointerEvents: "none" }}
        />
        <div style={{ paddingRight: "100px" }}>
          {hero.count && <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: "3px" }}>{formatCount(hero.count)}</div>}
          <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{hero.label}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>{hero.helper}</div>
        </div>
      </SmartLink>

      {/* 2컬럼 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
        {rest.map((c) => (
          <SmartLink
            key={c.href}
            href={c.href}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              borderRadius: "14px",
              border: `1px solid ${c.border}`,
              background: c.bg,
              minHeight: "118px",
              padding: "13px 13px 0",
              textDecoration: "none",
            }}
          >
            {/* 왼쪽 배치 마스코트 */}
            {c.mascotPos === "left" && (
              <Image
                src={c.mascot}
                alt=""
                aria-hidden
                width={72}
                height={72}
                style={{ position: "absolute", left: 6, bottom: 0, height: 72, width: "auto", objectFit: "contain", pointerEvents: "none" }}
              />
            )}
            {/* 오른쪽 배치 */}
            {c.mascotPos === "right" && (
              <Image
                src={c.mascot}
                alt=""
                aria-hidden
                width={72}
                height={72}
                style={{ position: "absolute", right: 2, bottom: 0, height: 80, width: "auto", objectFit: "contain", pointerEvents: "none", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.07))" }}
              />
            )}
            {/* 하단 중앙 */}
            {c.mascotPos === "bottom-center" && (
              <Image
                src={c.mascot}
                alt=""
                aria-hidden
                width={90}
                height={60}
                style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, height: 60, width: "auto", objectFit: "contain", pointerEvents: "none" }}
              />
            )}
            {/* 하단 오른쪽 */}
            {c.mascotPos === "bottom-right" && (
              <Image
                src={c.mascot}
                alt=""
                aria-hidden
                width={72}
                height={72}
                style={{ position: "absolute", right: 0, bottom: 0, height: 78, width: "auto", objectFit: "contain", pointerEvents: "none" }}
              />
            )}

            {/* 텍스트: 왼쪽 배치면 오른쪽에 */}
            <div style={{ marginLeft: c.mascotPos === "left" ? "68px" : 0, paddingRight: (c.mascotPos === "right" || c.mascotPos === "bottom-right") ? "58px" : 0 }}>
              {c.count && <div style={{ fontSize: "10px", fontWeight: 700, color: c.accent, marginBottom: "2px" }}>{formatCount(c.count)}</div>}
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#111", lineHeight: 1.25 }}>{c.label}</div>
              <div style={{ fontSize: "10.5px", color: "#aaa", marginTop: "3px", lineHeight: 1.4 }}>{c.helper}</div>
            </div>

            <div style={{ height: "42px" }} />
          </SmartLink>
        ))}
      </div>
    </section>
  );
}
