import Link from "next/link";
import { Map, MapPin, AlertTriangle, Plus } from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: Map,
    title: "지도에서 찾기",
    desc: "위치 기반으로 가까운 식당 탐색",
    href: "/map",
    cta: "지도 열기",
  },
  {
    icon: MapPin,
    title: "지역별 찾기",
    desc: "서울, 경기, 부산 등 지역 선택",
    href: "/search",
    cta: "지역 검색",
  },
  {
    icon: AlertTriangle,
    title: "보호동물 공고",
    desc: "지자체·보호소 공개 보호동물 목록",
    href: "/lost-pets?tab=shelter",
    cta: "공고 보기",
  },
  {
    icon: Plus,
    title: "업체 등록",
    desc: "식당·장소 신규 등록 요청",
    href: "/business",
    cta: "등록하기",
  },
] as const;

export function HomeQuickActions() {
  return (
    <section style={{ padding: "16px 14px 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
        }}
      >
        {QUICK_ACTIONS.map(({ icon: Icon, title, desc, href, cta }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "12px",
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--brand-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={16} color="var(--brand)" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{title}</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{desc}</div>
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--brand)",
                marginTop: "2px",
              }}
            >
              {cta} →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
