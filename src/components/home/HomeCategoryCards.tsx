import Image from "next/image";
import { SmartLink } from "@/components/SmartLink";
import type { PublicCategoryCounts } from "@/lib/public-data";

import imgHospital   from "../../../public/images/characters/theme-hospital.png";
import imgRestaurant from "../../../public/images/characters/theme-restaurant.png";
import imgGrooming   from "../../../public/images/characters/theme-grooming.png";
import imgHotel      from "../../../public/images/characters/theme-hotel.png";
import imgPharmacy   from "../../../public/images/characters/theme-pharmacy.png";
import imgMemorial   from "../../../public/images/characters/theme-memorial.png";
import imgMaltese    from "../../../public/images/characters/gen-maltese.png";

import type { StaticImageData } from "next/image";

interface CardDef {
  label: string;
  href: string;
  helper: string;
  mascot: StaticImageData;
  accent: string;
  bg: string;
  border: string;
  hero?: boolean;
}

const CARDS: CardDef[] = [
  {
    label: "동물병원",
    href: "/hospitals",
    helper: "오늘 진료는 전화로 확인",
    mascot: imgHospital,
    accent: "rgba(255,255,255,0.6)",
    bg: "linear-gradient(135deg, #1a5c4d 0%, #237a67 100%)",
    border: "transparent",
    hero: true,
  },
  {
    label: "동반 식당",
    href: "/restaurants",
    helper: "좌석은 가기 전 확인",
    mascot: imgRestaurant,
    accent: "#b06820",
    bg: "linear-gradient(150deg, #fffaf0 0%, #fff3e0 100%)",
    border: "#edd9b8",
  },
  {
    label: "미용",
    href: "/grooming",
    helper: "견종·크기 먼저 확인",
    mascot: imgGrooming,
    accent: "#b0486a",
    bg: "linear-gradient(150deg, #fff5f8 0%, #ffe8f0 100%)",
    border: "#f0ccd8",
  },
  {
    label: "유치원·호텔",
    href: "/daycare",
    helper: "입소 조건 상담",
    mascot: imgHotel,
    accent: "#3a6898",
    bg: "linear-gradient(150deg, #f2f8ff 0%, #e4f0ff 100%)",
    border: "#c4daf0",
  },
  {
    label: "동물약국",
    href: "/pharmacy",
    helper: "재고는 전화 확인",
    mascot: imgPharmacy,
    accent: "#4466aa",
    bg: "linear-gradient(150deg, #f8f8ff 0%, #f0f2ff 100%)",
    border: "#d8ddf0",
  },
  {
    label: "장례",
    href: "/funeral",
    helper: "절차·비용 물어보기",
    mascot: imgMemorial,
    accent: "#7a6aaa",
    bg: "linear-gradient(150deg, #faf8ff 0%, #f2eeff 100%)",
    border: "#ddd8f0",
  },
  {
    label: "찾아요",
    href: "/lost-pets",
    helper: "지역별 공고 보기",
    mascot: imgMaltese,
    accent: "#c05030",
    bg: "linear-gradient(150deg, #fff8f5 0%, #fff0ec 100%)",
    border: "#f0d8d0",
  },
];

const COUNT_KEYS: Record<string, keyof NonNullable<PublicCategoryCounts["placeCategoryCounts"]>> = {
  "미용": "GROOMING",
  "유치원·호텔": "DAYCARE",
  "장례": "FUNERAL",
  "동물약국": "PHARMACY",
  "동물병원": "ANIMAL_HOSPITAL",
};

function getCount(label: string, counts: PublicCategoryCounts): number | null {
  if (label === "동반 식당") return counts.restaurantCount || null;
  if (label === "찾아요") return counts.lostPetCount || null;
  const key = COUNT_KEYS[label];
  return key ? (counts.placeCategoryCounts?.[key] ?? null) : null;
}

function fmt(n: number | null): string | null {
  if (!n) return null;
  if (n >= 10000) return `${Math.floor(n / 1000)}천+곳`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천곳`;
  return `${n}곳`;
}

export function HomeCategoryCards({ counts }: { counts: PublicCategoryCounts }) {
  const [hero, ...rest] = CARDS;

  return (
    <section style={{ padding: "12px 14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#aaa", letterSpacing: "0.06em" }}>무엇을 찾으세요?</span>
        <SmartLink href="/categories" style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>
          전체 보기 →
        </SmartLink>
      </div>

      {/* 히어로 카드 */}
      <SmartLink
        href={hero.href}
        style={{
          position: "relative",
          display: "block",
          overflow: "hidden",
          borderRadius: "16px",
          background: hero.bg,
          minHeight: "120px",
          padding: "20px 20px 20px 20px",
          textDecoration: "none",
          marginBottom: "8px",
          boxShadow: "0 4px 20px rgba(31,107,91,0.25)",
        }}
      >
        <Image
          src={hero.mascot}
          alt=""
          aria-hidden
          width={120}
          height={120}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            height: 120,
            width: "auto",
            objectFit: "contain",
            pointerEvents: "none",
            filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.15))",
          }}
        />
        <div style={{ paddingRight: "130px" }}>
          {fmt(getCount(hero.label, counts)) && (
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              {fmt(getCount(hero.label, counts))}
            </div>
          )}
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{hero.label}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>{hero.helper}</div>
        </div>
      </SmartLink>

      {/* 2컬럼 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {rest.map((c) => {
          const count = fmt(getCount(c.label, counts));
          return (
            <SmartLink
              key={c.href}
              href={c.href}
              style={{
                position: "relative",
                display: "block",
                overflow: "hidden",
                borderRadius: "16px",
                border: `1px solid ${c.border}`,
                background: c.bg,
                minHeight: "120px",
                padding: "14px 14px 0 14px",
                textDecoration: "none",
              }}
            >
              {/* 마스코트: 모든 카드 우측 하단 고정 */}
              <Image
                src={c.mascot}
                alt=""
                aria-hidden
                width={80}
                height={80}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  height: 78,
                  width: "auto",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
              {/* 텍스트: 우측 여백으로 마스코트와 안 겹침 */}
              <div style={{ paddingRight: "64px" }}>
                {count && (
                  <div style={{ fontSize: "10px", fontWeight: 700, color: c.accent, marginBottom: "3px" }}>
                    {count}
                  </div>
                )}
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#111", lineHeight: 1.2 }}>{c.label}</div>
                <div style={{ fontSize: "10.5px", color: "#bbb", marginTop: "4px", lineHeight: 1.45 }}>{c.helper}</div>
              </div>
              <div style={{ height: "52px" }} />
            </SmartLink>
          );
        })}
      </div>
    </section>
  );
}
