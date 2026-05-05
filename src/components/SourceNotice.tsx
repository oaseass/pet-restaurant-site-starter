import clsx from "clsx";
import { getLatestSuccessfulSync } from "@/lib/foodsafety/sync";

export async function SourceNotice({ className }: { className?: string }) {
  let syncedAtLabel = "동기화 이력 확인 전";
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
    <section className={clsx("card rounded-[1.25rem] p-5 sm:p-6", className)}>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">운영 안내</p>
          <h2 className="mt-4 text-xl font-black tracking-tight">공개 정보를 보기 쉽게 정리해 안내합니다.</h2>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">식품안전나라 공개 정보</span>
        <span className="badge">업데이트 기준일 {syncedAtLabel}</span>
        {syncedCountLabel ? <span className="badge">{syncedCountLabel}</span> : null}
      </div>

      <p className="relative z-10 mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
        이 목록은 공개 정보를 바탕으로 보기 쉽게 정리한 안내용 데이터입니다. 목록에 없다고 이용이 불가하다고 단정할 수 없으며,
        실제 방문 전에는 영업 여부와 동반 조건을 업소에 직접 확인해 주세요.
      </p>
    </section>
  );
}
