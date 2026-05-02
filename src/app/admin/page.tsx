import type { Metadata } from "next";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { prisma } from "@/lib/prisma";
import { formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { isExternalSyncDisabled } from "@/lib/external-sync";
import { MANUAL_PLACE_TEMPLATE_COLUMNS } from "@/lib/admin/manual-place-upload";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

export const metadata: Metadata = {
  title: "운영 관리자 콘솔 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminSearchParams = {
  secret?: string;
  uploadStatus?: string;
  uploadRows?: string;
  added?: string;
  updated?: string;
  deactivated?: string;
  profiles?: string;
  uploadMessage?: string;
};

export default async function AdminConsolePage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  const access = await requireAdminPageAccess({ secret, returnTo: buildAdminConsolePath({ secret }) });

  const [
    activeRestaurantCount,
    removedRestaurantCount,
    activePlaceCount,
    manualPlaceCount,
    ownerVerifiedPlaceCount,
    guideCount,
    lostPetCount,
    pendingLostPetCount,
    pendingClaimCount,
    pendingReportCount,
    failedSyncCount,
    recentPlaces,
    recentRestaurants,
    recentGuides,
    recentLostPets,
    recentClaims,
    recentPriceReports,
    recentLostPetReports,
    recentSyncLogs,
    placeCategoryGroups,
    placeSourceGroups,
    distinctClaimContacts,
    distinctLostPetContacts,
    distinctLostPetReportContacts,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { status: "ACTIVE" } }),
    prisma.restaurant.count({ where: { status: "REMOVED_FROM_SOURCE" } }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.place.count({ where: { isActive: true, sourceType: "MANUAL_DATA" } }),
    prisma.place.count({ where: { isActive: true, ownerVerified: true } }),
    prisma.guide.count(),
    prisma.lostPet.count(),
    prisma.lostPet.count({ where: { status: "PENDING" } }),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.priceReport.count({ where: { status: "PENDING" } }),
    prisma.syncLog.count({ where: { status: "FAILED" } }),
    prisma.place.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { profile: true },
    }),
    prisma.restaurant.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.guide.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.lostPet.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.businessClaim.findMany({
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: { place: true },
    }),
    prisma.priceReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { place: true },
    }),
    prisma.lostPetReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { lostPet: true },
    }),
    prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    prisma.place.groupBy({ by: ["category"], where: { isActive: true }, _count: { _all: true } }),
    prisma.place.groupBy({ by: ["sourceType"], where: { isActive: true }, _count: { _all: true } }),
    prisma.businessClaim.findMany({ distinct: ["phoneMasked"], select: { phoneMasked: true } }),
    prisma.lostPet.findMany({ distinct: ["contactMasked"], select: { contactMasked: true } }),
    prisma.lostPetReport.findMany({ distinct: ["reporterContactMasked"], select: { reporterContactMasked: true } }),
  ]);

  const contributorCount = new Set([
    ...distinctClaimContacts.map((item) => item.phoneMasked),
    ...distinctLostPetContacts.map((item) => item.contactMasked),
    ...distinctLostPetReportContacts.map((item) => item.reporterContactMasked),
  ].filter(Boolean)).size;

  const participantFeed = [
    ...recentClaims.map((item) => ({
      id: `claim-${item.id}`,
      kind: "업체 요청",
      title: item.businessName,
      meta: `${item.ownerName} · ${item.phoneMasked}`,
      description: item.place?.name ? `연결 장소 ${item.place.name}` : item.requestType,
      createdAt: item.submittedAt,
    })),
    ...recentLostPets.map((item) => ({
      id: `lost-${item.id}`,
      kind: "실종 등록",
      title: item.petName,
      meta: item.contactMasked,
      description: `${item.lostSido}${item.lostSigungu ? ` · ${item.lostSigungu}` : ""}`,
      createdAt: item.createdAt,
    })),
    ...recentLostPetReports.map((item) => ({
      id: `report-${item.id}`,
      kind: "목격 제보",
      title: item.lostPet.petName,
      meta: `${item.reporterName} · ${item.reporterContactMasked}`,
      description: item.seenAddress,
      createdAt: item.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10);

  const externalSyncDisabled = isExternalSyncDisabled();
  const categorySummary = [...placeCategoryGroups].sort((left, right) => right._count._all - left._count._all);
  const sourceSummary = [...placeSourceGroups].sort((left, right) => right._count._all - left._count._all);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="eyebrow">Admin Console</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">운영, 수동업데이트, 검수, 통계를 한곳에서 보는 관리자 허브</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">세션 로그인 기반 관리자 접근과 역할 권한을 기준으로 운영 콘솔을 구성했습니다. 장소 편집, 수동 업로드, 검수, 통계 확인을 한곳에서 처리할 수 있습니다.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">외부 동기화 {externalSyncDisabled ? "차단중" : "활성"}</span>
              <span className="badge">수동 엑셀 업로드 지원</span>
              <span className="badge">검수센터 연동</span>
              <span className="badge">동기화 로그 연동</span>
              <span className="badge">{access.method === "session" ? `세션 ${access.email}` : "비상 secret 접근"}</span>
              <span className="badge">{formatAdminRoles(access.roles)}</span>
            </div>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <AdminLinkCard title="검수센터" description="실종 제보, 업체 요청, 가격 제보 처리" href={withSecret("/admin/data-health", secret)} />
            <AdminLinkCard title="장소 관리" description="실제 장소 필드를 검색하고 바로 수정" href={withSecret("/admin/places", secret)} />
            <AdminLinkCard title="데이터 파이프라인" description="공식 동기화 → 좌표화 → 스냅샷 갱신" href={withSecret("/admin/data-pipeline", secret)} />
            <AdminLinkCard title="비식당 장소 가져오기" description="병원·미용·유치원·장례 공공데이터 import" href={withSecret("/admin/import-places", secret)} />
            <AdminLinkCard title="수동 import" description="XLSX/CSV 업로드 후 preview 승인 반영" href={withSecret("/admin/import", secret)} />
            <AdminLinkCard title="동기화 로그" description="실패, skipped, 최근 배치 흐름 확인" href={withSecret("/admin/sync-logs", secret)} />
            <AdminLinkCard title="수동 업로드 양식" description="규격화된 xlsx 템플릿 즉시 다운로드" href={withSecret("/api/admin/manual-place-template", secret)} />
            <AdminLinkCard title="공개 검색 확인" description="운영 반영 후 검색/목록 페이지로 바로 점검" href="/places" />
          </div>
          {access.method === "session" ? <div className="w-full pt-2"><AdminSignOutButton /></div> : null}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="활성 장소" value={formatNumber(activePlaceCount)} note={`수동 데이터 ${formatNumber(manualPlaceCount)}건`} />
        <Stat title="업체 인증 장소" value={formatNumber(ownerVerifiedPlaceCount)} note="ownerVerified 기준" />
        <Stat title="공개 식당" value={formatNumber(activeRestaurantCount)} note={`원천 제외 ${formatNumber(removedRestaurantCount)}건`} />
        <Stat title="가이드 문서" value={formatNumber(guideCount)} note="관리자 검수형 콘텐츠" />
        <Stat title="검수 대기" value={formatNumber(pendingLostPetCount + pendingClaimCount + pendingReportCount)} note={`실종 ${pendingLostPetCount} · 업체 ${pendingClaimCount} · 가격 ${pendingReportCount}`} />
        <Stat title="참여자" value={formatNumber(contributorCount)} note="제보자·업체 요청자·목격 제보자 기준" />
        <Stat title="실종 제보 누적" value={formatNumber(lostPetCount)} note="게시형 콘텐츠 운영 수치" />
        <Stat title="실패한 배치" value={formatNumber(failedSyncCount)} note="최근 전체 실패 누적" />
      </section>

      <section id="manual-update" className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="card rounded-[2rem] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Manual Update</p>
              <h2 className="mt-3 text-2xl font-black">preview 확인 후 승인 반영하는 수동 import</h2>
              <p className="mt-3 text-sm leading-7 text-[#665950]">이제 수동 업로드는 `/admin/import`에서 staging preview를 먼저 확인한 뒤 승인 반영합니다. production에서는 외부 LocalData 원천을 다시 호출하지 않고, 관리자 검수 파일만 MANUAL_DATA로 적재합니다.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={withSecret("/admin/import", secret)} className="btn-primary">수동 import 열기</a>
              <a href={withSecret("/api/admin/manual-place-template", secret)} className="btn-secondary">템플릿 다운로드</a>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.6rem] border border-[rgba(56,41,29,0.08)] bg-white/75 p-5">
              <h3 className="text-lg font-black">import 단계</h3>
              <p className="mt-2 text-sm leading-7 text-[#665950]">병원, 미용, 유치원, 장례 카테고리만 지원합니다. 업로드 후 미리보기에서 신규/수정 대상을 확인하고 승인해야 places에 반영됩니다.</p>

              <div className="mt-4 space-y-3 rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-[#fffdfa] p-4 text-sm leading-7 text-[#5f5550]">
                <p><span className="font-black text-[#2b211b]">1.</span> 템플릿으로 XLSX/CSV 작성</p>
                <p><span className="font-black text-[#2b211b]">2.</span> `/admin/import`에서 preview 확인</p>
                <p><span className="font-black text-[#2b211b]">3.</span> 관리자 승인 후 MANUAL_DATA 반영</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
                <span className="badge">ANIMAL_HOSPITAL</span>
                <span className="badge">GROOMING</span>
                <span className="badge">DAYCARE</span>
                <span className="badge">FUNERAL</span>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-[#f7f1ea] p-4 text-sm leading-7 text-[#5f5550]">
                <p className="font-black text-[#2b211b]">운영 규칙</p>
                <ul className="mt-2 space-y-1">
                  <li>· production은 더 이상 외부 LocalData 원천을 직접 호출하지 않습니다.</li>
                  <li>· 수동 import는 preview 승인 전까지 places를 직접 수정하지 않습니다.</li>
                  <li>· 주소를 수정하면 시도/시군구/동은 자동으로 다시 계산됩니다.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black">양식 컬럼 규격</h3>
                <span className="badge">{MANUAL_PLACE_TEMPLATE_COLUMNS.length}개 컬럼</span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(56,41,29,0.08)] text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
                      <th className="px-3 py-3">Field</th>
                      <th className="px-3 py-3">필수</th>
                      <th className="px-3 py-3">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MANUAL_PLACE_TEMPLATE_COLUMNS.map((column) => (
                      <tr key={column.key} className="border-b border-[rgba(56,41,29,0.05)] align-top last:border-b-0">
                        <td className="px-3 py-3 font-black text-[#2b211b]">{column.key}</td>
                        <td className="px-3 py-3 text-[#5f5550]">{column.required}</td>
                        <td className="px-3 py-3 leading-7 text-[#665950]">{column.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">System Guard</p>
          <h2 className="mt-3 text-2xl font-black">운영 상태와 즉시 액션</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[#5f5550]">
            <div className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">외부 원천 동기화</p>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black ${externalSyncDisabled ? "bg-[#fff0f0] text-[#b13f3f]" : "bg-[rgba(31,74,64,0.09)] text-[var(--brand)]"}`.trim()}>{externalSyncDisabled ? "차단중" : "활성"}</span>
              </div>
              <p className="mt-2">403 대응 이후에는 수동 업로드가 운영 기본값입니다. 정식 OpenAPI 확보 전까지 production 재시도는 막아둔 상태입니다.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4">
              <p className="font-black">검수 대기 묶음</p>
              <p className="mt-2">실종 {pendingLostPetCount}건, 업체 요청 {pendingClaimCount}건, 가격 제보 {pendingReportCount}건</p>
              <a href={withSecret("/admin/data-health", secret)} className="mt-3 inline-flex text-sm font-black text-[var(--brand)]">검수센터 열기</a>
            </div>
            <div className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4">
              <p className="font-black">최근 실패 로그</p>
              <p className="mt-2">실패 누적 {failedSyncCount}건. skipped 이유와 에러 메시지는 동기화 로그에서 바로 확인할 수 있습니다.</p>
              <a href={withSecret("/admin/sync-logs", secret)} className="mt-3 inline-flex text-sm font-black text-[var(--brand)]">동기화 로그 보기</a>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="card rounded-[2rem] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Member Management</p>
          <h2 className="mt-3 text-2xl font-black">회원·참여자 운영</h2>
          <p className="mt-3 text-sm leading-7 text-[#665950]">현재는 실제 로그인 회원 모델이 없어서, masked 연락처 기반으로 운영 참여자를 관리합니다. 이후 회원 시스템을 붙이면 이 섹션이 실제 계정 관리로 확장될 자리입니다.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat title="업체 요청자" value={formatNumber(distinctClaimContacts.length)} note="phoneMasked 기준" compact />
            <Stat title="실종 등록자" value={formatNumber(distinctLostPetContacts.length)} note="contactMasked 기준" compact />
            <Stat title="목격 제보자" value={formatNumber(distinctLostPetReportContacts.length)} note="reporterContactMasked 기준" compact />
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Activity Feed</p>
              <h2 className="mt-3 text-2xl font-black">최근 참여 활동</h2>
            </div>
            <span className="badge">{participantFeed.length}건</span>
          </div>
          <div className="mt-4 space-y-3">
            {participantFeed.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">{item.title}</p>
                  <span className="badge">{item.kind}</span>
                </div>
                <p className="mt-1 text-[#665950]">{item.meta}</p>
                <p className="mt-2 text-[#665950]">{item.description}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#9d8e82]">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Board & Posts</p>
              <h2 className="mt-3 text-2xl font-black">게시판·글 관리</h2>
            </div>
            <span className="badge">가이드 {guideCount}건</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ListCard
              title="최근 가이드 글"
              items={recentGuides.map((item) => ({
                id: item.id,
                title: item.title,
                meta: item.category,
                note: item.summary,
                date: item.updatedAt,
              }))}
              emptyMessage="가이드 문서가 없습니다."
            />
            <ListCard
              title="최근 실종 게시글"
              items={recentLostPets.map((item) => ({
                id: item.id,
                title: item.petName,
                meta: item.status,
                note: `${item.lostSido}${item.lostSigungu ? ` · ${item.lostSigungu}` : ""}`,
                date: item.createdAt,
              }))}
              emptyMessage="실종 게시글이 없습니다."
            />
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Report Queue</p>
              <h2 className="mt-3 text-2xl font-black">제보·업체 요청 최신 흐름</h2>
            </div>
            <a href={withSecret("/admin/data-health", secret)} className="btn-secondary">검수 화면</a>
          </div>
          <div className="mt-5 grid gap-4">
            <ListCard
              title="업체 요청"
              items={recentClaims.map((item) => ({
                id: item.id,
                title: item.businessName,
                meta: `${item.status} · ${item.ownerName}`,
                note: item.place?.name ? `연결 장소 ${item.place.name}` : item.requestType,
                date: item.submittedAt,
              }))}
              emptyMessage="업체 요청이 없습니다."
              dense
            />
            <ListCard
              title="가격 제보"
              items={recentPriceReports.map((item) => ({
                id: item.id,
                title: item.itemName,
                meta: `${item.status} · ${item.category}`,
                note: item.place?.name ?? (item.reportNote || "장소 미연결 제보"),
                date: item.createdAt,
              }))}
              emptyMessage="가격 제보가 없습니다."
              dense
            />
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Place Management</p>
              <h2 className="mt-3 text-2xl font-black">장소·업체 관리</h2>
            </div>
            <span className="badge">활성 장소 {formatNumber(activePlaceCount)}건</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">카테고리 분포</h3>
                <span className="badge">{categorySummary.length}개</span>
              </div>
              <div className="mt-4 space-y-3">
                {categorySummary.map((item) => (
                  <div key={item.category} className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[rgba(56,41,29,0.06)] bg-[#fffdfa] px-4 py-3 text-sm">
                    <span className="font-black">{item.category}</span>
                    <span>{formatNumber(item._count._all)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">데이터 출처 분포</h3>
                <span className="badge">{sourceSummary.length}개</span>
              </div>
              <div className="mt-4 space-y-3">
                {sourceSummary.map((item) => (
                  <div key={item.sourceType} className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[rgba(56,41,29,0.06)] bg-[#fffdfa] px-4 py-3 text-sm">
                    <span className="font-black">{item.sourceType}</span>
                    <span>{formatNumber(item._count._all)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Recent Entities</p>
              <h2 className="mt-3 text-2xl font-black">최근 등록·수정 데이터</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <ListCard
              title="최근 장소"
              items={recentPlaces.map((item) => ({
                id: item.id,
                title: item.name,
                meta: `${item.category} · ${item.sourceType}`,
                note: `${item.address ?? "주소 없음"}${item.ownerVerified ? " · 업체 인증" : ""}${item.isActive ? " · 활성" : " · 비활성"}`,
                date: item.updatedAt,
              }))}
              emptyMessage="최근 장소가 없습니다."
              dense
            />
            <ListCard
              title="최근 식당 원천"
              items={recentRestaurants.map((item) => ({
                id: item.id,
                title: item.name,
                meta: item.status,
                note: `${item.sido}${item.sigungu ? ` · ${item.sigungu}` : ""}`,
                date: item.updatedAt,
              }))}
              emptyMessage="최근 식당 데이터가 없습니다."
              dense
            />
          </div>
        </article>
      </section>

      <section className="mt-6 card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Sync & Operations</p>
            <h2 className="mt-3 text-2xl font-black">최근 운영 로그</h2>
          </div>
          <a href={withSecret("/admin/sync-logs", secret)} className="btn-secondary">전체 로그 보기</a>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(56,41,29,0.08)] text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Rows</th>
                <th className="px-3 py-3">Started</th>
                <th className="px-3 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {recentSyncLogs.map((log) => (
                <tr key={log.id} className="border-b border-[rgba(56,41,29,0.05)] align-top last:border-b-0">
                  <td className="px-3 py-4 font-black">{log.source}</td>
                  <td className="px-3 py-4"><SyncStatusBadge status={log.status} /></td>
                  <td className="px-3 py-4">{formatNumber(log.totalCount)}</td>
                  <td className="px-3 py-4 text-[#665950]">{formatDateTime(log.startedAt)}</td>
                  <td className="px-3 py-4 leading-7 text-[#665950]">{log.message ?? log.skippedReason ?? log.errorMessage ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function buildAdminConsolePath(params: {
  secret?: string;
  uploadStatus?: string;
  uploadRows?: string;
  added?: string;
  updated?: string;
  deactivated?: string;
  profiles?: string;
  uploadMessage?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.secret) searchParams.set("secret", params.secret);
  if (params.uploadStatus) searchParams.set("uploadStatus", params.uploadStatus);
  if (params.uploadRows) searchParams.set("uploadRows", params.uploadRows);
  if (params.added) searchParams.set("added", params.added);
  if (params.updated) searchParams.set("updated", params.updated);
  if (params.deactivated) searchParams.set("deactivated", params.deactivated);
  if (params.profiles) searchParams.set("profiles", params.profiles);
  if (params.uploadMessage) searchParams.set("uploadMessage", params.uploadMessage);
  const query = searchParams.toString();
  return query ? `/admin?${query}` : "/admin";
}

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}secret=${encodeURIComponent(secret)}`;
}

function formatDateTime(value: Date) {
  return value.toLocaleString("ko-KR");
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function Stat({ title, value, note, compact = false }: { title: string; value: string; note: string; compact?: boolean }) {
  return (
    <div className={`stat-tile ${compact ? "p-4" : "p-5"}`.trim()}>
      <p className="text-xs font-black text-[#9d8e82]">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#665950]">{note}</p>
    </div>
  );
}

function AdminLinkCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a href={href} className="card rounded-[1.6rem] p-4 transition hover:-translate-y-1">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9d8e82]">Action</p>
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#665950]">{description}</p>
    </a>
  );
}

function ListCard({
  title,
  items,
  emptyMessage,
  dense = false,
}: {
  title: string;
  items: Array<{ id: string; title: string; meta: string; note: string; date: Date }>;
  emptyMessage: string;
  dense?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[rgba(56,41,29,0.08)] bg-white/78 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black">{title}</h3>
        <span className="badge">{items.length}건</span>
      </div>
      <div className={dense ? "mt-4 space-y-2" : "mt-4 space-y-3"}>
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.06)] bg-[#fffdfa] px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black">{item.title}</p>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9d8e82]">{formatDateTime(item.date)}</p>
            </div>
            <p className="mt-1 text-[#5f5550]">{item.meta}</p>
            <p className="mt-2 leading-7 text-[#665950]">{item.note}</p>
          </div>
        )) : <p className="text-sm text-[#665950]">{emptyMessage}</p>}
      </div>
    </div>
  );
}