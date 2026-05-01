import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { buildAdminLoginPath, getAdminAccess } from "@/lib/admin-auth";
import { isAdminConfigured } from "@/lib/admin-access-config";

export const metadata: Metadata = {
  title: "관리자 로그인 | 댕냥지도",
  robots: { index: false, follow: false },
};

type LoginSearchParams = {
  next?: string;
  secret?: string;
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeNextPath(resolvedSearchParams.next);
  const adminConfigured = isAdminConfigured();
  const access = await getAdminAccess(resolvedSearchParams.secret);
  if (access) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] max-w-5xl items-center px-5 py-10">
      <section className="section-shell w-full px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Admin Access</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">세션 기반 관리자 로그인과 역할 권한으로 운영 콘솔에 접근합니다.</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">운영 콘솔은 세션 로그인과 역할 권한을 기준으로 접근합니다. 비상 접근을 남겨두더라도 화면에서는 별도 secret 안내를 노출하지 않습니다.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="card rounded-[1.6rem] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9d8e82]">Role Model</p>
                <p className="mt-3 text-lg font-black">SUPER_ADMIN, OPERATIONS_ADMIN, REVIEWER, ANALYST</p>
                <p className="mt-2 text-sm leading-7 text-[#665950]">운영 편집, 검수, 로그 열람을 역할별로 분리할 수 있게 준비했습니다.</p>
              </div>
              <div className="card rounded-[1.6rem] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9d8e82]">Security</p>
                <p className="mt-3 text-lg font-black">관리자 설정 상태</p>
                <p className="mt-2 text-sm leading-7 text-[#665950]">ADMIN_SECRET이 설정된 환경에서만 관리자 로그인과 관리자 페이지 접근을 허용합니다.</p>
              </div>
            </div>
          </div>

          <div className="card rounded-[2rem] p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Sign In</p>
            <h2 className="mt-3 text-2xl font-black">{adminConfigured ? "관리자 로그인" : "관리자 접근 비활성"}</h2>
            <p className="mt-3 text-sm leading-7 text-[#665950]">
              {adminConfigured
                ? `로그인 성공 후 ${nextPath} 로 이동합니다. 이미 로그인된 세션이 있으면 바로 관리자 화면으로 들어갑니다.`
                : "현재 환경에는 ADMIN_SECRET이 설정되어 있지 않아 관리자 로그인과 관리자 페이지 접근을 허용하지 않습니다."}
            </p>
            {adminConfigured ? <AdminLoginForm callbackUrl={nextPath} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function normalizeNextPath(value?: string) {
  if (!value || !value.startsWith("/admin")) {
    return "/admin";
  }

  if (value === buildAdminLoginPath()) {
    return "/admin";
  }

  return value;
}