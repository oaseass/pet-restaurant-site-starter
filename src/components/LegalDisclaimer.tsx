export function LegalDisclaimer({ className }: { className?: string }) {
  return (
    <section className={`card rounded-[1.7rem] p-5 text-sm leading-7 text-[#5f5550] ${className ?? ""}`.trim()}>
      <p className="text-[11px] font-black tracking-[0.04em] text-[#8b6a20]">법률·규정 안내</p>
      <p className="mt-3">동물등록, 과태료, 항공·선박 규정 등 법률·규정 정보는 기준일 이후 변경될 수 있습니다. 반드시 공식 기관과 사업자 안내를 다시 확인하세요.</p>
    </section>
  );
}