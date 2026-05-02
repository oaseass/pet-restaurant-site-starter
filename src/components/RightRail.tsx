import Link from "next/link";
import { MapPin, AlertCircle, BookOpenText, PlusCircle } from "lucide-react";

interface RightRailProps {
  restaurantCount?: number;
  lastUpdatedAt?: string | null;
}

const POPULAR_REGIONS = ["서울", "부산", "제주", "경기", "대구", "인천"];

const TODAY_CHECKLIST = [
  "동반 가능 여부 전화 확인",
  "예방접종 기록 챙기기",
  "이동장·물·간식 준비",
  "주차 가능 여부 확인",
];

export function RightRail({ restaurantCount, lastUpdatedAt }: RightRailProps) {
  const updatedDateStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleDateString("ko-KR")
    : null;

  return (
    <aside className="hidden xl:block" style={{ width: "300px", flexShrink: 0 }}>
      <div
        className="sticky"
        style={{ top: "68px", display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {/* 지도 열기 */}
        <div
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-[var(--brand)]" />
            <p className="text-sm font-black text-[var(--ink)]">지도에서 찾기</p>
          </div>
          <p className="text-xs leading-5 text-[var(--muted)] mb-3">
            내 주변 식당, 병원, 미용샵을 지도에서 바로 확인하세요.
          </p>
          <Link
            href="/map"
            className="block w-full rounded-full bg-[var(--brand)] px-4 py-2 text-center text-xs font-bold text-white hover:bg-[#195748] transition-colors"
          >
            지도 열기
          </Link>
        </div>

        {/* 인기 지역 */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs font-black text-[var(--ink)] mb-3">지역별 탐색</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_REGIONS.map((region) => (
              <Link
                key={region}
                href={`/regions/${encodeURIComponent(region)}`}
                className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors"
              >
                {region}
              </Link>
            ))}
          </div>
        </div>

        {/* 데이터 기준일 */}
        {(restaurantCount !== undefined || updatedDateStr) && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-xs font-black text-[var(--ink)] mb-2">데이터 현황</p>
            {restaurantCount !== undefined && (
              <p className="text-xs text-[var(--muted)] mb-1">
                등록 식당 <span className="font-bold text-[var(--ink)]">{restaurantCount.toLocaleString("ko-KR")}건</span>
              </p>
            )}
            {updatedDateStr && (
              <p className="text-xs text-[var(--muted)]">
                최근 업데이트 <span className="font-bold text-[var(--ink)]">{updatedDateStr}</span>
              </p>
            )}
          </div>
        )}

        {/* 업체 등록 */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <PlusCircle size={14} className="text-[var(--brand)]" />
            <p className="text-xs font-black text-[var(--ink)]">업체 등록·제보</p>
          </div>
          <p className="text-xs leading-5 text-[var(--muted)] mb-3">
            운영 중인 업체 정보나 수정사항을 제보해 주세요.
          </p>
          <Link
            href="/business"
            className="block w-full rounded-full border border-[var(--line)] px-4 py-2 text-center text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
          >
            업체 등록하기
          </Link>
        </div>

        {/* 실종 제보 */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-[var(--accent)]" />
            <p className="text-xs font-black text-[var(--ink)]">댕냥이 찾아요</p>
          </div>
          <p className="text-xs leading-5 text-[var(--muted)] mb-3">
            실종된 반려동물 정보를 등록하거나 제보해 주세요.
          </p>
          <Link
            href="/lost-pets"
            className="block w-full rounded-full border border-[var(--line)] px-4 py-2 text-center text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
          >
            제보 보러가기
          </Link>
        </div>

        {/* 오늘의 체크리스트 */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenText size={14} className="text-[var(--brand)]" />
            <p className="text-xs font-black text-[var(--ink)]">외출 전 체크</p>
          </div>
          <ul className="flex flex-col gap-2">
            {TODAY_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-[var(--muted)] leading-4">
                <span
                  className="mt-0.5 shrink-0 rounded border border-[var(--line)] bg-[var(--bg)]"
                  style={{ width: 12, height: 12, display: "inline-block" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
