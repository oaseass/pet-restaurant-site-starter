import { ClipboardCheck, HeartPulse, MapPinned, PawPrint } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

const START_PATHS = [
  {
    icon: MapPinned,
    title: "근처에서 바로 찾기",
    desc: "현재 위치나 지역명으로 식당과 시설을 비교합니다.",
    href: "/map",
    cta: "지도 열기",
  },
  {
    icon: HeartPulse,
    title: "병원·약국 먼저 보기",
    desc: "진료와 약품 문의가 필요할 때 빠르게 이동합니다.",
    href: "/map?category=hospitals",
    cta: "병원 지도",
  },
  {
    icon: PawPrint,
    title: "보호동물 공고 확인",
    desc: "최근 보호소 공고를 30건 단위로 확인합니다.",
    href: "/lost-pets?tab=shelter",
    cta: "공고 보기",
  },
  {
    icon: ClipboardCheck,
    title: "방문 전 체크",
    desc: "여행, 접종, 미용, 장례처럼 준비가 필요한 상황을 봅니다.",
    href: "/guide",
    cta: "가이드 보기",
  },
] as const;

export function HomeStartPaths() {
  return (
    <section style={{ padding: "14px 14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#999", letterSpacing: "0.05em" }}>상황별 시작</div>
        <SmartLink href="/search" style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>
          검색으로 찾기 →
        </SmartLink>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
        {START_PATHS.map(({ icon: Icon, title, desc, href, cta }) => (
          <SmartLink
            key={href}
            href={href}
            pendingLabel={href.startsWith("/map") ? "지도 여는 중..." : "이동 중..."}
            style={{
              display: "flex",
              minHeight: "132px",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
              padding: "12px",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              background: "#fff",
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            <div>
              <span style={{ display: "inline-flex", width: "32px", height: "32px", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "var(--brand-soft)", color: "var(--brand)" }}>
                <Icon size={17} />
              </span>
              <div style={{ marginTop: "9px", fontSize: "13px", fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: "4px", fontSize: "11px", lineHeight: 1.55, color: "var(--muted)" }}>{desc}</div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--brand)" }}>{cta} →</span>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}