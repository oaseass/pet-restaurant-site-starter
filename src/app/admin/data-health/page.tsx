import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

export const metadata: Metadata = {
  title: "데이터 헬스 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DataHealthPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  if (!isAdminAuthorized(secret)) {
    return <main className="mx-auto max-w-3xl px-5 py-10"><div className="card rounded-[2rem] p-6 text-sm leading-7 text-[#665950]">관리자 인증이 필요합니다. query string으로 secret을 전달해 주세요.</div></main>;
  }

  const [restaurantCount, placeCount, lostPetCount, pendingClaims, pendingReports, lastLogs] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.lostPet.count({ where: { status: "PENDING" } }),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.priceReport.count({ where: { status: "PENDING" } }),
    prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 8 }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">데이터 헬스</h1>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat title="식당" value={restaurantCount.toLocaleString("ko-KR")} />
        <Stat title="장소" value={placeCount.toLocaleString("ko-KR")} />
        <Stat title="실종 대기" value={lostPetCount.toLocaleString("ko-KR")} />
        <Stat title="업체 요청 대기" value={pendingClaims.toLocaleString("ko-KR")} />
        <Stat title="가격 제보 대기" value={pendingReports.toLocaleString("ko-KR")} />
      </section>

      <section className="mt-6 card rounded-[2rem] p-6">
        <h2 className="text-2xl font-black">최근 동기화</h2>
        <div className="mt-4 space-y-3">
          {lastLogs.map((log) => (
            <div key={log.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black">{log.source}</p>
                  <p className="mt-1 text-[#665950]">{log.startedAt.toLocaleString("ko-KR")} · {log.mode}</p>
                </div>
                <SyncStatusBadge status={log.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="stat-tile"><p className="text-xs font-black text-[#9d8e82]">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}