import clsx from "clsx";
import { getLatestSuccessfulSync } from "@/lib/foodsafety/sync";

export async function SourceNotice({ className }: { className?: string }) {
  let syncedAtLabel = "최근 반영일 확인 중";
  let syncedCountLabel = "";

  if (process.env.DATABASE_URL) {
    try {
      const lastSync = await getLatestSuccessfulSync();
      if (lastSync?.finishedAt) {
        syncedAtLabel = lastSync.finishedAt.toLocaleDateString("ko-KR");
        syncedCountLabel = lastSync.totalCount > 0 ? `최근에 ${lastSync.totalCount.toLocaleString("ko-KR")}곳을 반영했어요` : "";
      }
    } catch {
      syncedAtLabel = "설정 후 확인 가능";
    }
  }

  return (
    <section className={clsx("card rounded-[1.25rem] p-5 sm:p-6", className)}>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">정보 안내</p>
          <h2 className="mt-4 text-xl font-black tracking-tight">공식 공개자료를 생활에 맞게 정리했어요.</h2>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">식품안전나라 공개자료</span>
        <span className="badge">업데이트 {syncedAtLabel}</span>
        {syncedCountLabel ? <span className="badge">{syncedCountLabel}</span> : null}
      </div>

      <p className="relative z-10 mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
        이 목록은 공개자료를 바탕으로 정리한 안내용 정보입니다. 목록에 없다고 이용이 불가하다고 단정할 수 없으며,
        실제 방문 전에는 영업 여부와 동반 조건을 업소에 직접 물어보는 것이 좋습니다.
      </p>
    </section>
  );
}
