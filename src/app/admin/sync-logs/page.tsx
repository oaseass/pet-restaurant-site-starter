import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminPageAccess } from "@/lib/admin-auth";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

export const metadata: Metadata = {
  title: "동기화 로그 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SyncLogsPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  await requireAdminPageAccess({
    secret,
    requiredRoles: ["SUPER_ADMIN", "ANALYST", "OPERATIONS_ADMIN"],
    returnTo: secret ? `/admin/sync-logs?secret=${encodeURIComponent(secret)}` : "/admin/sync-logs",
  });

  const logs = await prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 50 });

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">동기화 로그</h1>
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-[rgba(56,41,29,0.08)] bg-white/80">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-[rgba(56,41,29,0.08)] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
          <span>Source</span>
          <span>Status</span>
          <span>Total</span>
          <span>Started</span>
          <span>Message</span>
        </div>
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-[rgba(56,41,29,0.06)] px-5 py-4 text-sm last:border-b-0">
            <div className="font-black">{log.source}</div>
            <div><SyncStatusBadge status={log.status} /></div>
            <div>{log.totalCount.toLocaleString("ko-KR")}</div>
            <div>{log.startedAt.toLocaleDateString("ko-KR")}</div>
            <div className="text-[#665950]">{log.message ?? log.skippedReason ?? log.errorMessage ?? "-"}</div>
          </div>
        ))}
      </section>
    </main>
  );
}