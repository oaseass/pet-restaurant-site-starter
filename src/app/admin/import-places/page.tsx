import type { Metadata } from "next";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { ImportPlacesClient } from "@/components/admin/ImportPlacesClient";
import { formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { PLACE_SOURCE_REGISTRY, PLACE_SOURCE_KEYS } from "@/lib/place-source-registry";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "비식당 장소 가져오기 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}secret=${encodeURIComponent(secret)}`;
}

export default async function ImportPlacesPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  const access = await requireAdminPageAccess({
    secret,
    requiredRoles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"],
    returnTo: secret ? `/admin/import-places?secret=${encodeURIComponent(secret)}` : "/admin/import-places",
  });

  // 카테고리별 현재 저장된 건수 + 마지막 SyncLog 조회
  const [categoryCounts, syncLogs] = await Promise.all([
    prisma.place.groupBy({
      by: ["category"],
      where: {
        isActive: true,
        category: { in: ["ANIMAL_HOSPITAL", "GROOMING", "DAYCARE", "FUNERAL"] },
      },
      _count: { _all: true },
    }),
    prisma.syncLog.findMany({
      where: {
        source: {
          in: ["LOCALDATA_ANIMAL_HOSPITAL", "LOCALDATA_GROOMING", "LOCALDATA_DAYCARE", "LOCALDATA_FUNERAL"],
        },
        status: "SUCCESS",
      },
      orderBy: { finishedAt: "desc" },
      take: 20,
    }),
  ]);

  const countMap = new Map(categoryCounts.map((c) => [c.category, c._count._all]));
  const syncLogMap = new Map<string, (typeof syncLogs)[number]>();
  for (const log of syncLogs) {
    if (!syncLogMap.has(log.source)) syncLogMap.set(log.source, log);
  }

  const sources = PLACE_SOURCE_KEYS.map((key) => {
    const entry = PLACE_SOURCE_REGISTRY[key];
    const log = syncLogMap.get(entry.syncSource);
    return {
      category: entry.category,
      label: entry.label,
      syncSource: entry.syncSource,
      dataGoKrId: entry.dataGoKrId,
      sourceUrl: entry.sourceUrl,
      estimatedCount: entry.estimatedCount,
      currentCount: countMap.get(entry.category) ?? 0,
      lastSync: log
        ? {
            at: log.finishedAt?.toISOString() ?? log.startedAt.toISOString(),
            created: log.addedCount,
            updated: log.updatedCount,
          }
        : null,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <p className="eyebrow">Import Places</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">비식당 장소 가져오기</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">
              행정안전부 공공데이터 원천에서 병원·미용·유치원·장례 장소를 가져옵니다.
              공식 원천 접근 실패 시 data.go.kr에서 직접 내려받아 수동 업로드할 수 있습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">세션 {access.email}</span>
              <span className="badge">{formatAdminRoles(access.roles)}</span>
              <span className="badge">행정안전부 공공데이터</span>
              <span className="badge">단일 시도 · 재시도 없음</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={withSecret("/admin", secret)} className="btn-secondary">관리자 허브</a>
            <a href={withSecret("/admin/data-pipeline", secret)} className="btn-secondary">데이터 파이프라인</a>
            <a href={withSecret("/admin/sync-logs", secret)} className="btn-secondary">동기화 로그</a>
            {access.method === "session" ? <AdminSignOutButton /> : null}
          </div>
        </div>
      </section>

      {/* 안내 */}
      <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800">
        <p className="font-black">주의사항</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>· file.localdata.go.kr 접근 실패 시 재시도하지 않습니다. 수동 업로드를 사용하세요.</li>
          <li>· 가져온 데이터는 Place 테이블에 upsert됩니다. 기존 좌표가 있으면 유지됩니다.</li>
          <li>· 가져오기 완료 후 좌표화는 데이터 파이프라인 페이지에서 실행하세요.</li>
          <li>· 스냅샷 갱신(public/data) 역시 데이터 파이프라인 페이지에서 실행하세요.</li>
        </ul>
      </div>

      <div className="mt-6">
        <ImportPlacesClient sources={sources} secret={secret} />
      </div>
    </main>
  );
}
