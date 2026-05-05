import { prisma } from "@/lib/prisma";
import { LostPetCard } from "@/components/LostPetCard";
import { EmptyState } from "@/components/EmptyState";
import { PublicPageShell } from "@/components/PublicPageShell";
import { SmartLink } from "@/components/SmartLink";
import { getCategoryCountsSnapshot, getAnimalNoticeCountsSnapshot, getAnimalNoticesSnapshot } from "@/lib/public-data";
import type { PublicAnimalNotice } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const SHELTER_PAGE_SIZE = 30;

function formatNoticeDate(value: string) {
  if (!value || value.length < 8) return "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function shortenFoundRegion(happenPlace: string, orgName: string) {
  const source = (happenPlace || orgName || "발견 위치 미상").replace(/\s+/g, " ").trim();
  if (source.length <= 22) return source;
  const parts = source.split(" ").filter(Boolean).slice(0, 3).join(" ");
  return parts || source.slice(0, 22);
}

function shelterPageHref(page: number) {
  return page <= 1 ? "/lost-pets?tab=shelter" : `/lost-pets?tab=shelter&page=${page}`;
}

function normalizeNoticeImageUrl(value: string) {
  return value.trim().replace(/^http:\/\//i, "https://");
}

function AnimalNoticeCard({ notice, index }: { notice: PublicAnimalNotice; index: number }) {
  const sexLabel = notice.sexCd === "M" ? "수컷" : notice.sexCd === "F" ? "암컷" : "미상";
  const stateColor = notice.processState === "보호중" ? "#2563eb" : notice.processState === "종료" ? "#6b7280" : "#d97706";
  const foundRegion = shortenFoundRegion(notice.happenPlace, notice.orgNm);
  const noticeStart = formatNoticeDate(notice.noticeSdt);
  const noticeEnd = formatNoticeDate(notice.noticeEdt);
  const detailHref = `/lost-pets/notices/${encodeURIComponent(notice.desertionNo)}`;
  const imageUrl = notice.popfile ? normalizeNoticeImageUrl(notice.popfile) : "";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "#fff", fontSize: "12px" }}>
      <SmartLink href={detailHref} className="block" aria-label={`${notice.kindCd || "보호동물"} 공고 상세 보기`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={notice.kindCd || "보호동물 사진"}
            width={320}
            height={180}
            style={{ width: "100%", height: "140px", objectFit: "cover" }}
            loading={index < 6 ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <div style={{ width: "100%", height: "140px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "11px" }}>사진 없음</div>
        )}
      </SmartLink>
      <div style={{ padding: "8px 10px" }}>
        <SmartLink href={detailHref} className="block rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, color: "#111", fontSize: "13px" }}>{notice.kindCd || "미상"}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: stateColor }}>{notice.processState}</span>
          </div>
          <div style={{ color: "#555", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{foundRegion}</div>
          <div style={{ color: "#777", marginBottom: "4px" }}>{formatNoticeDate(notice.happenDt) ? `발견 ${formatNoticeDate(notice.happenDt)}` : "발견일 미상"} · {sexLabel}</div>
          <div style={{ color: "#555", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>보호소: {notice.careNm || "미상"}</div>
        </SmartLink>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "#9ca3af" }}>공고 {noticeStart}{noticeEnd ? ` ~ ${noticeEnd}` : ""}</span>
          {notice.careTel && (
            <a href={`tel:${notice.careTel}`} style={{ fontSize: "11px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>{notice.careTel}</a>
          )}
        </div>
        <SmartLink href={detailHref} style={{ display: "inline-flex", marginTop: "8px", fontSize: "11px", color: "#2563eb", fontWeight: 800, textDecoration: "none" }}>
          자세히 보기 →
        </SmartLink>
      </div>
    </div>
  );
}

export default async function LostPetsPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const { tab, page: pageParam } = await searchParams;
  const isShelterTab = !tab || tab === "shelter";

  const [items, counts, notices, noticeCounts] = await Promise.all([
    prisma.lostPet.findMany({
      where: { status: { in: ["APPROVED", "FOUND"] } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    getCategoryCountsSnapshot(),
    getAnimalNoticesSnapshot(),
    getAnimalNoticeCountsSnapshot(),
  ]);

  const noticeTotal = noticeCounts.total || notices.length;
  const totalPages = Math.max(1, Math.ceil(notices.length / SHELTER_PAGE_SIZE));
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const currentPage = Math.min(Math.max(Number.isFinite(parsedPage) ? parsedPage : 1, 1), totalPages);
  const pageStart = (currentPage - 1) * SHELTER_PAGE_SIZE;
  const noticesForPage = notices.slice(pageStart, pageStart + SHELTER_PAGE_SIZE);
  const pageEnd = notices.length > 0 ? pageStart + noticesForPage.length : 0;
  const pageRangeLabel = notices.length > 0 ? `${pageStart + 1}-${pageEnd}` : "0";

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      {/* 상단 헤더 */}
      <div className="portal-section-header">
        <div>
          <h1 style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {isShelterTab ? "보호동물 공고" : "댕냥이 찾아요"}
          </h1>
          <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
            {isShelterTab ? "지자체·보호소 공개 보호동물 목록" : "실종 반려동물 제보 목록"}
          </p>
        </div>
        {!isShelterTab && (
          <SmartLink
            href="/lost-pets/new"
            style={{
              fontSize: "11px", fontWeight: 700, color: "#fff",
              background: "#c2410c", borderRadius: "6px",
              padding: "5px 10px", textDecoration: "none",
            }}
          >
            실종 글 올리기
          </SmartLink>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 14px" }}>
        <SmartLink
          href="/lost-pets?tab=pets"
          style={{
            padding: "8px 14px", fontSize: "12px", fontWeight: isShelterTab ? 500 : 700,
            color: isShelterTab ? "#6b7280" : "#c2410c",
            borderBottom: isShelterTab ? "2px solid transparent" : "2px solid #c2410c",
            textDecoration: "none", marginRight: "4px",
          }}
        >
          실종 제보
        </SmartLink>
        <SmartLink
          href="/lost-pets"
          style={{
            padding: "8px 14px", fontSize: "12px", fontWeight: isShelterTab ? 700 : 500,
            color: isShelterTab ? "#2563eb" : "#6b7280",
            borderBottom: isShelterTab ? "2px solid #2563eb" : "2px solid transparent",
            textDecoration: "none",
          }}
        >
          보호동물 공고 {noticeTotal > 0 && <span style={{ fontSize: "10px", background: "#eff6ff", color: "#2563eb", borderRadius: "4px", padding: "1px 5px", marginLeft: "4px" }}>{noticeTotal.toLocaleString("ko-KR")}</span>}
        </SmartLink>
      </div>

      {isShelterTab ? (
        <>
          {/* 통계 바 */}
          <div className="portal-notice-bar">
            <span style={{ fontSize: "12px", color: "#777" }}>
              최근 30일 공고 <strong style={{ color: "#222" }}>{noticeTotal.toLocaleString("ko-KR")}</strong>건 중 {pageRangeLabel}건 표시
              {noticeTotal === 0 && " (공개 데이터 없음)"}
            </span>
          </div>
          {notices.length > SHELTER_PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "10px 14px 0" }}>
              <SmartLink
                href={shelterPageHref(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                style={{
                  minWidth: "72px",
                  textAlign: "center",
                  padding: "7px 10px",
                  border: "1px solid #dbe4ee",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: currentPage <= 1 ? "#9ca3af" : "#2563eb",
                  background: currentPage <= 1 ? "#f3f4f6" : "#fff",
                  pointerEvents: currentPage <= 1 ? "none" : "auto",
                }}
              >
                이전
              </SmartLink>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>
                {currentPage.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}
              </span>
              <SmartLink
                href={shelterPageHref(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                style={{
                  minWidth: "72px",
                  textAlign: "center",
                  padding: "7px 10px",
                  border: "1px solid #dbe4ee",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: currentPage >= totalPages ? "#9ca3af" : "#2563eb",
                  background: currentPage >= totalPages ? "#f3f4f6" : "#fff",
                  pointerEvents: currentPage >= totalPages ? "none" : "auto",
                }}
              >
                다음
              </SmartLink>
            </div>
          )}
          {/* 공고 목록 */}
          <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {noticesForPage.length > 0
              ? noticesForPage.map((notice, index) => <AnimalNoticeCard key={notice.desertionNo} notice={notice} index={index} />)
              : <EmptyState title="보호동물 공고가 없습니다." description="새 공고가 반영되면 이 화면에 30건 단위로 표시됩니다." character="cat-peeking" />}
          </div>
        </>
      ) : (
        <>
          {/* 통계 바 */}
          <div className="portal-notice-bar">
            <span style={{ fontSize: "12px", color: "#777" }}>
              공개 제보 <strong style={{ color: "#222" }}>{items.length}</strong>건 표시 중
            </span>
          </div>
          {/* 목록 */}
          <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
            {items.length > 0
              ? items.map((item) => <LostPetCard key={item.id} item={item} />)
              : <EmptyState title="공개 중인 실종 제보가 없습니다." description="새 글을 등록하면 내부 검수 후 공개됩니다." character="cat-peeking" />}
          </div>
        </>
      )}
    </PublicPageShell>
  );
}

