import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { POLICY_LINKS, PRIMARY_NAV } from "@/lib/platform-content";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] px-5 pb-28 pt-8 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <p className="text-lg font-black tracking-tight text-[var(--ink)]">{BRAND_NAME}</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--ink)]">{BRAND_TAGLINE}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
              반려동물 동반 식당과 생활 정보를 지도와 리스트로 정돈해 보여주는 지역 기반 서비스입니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              방문 전에는 운영 시간과 동반 조건을 업소에 다시 확인해 주세요.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-[var(--ink)]">바로가기</p>
            <div className="mt-4 flex flex-col gap-3 text-sm font-bold text-[var(--muted)]">
              {PRIMARY_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="ink-link">{item.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-[var(--ink)]">운영 안내</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--muted)]">
              {POLICY_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="ink-link">{item.label}</Link>
              ))}
              <p className="pt-2 leading-7">목록에 없다고 이용이 불가하다고 단정할 수 없습니다. 최신 조건은 업체와 기관에 직접 확인해 주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
