import type { Metadata } from "next";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { DataPipelineClient } from "@/components/admin/DataPipelineClient";
import { formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "데이터 파이프라인 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}secret=${encodeURIComponent(secret)}`;
}

export default async function DataPipelinePage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  const access = await requireAdminPageAccess({
    secret,
    requiredRoles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"],
    returnTo: secret ? `/admin/data-pipeline?secret=${encodeURIComponent(secret)}` : "/admin/data-pipeline",
  });

  const pendingGeocodeCount = await prisma.restaurant.count({
    where: {
      status: "ACTIVE",
      OR: [{ lat: null }, { lng: null }],
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <p className="eyebrow">Data Pipeline</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">데이터 파이프라인</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">
              공식 원천 동기화 → 좌표화 → 스냅샷 내보내기를 순서대로 실행합니다.
              공식 원천 연결 실패 시 수동 파일 업로드로 대체할 수 있습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">세션 {access.email}</span>
              <span className="badge">{formatAdminRoles(access.roles)}</span>
              <span className="badge">FoodSafety + Fallback CSV</span>
              <span className="badge">Kakao Geocode</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={withSecret("/admin", secret)} className="btn-secondary">관리자 허브</a>
            <a href={withSecret("/admin/sync-logs", secret)} className="btn-secondary">동기화 로그</a>
            {access.method === "session" ? <AdminSignOutButton /> : null}
          </div>
        </div>
      </section>

      <div className="mt-6">
        <DataPipelineClient secret={secret} pendingGeocodeCount={pendingGeocodeCount} />
      </div>
    </main>
  );
}
