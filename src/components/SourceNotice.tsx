import clsx from "clsx";
import { getLatestSuccessfulSync } from "@/lib/foodsafety/sync";

export async function SourceNotice({ className }: { className?: string }) {
  let syncedAtLabel = "동기화 준비 중";
  let syncedCountLabel = "";

  if (process.env.DATABASE_URL) {
    try {
      const lastSync = await getLatestSuccessfulSync();
      if (lastSync?.finishedAt) {
        syncedAtLabel = lastSync.finishedAt.toLocaleDateString("ko-KR");
        syncedCountLabel = lastSync.totalCount > 0 ? `최근 반영 ${lastSync.totalCount.toLocaleString("ko-KR")}곳` : "";
      }
    } catch {
      syncedAtLabel = "환경 설정 후 확인 가능";
    }
  }

  return (
    <section className={clsx("card rounded-[2rem] p-5 sm:p-6", className)}>
      <div className="flex flex-wrap gap-2">
        <span className="badge bg-emerald-50 text-emerald-800">데이터 출처 식품안전나라 공개 정보</span>
        <span className="badge">데이터 기준일 {syncedAtLabel}</span>
        <span className="badge">사용자 검색 시 원본 재호출 없음</span>
        {syncedCountLabel ? <span className="badge">{syncedCountLabel}</span> : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-[15px]">
        이 목록은 공식 공개 정보를 보기 쉽게 정리한 조회용 데이터입니다. 목록에 없다고 불법이거나 반려동물 동반이 불가하다고 단정할 수 없으며,
        실제 방문 전에는 영업 여부와 동반 조건을 업소에 직접 확인해야 합니다.
      </p>
    </section>
  );
}
