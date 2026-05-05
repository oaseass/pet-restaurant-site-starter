import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/PublicPageShell";
import { SmartLink } from "@/components/SmartLink";
import { getAnimalNoticesSnapshot, getCategoryCountsSnapshot } from "@/lib/public-data";

function formatNoticeDate(value: string) {
  if (!value || value.length < 8) return "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function sexLabel(value: string) {
  if (value === "M") return "수컷";
  if (value === "F") return "암컷";
  return "미상";
}

function neuterLabel(value: string) {
  if (value === "Y") return "예";
  if (value === "N") return "아니오";
  return "미상";
}

function normalizeNoticeImageUrl(value: string) {
  return value.trim().replace(/^http:\/\//i, "https://");
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
      <p className="text-[11px] font-black text-[#6b7280]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-[#111827]">{value?.trim() || "미상"}</p>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ desertionNo: string }> }) {
  const { desertionNo } = await params;
  const notices = await getAnimalNoticesSnapshot();
  const notice = notices.find((item) => item.desertionNo === decodeURIComponent(desertionNo));

  return {
    title: notice ? `${notice.kindCd || "보호동물"} 공고 | 댕냥지도` : "보호동물 공고 | 댕냥지도",
    description: notice ? `${notice.orgNm || "보호기관"} 보호동물 공고 상세 정보입니다.` : "보호동물 공고 상세 정보입니다.",
  };
}

export default async function AnimalNoticeDetailPage({ params }: { params: Promise<{ desertionNo: string }> }) {
  const { desertionNo } = await params;
  const [counts, notices] = await Promise.all([getCategoryCountsSnapshot(), getAnimalNoticesSnapshot()]);
  const notice = notices.find((item) => item.desertionNo === decodeURIComponent(desertionNo));

  if (!notice) notFound();

  const noticeStart = formatNoticeDate(notice.noticeSdt);
  const noticeEnd = formatNoticeDate(notice.noticeEdt);
  const foundDate = formatNoticeDate(notice.happenDt);
  const mapQuery = encodeURIComponent(notice.careAddr || notice.careNm || notice.happenPlace || "");
  const imageUrl = notice.popfile ? normalizeNoticeImageUrl(notice.popfile) : "";

  return (
    <PublicPageShell restaurantCount={counts.restaurantCount} lastUpdatedAt={counts.lastUpdatedAt}>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <SmartLink href="/lost-pets" className="text-sm font-black text-[#2563eb] hover:underline">
          ← 보호동물 공고 목록
        </SmartLink>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={notice.kindCd || "보호동물 사진"}
                width={720}
                height={520}
                className="h-[320px] w-full object-cover sm:h-[420px]"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center bg-[#f3f4f6] text-sm font-bold text-[#9ca3af] sm:h-[420px]">사진 없음</div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-black text-[#2563eb]">{notice.processState || "상태 미상"}</span>
              <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-[#4b5563]">공고번호 {notice.noticeNo || notice.desertionNo}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">{notice.kindCd || "보호동물"}</h1>
            <p className="mt-3 text-sm leading-7 text-[#6b7280]">
              {notice.orgNm || "보호기관"} 공고입니다. 입양·인계 문의 전 공고 상태와 보호소 연락처를 다시 확인해 주세요.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {notice.careTel && (
                <a href={`tel:${notice.careTel}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 py-2 text-sm font-black text-white">
                  보호소 전화하기
                </a>
              )}
              {mapQuery && (
                <a href={`https://map.kakao.com/link/search/${mapQuery}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#2563eb] px-5 py-2 text-sm font-black text-[#2563eb]">
                  보호소 지도 보기
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="발견일" value={foundDate || "미상"} />
          <DetailItem label="발견장소" value={notice.happenPlace} />
          <DetailItem label="공고기간" value={`${noticeStart || "미상"}${noticeEnd ? ` ~ ${noticeEnd}` : ""}`} />
          <DetailItem label="성별" value={sexLabel(notice.sexCd)} />
          <DetailItem label="중성화" value={neuterLabel(notice.neuterYn)} />
          <DetailItem label="나이·체중" value={[notice.age, notice.weight].filter(Boolean).join(" · ")} />
          <DetailItem label="색상" value={notice.colorCd} />
          <DetailItem label="보호소" value={notice.careNm} />
          <DetailItem label="보호주소" value={notice.careAddr} />
        </section>

        <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black text-[#6b7280]">특징</p>
          <p className="mt-3 text-sm leading-7 text-[#111827]">{notice.specialMark || "등록된 특징 정보가 없습니다."}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-5 text-sm leading-7 text-[#1e3a8a]">
          보호동물 공고는 지자체·보호소 공개 자료를 바탕으로 표시됩니다. 실제 상태, 입양 가능 여부, 방문 가능 시간은 보호소에 직접 확인해 주세요.
        </section>
      </main>
    </PublicPageShell>
  );
}