import Image from "next/image";
import { SmartLink } from "@/components/SmartLink";
import type { CategorySummary } from "@/lib/platform-content";

const CHARACTER_PATHS: Record<string, string> = {
  "puppy-front-white": "/images/characters/puppy-front-white.png",
  "puppy-side-white": "/images/characters/puppy-side-white.png",
  "dog-hoodie": "/images/characters/dog-hoodie.png",
  "dog-brown": "/images/characters/dog-brown.png",
  "cat-waving": "/images/characters/cat-waving.png",
  "cat-peeking": "/images/characters/cat-peeking.png",
  "theme-hospital": "/images/characters/theme-hospital.png",
  "theme-restaurant": "/images/characters/theme-restaurant.png",
  "theme-grooming": "/images/characters/theme-grooming.png",
  "theme-hotel": "/images/characters/theme-hotel.png",
  "theme-pharmacy": "/images/characters/theme-pharmacy.png",
  "theme-memorial": "/images/characters/theme-memorial.png",
  "gen-shiba": "/images/characters/gen-shiba.png",
  "gen-corgi": "/images/characters/gen-corgi.png",
  "gen-maltese": "/images/characters/gen-maltese.png",
};

const TONE_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
  medical: { bg: "linear-gradient(135deg,#f0f9f6 0%,#e8f5f0 100%)", border: "#c8e8de", accent: "#1f6b5b" },
  travel:  { bg: "linear-gradient(135deg,#fff8f0 0%,#fff2e4 100%)", border: "#f0dfc8", accent: "#b06820" },
  calm:    { bg: "linear-gradient(135deg,#f8f4ff 0%,#f2ecfa 100%)", border: "#e0d8ec", accent: "#9080b0" },
  playful: { bg: "linear-gradient(135deg,#fff5f8 0%,#ffeef4 100%)", border: "#f0d8e0", accent: "#c0607a" },
  default: { bg: "#ffffff", border: "#e8e8e8", accent: "#1f6b5b" },
};

export function CategoryCard({ category }: { category: CategorySummary }) {
  const style = TONE_STYLES[category.tone ?? "default"];
  const imgSrc = CHARACTER_PATHS[category.character] ?? CHARACTER_PATHS["gen-shiba"];

  return (
    <SmartLink
      href={category.href}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: `1px solid ${style.border}`,
        borderRadius: "16px",
        background: style.bg,
        padding: "18px 18px 14px",
        minHeight: "140px",
        textDecoration: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* 캐릭터 이미지: 오른쪽 하단 */}
      <Image
        src={imgSrc}
        alt=""
        aria-hidden
        width={90}
        height={90}
        style={{
          position: "absolute",
          right: 6,
          bottom: 0,
          height: 90,
          width: "auto",
          objectFit: "contain",
          pointerEvents: "none",
          filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.08))",
        }}
      />

      <div style={{ paddingRight: "80px" }}>
        <p style={{ fontSize: "11px", fontWeight: 800, color: style.accent, letterSpacing: "0.03em", marginBottom: "6px" }}>
          {category.shortLabel}
        </p>
        <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#111", lineHeight: 1.25, margin: 0 }}>
          {category.title}
        </h3>
      </div>

      <p style={{ fontSize: "12px", lineHeight: 1.65, color: "#888", margin: "12px 0 0", paddingRight: "80px" }}>
        {category.description}
      </p>
    </SmartLink>
  );
}
