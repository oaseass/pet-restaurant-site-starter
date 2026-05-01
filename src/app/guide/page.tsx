import { SourceNotice } from "@/components/SourceNotice";
import { AdSlot } from "@/components/AdSlot";

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="card rounded-[2.5rem] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700/80">Guide</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">반려동물 동반 식당 이용 가이드</h1>
        <div className="mt-6 space-y-8 leading-8 text-gray-700">
          <div>
            <h2 className="text-xl font-black text-gray-950">방문 전 확인할 것</h2>
            <p className="mt-3">공식 등록 정보는 조회 기준 정보입니다. 실제 입장 조건은 업소별 운영 방식에 따라 달라질 수 있으므로 방문 전 확인이 필요합니다.</p>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">반려동물 동반 매너</h2>
            <p className="mt-3">목줄 또는 케이지 사용, 배변 처리, 짖음 관리, 다른 손님과의 거리 유지가 중요합니다.</p>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">목록에 없는 식당</h2>
            <p className="mt-3">목록에 없다고 해서 무조건 동반 불가로 단정할 수 없습니다. 업소가 관련 시설 기준과 준수사항을 지키는 경우 동반이 가능할 수 있으므로 업소 또는 관할 지자체에 확인해야 합니다.</p>
          </div>
        </div>
      </section>
      <AdSlot label="가이드 페이지 광고 영역" />
      <SourceNotice className="mt-5" />
    </main>
  );
}
