import type { ReactNode } from "react";

export function ResponsiveMapLayout({
  sidebar,
  title,
  description,
}: {
  sidebar: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <div className="space-y-4">{sidebar}</div>
      <aside className="section-shell min-h-[420px] p-5">
        <div className="relative z-10 flex h-full flex-col rounded-[1.8rem] border border-[rgba(56,41,29,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(243,239,234,0.9))] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Map Layout</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight">{title}</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#665950]">{description}</p>
          <div className="mt-5 flex-1 rounded-[1.5rem] border border-dashed border-[rgba(56,41,29,0.12)] bg-[radial-gradient(circle_at_20%_20%,rgba(189,237,220,0.45),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(255,184,107,0.35),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,244,238,0.95))] p-4">
            <div className="grid h-full place-items-center rounded-[1.2rem] border border-white/75 bg-white/40 text-center text-sm font-semibold text-[#6a5f58]">
              데스크톱에서는 리스트 40% + 지도 60% 구조를 유지합니다.<br />모바일에서는 지도/리스트 탭 전환과 bottom sheet 필터를 사용합니다.
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}