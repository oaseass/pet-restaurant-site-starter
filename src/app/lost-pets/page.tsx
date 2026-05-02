import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LostPetCard } from "@/components/LostPetCard";
import { EmptyState } from "@/components/EmptyState";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getCategoryCountsSnapshot, getAnimalNoticesSnapshot } from "@/lib/public-data";
import type { PublicAnimalNotice } from "@/lib/public-data";

export const dynamic = "force-dynamic";

function AnimalNoticeCard({ notice }: { notice: PublicAnimalNotice }) {
  const sexLabel = notice.sexCd === "M" ? "수컷" : notice.sexCd === "F" ? "암컷" : "미상";
  const neuterLabel = notice.neuterYn === "Y" ? "중성화" : notice.neuterYn === "N" ? "미중성화" : "";
  const stateColor = notice.processState === "보호중" ? "#2563eb" : notice.processState === "종료" ? "#6b7280" : "#d97706";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "#fff", fontSize: "12px" }}>
      {notice.popfile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={notice.popfile} alt={notice.kindCd} style={{ width: "100%", height: "140px", objectFit: "cover" }} loading="lazy" />
      ) : (
        <div style={{ width: "100%", height: "140px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "11px" }}>사진 없음</div>
      )}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, color: "#111", fontSize: "13px" }}>{notice.kindCd || "미상"}</span>
          <span style={{ fontSize: "10px", fontWeight: 700, color: stateColor }}>{notice.processState}</span>
        </div>
        <div style={{ color: "#555", marginBottom: "2px" }}>{notice.happenPlace}</div>
        <div style={{ color: "#777", marginBottom: "4px" }}>{notice.happenDt ? `발견 ${notice.happenDt.slice(0,4)}-${notice.happenDt.slice(4,6)}-${notice.happenDt.slice(6,8)}` : ""} · {sexLabel}{neuterLabel ? ` · ${neuterLabel}` : ""}</div>
        <div style={{ color: "#555", marginBottom: "2px" }}>보호소: {notice.careNm}</div>
        <div style={{ color: "#777", marginBottom: "4px", fontSize: "11px" }}>{notice.careAddr}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "#9ca3af" }}>공고 {notice.noticeSdt?.slice(0,4)}-{notice.noticeSdt?.slice(4,6)}-{notice.noticeSdt?.slice(6,8)} ~ {notice.noticeEdt?.slice(0,4)}-{notice.noticeEdt?.slice(4,6)}-{notice.noticeEdt?.slice(6,8)}</span>
          {notice.careTel && (
            <a href={`tel:${notice.careTel}`} style={{ fontSize: "11px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>{notice.careTel}</a>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function LostPetsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const isShelterTab = !tab || tab === "shelter";

  const [items, counts, notices] = await Promise.all([
    prisma.lostPet.findMany({
      where: { status: { in: ["APPROVED", "FOUND"] } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    getCategoryCountsSnapshot(),
    getAnimalNoticesSnapshot(),
  ]);

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
          <Link
            href="/lost-pets/new"
            style={{
              fontSize: "11px", fontWeight: 700, color: "#fff",
              background: "#c2410c", borderRadius: "6px",
              padding: "5px 10px", textDecoration: "none",
            }}
          >
            실종 글 올리기
          </Link>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 14px" }}>
        <Link
          href="/lost-pets?tab=pets"
          style={{
            padding: "8px 14px", fontSize: "12px", fontWeight: isShelterTab ? 500 : 700,
            color: isShelterTab ? "#6b7280" : "#c2410c",
            borderBottom: isShelterTab ? "2px solid transparent" : "2px solid #c2410c",
            textDecoration: "none", marginRight: "4px",
          }}
        >
          실종 제보
        </Link>
        <Link
          href="/lost-pets"
          style={{
            padding: "8px 14px", fontSize: "12px", fontWeight: isShelterTab ? 700 : 500,
            color: isShelterTab ? "#2563eb" : "#6b7280",
            borderBottom: isShelterTab ? "2px solid #2563eb" : "2px solid transparent",
            textDecoration: "none",
          }}
        >
          보호동물 공고 {notices.length > 0 && <span style={{ fontSize: "10px", background: "#eff6ff", color: "#2563eb", borderRadius: "4px", padding: "1px 5px", marginLeft: "4px" }}>{notices.length}</span>}
        </Link>
      </div>

      {isShelterTab ? (
        <>
          {/* 통계 바 */}
          <div className="portal-notice-bar">
            <span style={{ fontSize: "12px", color: "#777" }}>
              최근 30일 공고 <strong style={{ color: "#222" }}>{notices.length}</strong>건
              {notices.length === 0 && " (데이터 준비 중)"}
            </span>
          </div>
          {/* 공고 목록 */}
          <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {notices.length > 0
              ? notices.map((notice) => <AnimalNoticeCard key={notice.desertionNo} notice={notice} />)
              : <EmptyState title="보호동물 공고 데이터 준비 중입니다." description="농림축산식품부 공공데이터 연동 예정입니다." character="cat-peeking" />}
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

