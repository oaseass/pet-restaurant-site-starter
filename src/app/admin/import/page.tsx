import type { Metadata } from "next";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { AdminImportWorkbench } from "@/components/admin/AdminImportWorkbench";
import { formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "수동 import | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminImportPage({ searchParams }: { searchParams: Promise<{ secret?: string }> }) {
  const { secret } = await searchParams;
  const access = await requireAdminPageAccess({
    secret,
    requiredRoles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"],
    returnTo: secret ? `/admin/import?secret=${encodeURIComponent(secret)}` : "/admin/import",
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <p className="eyebrow">Admin Import</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">외부 원천 없이 preview 후 승인 반영하는 수동 import</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">병원, 미용, 유치원, 장례 카테고리는 외부 LocalData 재시도 없이 운영자가 검토한 파일만 받아 staging preview를 확인한 뒤 반영합니다.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">세션 {access.email}</span>
              <span className="badge">{formatAdminRoles(access.roles)}</span>
              <span className="badge">Preview first</span>
              <span className="badge">MANUAL_DATA only</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={withSecret("/admin", secret)} className="btn-secondary">관리자 허브</a>
            <a href={withSecret("/admin/places", secret)} className="btn-secondary">장소 관리</a>
            {access.method === "session" ? <AdminSignOutButton /> : null}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <AdminImportWorkbench
          previewEndpoint={withSecret("/api/admin/import/preview", secret)}
          applyEndpoint={withSecret("/api/admin/import/apply", secret)}
          templateHref={withSecret("/api/admin/manual-place-template", secret)}
        />
      </section>
    </main>
  );
}

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}secret=${encodeURIComponent(secret)}`;
}