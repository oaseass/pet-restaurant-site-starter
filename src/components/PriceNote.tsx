export function PriceNote({ className }: { className?: string }) {
  return (
    <section className={`card rounded-[1.7rem] p-5 text-sm leading-7 text-[#5f5550] ${className ?? ""}`.trim()}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8b6a20]">Price Note</p>
      <p className="mt-3">가격 정보는 공개 자료, 사용자 제보, 업체 등록을 기반으로 한 참고값입니다. 실제 결제 금액은 시점과 옵션, 지역에 따라 달라질 수 있어 확정 가격처럼 단정하지 않습니다.</p>
    </section>
  );
}