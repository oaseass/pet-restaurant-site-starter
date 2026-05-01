import Link from "next/link";
import { CharacterImage } from "@/components/CharacterImage";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { POLICY_LINKS, PRIMARY_NAV } from "@/lib/platform-content";

export function Footer() {
  return (
    <footer className="mt-24 px-5 pb-28 pt-6 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="section-shell grid gap-4 p-4 sm:p-6 md:grid-cols-[1.45fr_0.85fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[1.8rem] bg-[#18211e] p-6 text-[#f8f2eb]">
            <div className="absolute bottom-0 right-1 h-28 w-28 opacity-95 sm:h-32 sm:w-32">
              <CharacterImage asset="cat-waving" className="h-full w-full" imageClassName="object-contain" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f0caa4]">{BRAND_NAME}</p>
            <h2 className="mt-3 max-w-sm text-2xl font-black tracking-tight">{BRAND_TAGLINE}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#d7ccc2]">
              사용자 검색 시 원본 사이트를 호출하지 않고, 공식 데이터 접근은 서버 배치에서만 처리합니다. 모든 공식/공공 데이터 업데이트는 하루 1회 이하를 원칙으로 운영합니다.
            </p>
          </div>

          <div className="card rounded-[1.8rem] p-5 text-sm text-[#665950]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Quick Links</p>
            <div className="mt-4 flex flex-col gap-3 font-bold">
              {PRIMARY_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="ink-link">{item.label}</Link>
              ))}
            </div>
          </div>

          <div className="card rounded-[1.8rem] p-5 text-sm leading-7 text-[#665950]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Policy</p>
            <div className="mt-4 flex flex-col gap-2">
              {POLICY_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="ink-link">{item.label}</Link>
              ))}
            </div>
            <p className="mt-4">목록에 없다고 이용 불가로 단정하지 않습니다. 최신 조건과 운영 시간은 반드시 공식 기관이나 업체에 다시 확인하세요.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
