export function MedicalDisclaimer({ className }: { className?: string }) {
  return (
    <section className={`card rounded-[1.7rem] p-5 text-sm leading-7 text-[#5f5550] ${className ?? ""}`.trim()}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#b13f3f]">Medical Disclaimer</p>
      <p className="mt-3">의료, 예방접종, 수술, 처방식 정보는 일반 참고용입니다. 아이의 상태에 따라 진단과 처치는 달라질 수 있으므로 반드시 수의사 상담이 필요합니다.</p>
    </section>
  );
}